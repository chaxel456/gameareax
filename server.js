// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');

// ✅ Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ✅ Express app
const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", process.env.FRONTEND_ORIGIN || "*"]
}));

// ✅ HTTP + Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ✅ Memory store (for quick access)
const rooms = new Map();
const queues = {}; // For auto-matching

// ✅ Create room in Supabase
async function createRoom(data) {
  const { code, game, mode, fee, currency } = data;
  const { data: room, error } = await supabase
    .from('rooms')
    .insert([{ code, game, mode, fee, currency }])
    .select()
    .single();

  if (error) console.error('❌ Error creating room:', error);
  else console.log('✅ Room saved:', room);
}

// ✅ Add player to Supabase
async function addPlayer(roomId, playerName) {
  const { data, error } = await supabase
    .from('room_players')
    .insert([{ room_id: roomId, name: playerName }])
    .select()
    .single();

  if (error) console.error('❌ Error adding player:', error);
  else console.log('✅ Player added:', data);
}

// ✅ SOCKET.IO EVENTS
io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  // List all rooms
  socket.on('rooms:list', () => {
    socket.emit('rooms:list', Array.from(rooms.values()));
  });

  // Create room
  socket.on('room:create', ({ gameId, host, mode, entryFee, currency }) => {
    const roomId = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);
    const cap = mode === '2v2' ? 4 : mode === 'squad' ? 8 : 2;

    const room = {
      id: roomId,
      gameId,
      host,
      players: [{ ...host, id: socket.id, ready: false }],
      mode,
      entryFee,
      currency,
      capacity: cap,
      status: 'waiting',
      createdAt: Date.now(),
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    io.emit('rooms:update', Array.from(rooms.values()));
    socket.emit('room:created', room);
    console.log(`✅ Room created: ${roomId}`);

    // Save to Supabase
    createRoom({ code: roomId, game: gameId, mode, fee: entryFee, currency });
  });

  // Join room
  socket.on('room:join', ({ roomId, user }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.players.length >= room.capacity)
      return socket.emit('error', { message: 'Room full' });

    room.players.push({ ...user, id: socket.id, ready: false });
    socket.join(roomId);
    io.to(roomId).emit('room:update', room);
    io.emit('rooms:update', Array.from(rooms.values()));
    console.log(`🟡 Player joined: ${roomId}`);

    // Save player
    addPlayer(roomId, user.name || user.username || socket.id);
  });

  // Player ready
  socket.on('room:set-ready', ({ roomId, ready }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const p = room.players.find((x) => x.id === socket.id);
    if (p) p.ready = !!ready;
    io.to(roomId).emit('room:update', room);

    if (room.players.length >= 2 && room.players.every((x) => x.ready)) {
      room.status = 'playing';
      io.to(roomId).emit('match_started', {
        roomId,
        startedAt: new Date().toISOString(),
      });
      console.log(`⚡ Match started: ${roomId}`);
    }
  });

  // Disconnect handling
  socket.on('disconnecting', () => {
    const joined = Array.from(socket.rooms).filter((r) => r !== socket.id);
    joined.forEach((r) => {
      const room = rooms.get(r);
      if (!room) return;
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(r);
      } else {
        io.to(r).emit('room:update', room);
      }
    });
    io.emit('rooms:update', Array.from(rooms.values()));
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
  });
});

// ✅ HTTP Webhook (optional admin trigger)
app.post('/api/match/start', (req, res) => {
  const token = req.headers['x-bz-token'];
  if (token !== process.env.BZ_ADMIN_TOKEN)
    return res.status(401).json({ error: 'unauthorized' });

  const { room } = req.body || {};
  if (!room) return res.status(400).json({ error: 'room required' });

  if (rooms.has(room)) {
    const r = rooms.get(room);
    r.status = 'playing';
    io.to(room).emit('match_started', { room, startedAt: new Date().toISOString() });
  }
  return res.json({ ok: true });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
