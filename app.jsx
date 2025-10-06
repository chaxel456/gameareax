import React, { useState } from 'react';
import useSocket from './useSocket';

export default function App() {
  const { games, rooms, room, chat, send } = useSocket();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGame, setSelectedGame] = useState('');

  if (!username) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-900 to-pink-900">
      <input placeholder="Enter username" className="p-2 rounded" value={username} onChange={e=>setUsername(e.target.value)}/>
      <button onClick={()=>{}}>Enter</button>
    </div>
  );

  if (!room) return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl mb-4">Tournament Games</h1>
      <div className="grid grid-cols-3 gap-4">
        {games.map(g=>(
          <div key={g.id} className={`p-4 rounded-lg cursor-pointer bg-gradient-to-r from-purple-700 to-pink-700`} onClick={()=>setSelectedGame(g.id)}>
            <div className="text-5xl">{g.emoji}</div>
            <div>{g.name}</div>
          </div>
        ))}
      </div>
      {selectedGame && (
        <div className="mt-4">
          <button onClick={()=>send('room:create', { gameId:selectedGame, host:{id:username,name:username}, mode:'1v1', entryFee:0, currency:'NGN'})} className="bg-green-500 p-2 rounded">Create Room</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl mb-4">Room: {room.id} ({room.status})</h1>
      <div className="mb-4">
        <h2 className="text-xl">Players:</h2>
        {room.players.map(p=>(
          <div key={p.id}>{p.name} {p.ready ? '✅' : '❌'} 
            <button onClick={()=>send('room:set-ready',{roomId:room.id,userId:p.id,ready:true})} className="ml-2 bg-blue-500 px-2 rounded">Ready</button>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h2 className="text-xl">Chat:</h2>
        <div className="max-h-64 overflow-y-auto bg-gray-800 p-2 rounded mb-2">
          {chat.map((m,i)=><div key={i}><b>{m.user.name}</b>: {m.message}</div>)}
        </div>
        <input className="p-1 rounded mr-2" value={message} onChange={e=>setMessage(e.target.value)}/>
        <button className="bg-purple-500 px-2 rounded" onClick={()=>{send('room:chat',{roomId:room.id,message,user:{id:username,name:username}}); setMessage('');}}>Send</button>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import useSocket from './useSocket';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const { games, rooms, room, chat, send } = useSocket();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [joinCode, setJoinCode] = useState('');

  if (!username) return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-900 to-pink-900">
      <input
        placeholder="Enter username"
        className="p-2 rounded mr-2"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <button onClick={() => {}} className="bg-green-500 px-4 rounded">Enter</button>
    </div>
  );

  if (!room) return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl mb-4">Tournament Games</h1>
      <div className="grid grid-cols-3 gap-4">
        {games.map(g => (
          <motion.div
            key={g.id}
            className={`p-4 rounded-lg cursor-pointer bg-gradient-to-r from-purple-700 to-pink-700`}
            onClick={() => setSelectedGame(g.id)}
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px #ff00ff" }}
          >
            <div className="text-5xl">{g.emoji}</div>
            <div>{g.name}</div>
          </motion.div>
        ))}
      </div>

      {selectedGame && (
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={() => send('room:create', { gameId: selectedGame, host: { id: username, name: username }, mode: '1v1', entryFee: 10, currency: 'NGN' })}
            className="bg-green-500 p-2 rounded"
          >
            Create Room
          </button>
          <button
            onClick={() => send('room:auto-match', { gameId: selectedGame, user: { id: username, name: username }, mode: '1v1', entryFee: 10, currency: 'NGN' })}
            className="bg-blue-500 p-2 rounded"
          >
            Auto-Match
          </button>
          <div className="flex gap-2 mt-2">
            <input
              placeholder="Enter Room Code"
              className="p-1 rounded flex-1"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
            />
            <button
              onClick={() => send('room:join', { roomId: joinCode, user: { id: username, name: username } })}
              className="bg-yellow-500 p-2 rounded"
            >
              Join
            </button>
          </div>
        </div>
      )}

      <h2 className="text-2xl mt-8">Active Rooms</h2>
      <AnimatePresence>
        {rooms.map(r => (
          <motion.div
            key={r.id}
            className="p-2 my-2 bg-gray-800 rounded flex justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <span>{r.id} | {r.gameId} | {r.players.length}/{r.mode === 'Squad' ? 4 : r.mode === '2v2' ? 2 : 2}</span>
            <span>Prize: {r.prizePool} {r.currency}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl mb-4">Room: {room.id} ({room.status})</h1>
      <div className="mb-4">
        <h2 className="text-xl">Players:</h2>
        <AnimatePresence>
          {room.players.map(p => (
            <motion.div
              key={p.id}
              className="p-1 my-1 bg-gray-800 rounded flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <span>{p.name} {p.ready ? '✅' : '❌'}</span>
              {!p.ready && p.id === username && (
                <button
                  onClick={() => send('room:set-ready', { roomId: room.id, userId: username, ready: true })}
                  className="bg-blue-500 px-2 rounded"
                >
                  Ready
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mb-4">
        <h2 className="text-xl">Prize Pool: {room.prizePool} {room.currency}</h2>
      </div>

      <div className="mb-4">
        <h2 className="text-xl">Chat:</h2>
        <div className="max-h-64 overflow-y-auto bg-gray-800 p-2 rounded mb-2">
          {chat.map((m, i) => <div key={i}><b>{m.user.name}</b>: {m.message}</div>)}
        </div>
        <input
          className="p-1 rounded mr-2"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button
          className="bg-purple-500 px-2 rounded"
          onClick={() => { send('room:chat', { roomId: room.id, message, user: { id: username, name: username } }); setMessage(''); }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Countdown({ start = 3, onFinish }) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (count === 0) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onFinish]);

  return (
    <motion.div
      key={count}
      className="text-6xl text-purple-400 text-center my-8"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      {count}
    </motion.div>
  );
}
const [countdown, setCountdown] = useState(false);

useEffect(() => {
  if (room?.status === 'playing') setCountdown(true);
}, [room?.status]);

<AnimatePresence>
  {countdown && (
    <Countdown start={3} onFinish={() => setCountdown(false)} />
  )}
</AnimatePresence>

<button
  className="bg-red-500 px-2 rounded"
  onClick={() => send('room:start-match', { roomId: room.id })}
>
  Start Match
</button>
