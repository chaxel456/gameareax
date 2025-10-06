import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(url='http://localhost:4000') {
  const socketRef = useRef(null);
  const [games, setGames] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [chat, setChat] = useState([]);

  useEffect(() => {
    const socket = io(url);
    socketRef.current = socket;

    socket.on('games:list', setGames);
    socket.on('rooms:update', setRooms);
    socket.on('room:created', setRoom);
    socket.on('room:update', setRoom);
    socket.on('room:chat', msg => setChat(prev => [...prev, msg]));

    return () => socket.disconnect();
  }, [url]);

  const send = (event, payload) => socketRef.current?.emit(event, payload);

  return { games, rooms, room, chat, send };
}
