const { createClient } = require('@supabase/supabase-js');
//  Replace with your actual values
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CLEAN FINAL server.js (CommonJS)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

// Create express app
const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500"] // Modify when deploying
}));

// Create HTTP + Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
    methods: ["GET", "POST"]
  }
});

//  In-memory room storage
const roomsMeta = {}; // { ROOM-CODE: { players: [], status: 'open' } }

//  Handle connections
io.on('connection', (socket) => {
  console.log(' Socket connected:', socket.id);

  // Join a Room
  socket.on('join_room', ({ room }) => {
    if (!room) return;

    socket.join(room);
    console.log(` ${socket.id} joined ${room}`);

    if (!roomsMeta[room]) {
      roomsMeta[room] = { players: [], status: 'open' };
    }
    roomsMeta[room].players.push(socket.id);

    io.to(room).emit('player_joined', {
      socketId: socket.id,
      playersCount: roomsMeta[room].players.length
    });
  });

  // Start Match
  socket.on('match_start', (payload) => {
    const { room, meta } = payload || {};
    if (!room) return;

    if (!roomsMeta[room]) {
      roomsMeta[room] = { players: [], status: 'open' };
    }
    roomsMeta[room].status = 'started';

    io.to(room).emit('match_started', {
      room,
      meta,
      startedAt: new Date().toISOString()
    });

    console.log(` match_started for ${room}`);
  });

  // End Match
  socket.on('match_end', (payload) => {
    const { room, result } = payload || {};
    if (!room) return;

    if (!roomsMeta[room]) {
      roomsMeta[room] = { players: [], status: 'open' };
    }
    roomsMeta[room].status = 'ended';

    io.to(room).emit('match_ended', {
      room,
      result,
      endedAt: new Date().toISOString()
    });
  });

  // On disconnect
  socket.on('disconnecting', () => {
    const joinedRooms = Array.from(socket.rooms).filter(r => r !== socket.id);

    for (const r of joinedRooms) {
      if (roomsMeta[r]) {
        roomsMeta[r].players = roomsMeta[r].players.filter(id => id !== socket.id);
        io.to(r).emit('player_left', {
          socketId: socket.id,
          playersCount: roomsMeta[r].players.length
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(' Socket disconnected:', socket.id);
  });
});

//  Admin token for secure HTTP webhook
const ADMIN_TOKEN = process.env.BZ_ADMIN_TOKEN || 'CHANGE_THIS_TOKEN';

// Webhook to start match (for game servers)
app.post('/api/match/start', (req, res) => {
  const token = req.headers['x-bz-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { room, meta } = req.body || {};
  if (!room) {
    return res.status(400).json({ error: 'room required' });
  }

  if (!roomsMeta[room]) {
    roomsMeta[room] = { players: [], status: 'open' };
  }

  roomsMeta[room].status = 'started';

  io.to(room).emit('match_started', {
    room,
    meta,
    startedAt: new Date().toISOString()
  });

  return res.json({ ok: true });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket server running on http://localhost:${PORT}`);
});
// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Optional: Supabase client (if you want to persist rooms/players)
// const { createClient } = require('@supabase/supabase-js');
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// configure Socket.IO for production
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
    methods: ['GET','POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// in-memory store (for demo). Replace with DB in prod for persistence.
const rooms = new Map();
const queues = {}; // auto-match queues by gameId

const ADMIN_TOKEN = process.env.BZ_ADMIN_TOKEN || 'CHANGE_THIS_TOKEN';

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  socket.on('rooms:list', () => {
    socket.emit('rooms:list', Array.from(rooms.values()));
  });
  createRoom({
  code: roomId,
  game: gameId,
  mode,
  fee: entryFee,
  currency
});

  socket.on('room:create', ({ gameId, host, mode, entryFee, currency }) => {
  const roomId = 'ROOM-' + Math.floor(1000 + Math.random()*9000);
  const cap = mode === '2v2' ? 4 : (mode === 'squad' ? 8 : 2);

  const room = {
    id: roomId,
    gameId,
    host,
    players: [{ ...host, id: socket.id, ready:false }],
    mode,
    entryFee,
    currency,
    capacity: cap,
    status: 'waiting',
    createdAt: Date.now()
  };

  rooms.set(roomId, room);
  socket.join(roomId);
  io.emit('rooms:update', Array.from(rooms.values()));
  socket.emit('room:created', room);
  console.log(`${socket.id} created ${roomId}`);

  //  Save to Supabase
  createRoom({
    code: roomId,
    game: gameId,
    mode,
    fee: entryFee,
    currency
  });
});

  socket.on('room:join', ({ roomId, user }) => {
  const room = rooms.get(roomId);
  if (!room) return socket.emit('error', { message: 'Room not found' });
  if (room.players.length >= room.capacity) return socket.emit('error', { message: 'Room full' });
  room.players.push({addPlayer(roomId, user.name || user.username || 'Unknown');
  socket.join(roomId);
  io.to(roomId).emit('room:update', room);
  io.emit('rooms:update', Array.from(rooms.values()));
  console.log(`${socket.id} joined ${roomId}`);

  //  Save player to Supabase
  addPlayer(roomId, user.name || user.username || socket.id);
});

  socket.on('room:set-ready', ({ roomId, ready }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const p = room.players.find(x => x.id === socket.id);
    if (p) p.ready = !!ready;
    io.to(roomId).emit('room:update', room);
    // auto-start when appropriate (all ready & >=2 players)
    if (room.players.length >= 2 && room.players.every(x => x.ready)) {
      room.status = 'playing';
      io.to(roomId).emit('match_started', { roomId, startedAt: new Date().toISOString() });
      console.log('match_started ->', roomId);
    }
  });

  // Auto-match queue
  socket.on('room:auto-match', ({ gameId, user, mode, entryFee, currency }) => {
    if (!queues[gameId]) queues[gameId] = [];
    queues[gameId].push({ socket, user, mode, entryFee, currency });
    const needed = mode === 'squad' ? 4 : (mode === '2v2' ? 4 : 2);
    if (queues[gameId].length >= needed) {
      const players = queues[gameId].splice(0, needed);
      const roomId = 'ROOM-' + Math.floor(1000 + Math.random()*9000);
      const room = {
        id: roomId,
        gameId,
        host: players[0].user,
        players: players.map(p => ({ ...p.user, id: p.socket.id, ready: true })),
        mode, entryFee, currency, capacity: needed, status: 'playing', createdAt: Date.now()
      };
      rooms.set(roomId, room);
      players.forEach(p => {
        p.socket.join(roomId);
        p.socket.emit('room:created', room);
      });
      io.emit('rooms:update', Array.from(rooms.values()));
      io.to(roomId).emit('match_started', { roomId, startedAt: new Date().toISOString() });
      console.log('Auto-match room created', roomId);
    } else {
      socket.emit('auto:queued', { gameId, position: queues[gameId].length });
    }
  });

  socket.on('disconnecting', () => {
    // remove user from rooms
    const joined = Array.from(socket.rooms).filter(r => r !== socket.id);
    joined.forEach(r => {
      const room = rooms.get(r);
      if (!room) return;
      room.players = room.players.filter(p => p.id !== socket.id);
      if (room.players.length === 0) {
        rooms.delete(r);
      } else {
        io.to(r).emit('room:update', room);
      }
    });
    io.emit('rooms:update', Array.from(rooms.values()));
  });

  socket.on('disconnect', reason => {
    console.log('Socket disconnect', socket.id, reason);
  });
});

// webhook HTTP for game server / admin to call when match starts or ends
app.post('/api/match/start', (req, res) => {
  const token = req.headers['x-bz-token'];
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });

  const { room, meta } = req.body || {};
  if (!room) return res.status(400).json({ error: 'room required' });

  if (rooms.has(room)) {
    const r = rooms.get(room);
    r.status = 'playing';
    io.to(room).emit('match_started', { room, meta, startedAt: new Date().toISOString() });
  } else {
    console.log('Webhook start for unknown room', room);
  }

  return res.json({ ok: true });
});

app.post('/api/match/end', (req, res) => {
  const token = req.headers['x-bz-token'];
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });

  const { room, result } = req.body || {};
  if (!room) return res.status(400).json({ error: 'room required' });

  if (rooms.has(room)) {
    const r = rooms.get(room);
    r.status = 'ended';
    r.result = result;
    io.to(room).emit('match_ended', { room, result, endedAt: new Date().toISOString() });
  }
  return res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(` Socket server running on http://localhost:${PORT}`));
// Create a room in Supabase
async function createRoom(data) {
  const { code, game, mode, fee, currency } = data;
  const { data: room, error } = await supabase
    .from('rooms')
    .insert([{ code, game, mode, fee, currency }])
    .select()
    .single();

  if (error) {
    console.error(' Error creating room:', error);
    return null;
  }

  console.log('Room created:', room);
  return room;
}

//  Add player to room when they join
async function addPlayer(roomId, playerName) {
  const { data, error } = await supabase
    .from('room_players')
    .insert([{ room_id: roomId, name: playerName }])
    .select()
    .single();

  if (error) {
    console.error(' Error adding player:', error);
    return null;
  }

  console.log(' Player added:', data);
  return data;
}
