// chat-client.js
(() => {
  const socket = io(); // connects to same host:port serving this page

  // DOM refs
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');

  let currentChannel = 'general';
  let username = `Guest${Math.floor(Math.random()*9000+1000)}`;
  let avatar = '🙂';
  let rank = 'Member';

  // Format time helper
  function nowTime(){
    const d = new Date();
    const hr = d.getHours() % 12 || 12;
    const min = String(d.getMinutes()).padStart(2,'0');
    const ap = d.getHours() >= 12 ? 'PM' : 'AM';
    return `${hr}:${min} ${ap}`;
  }

  // render a message into chatMessages
  function renderMessage(m){
    const row = document.createElement('div');
    row.className = 'flex gap-3 items-start mb-4';
    row.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-xl">${m.avatar}</div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <div class="font-semibold text-sm">${m.user}</div>
          <div class="text-xs text-white/40">${m.rank}</div>
          <div class="text-xs text-white/50 ml-auto">${m.time}</div>
        </div>
        <div class="mt-1 text-sm">${escapeHtml(m.text)}</div>
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }

  // initial handshake
  socket.on('connect', () => {
    socket.emit('join', { id: socket.id, name: username, avatar, rank, channel: currentChannel });
  });

  // initial server state
  socket.on('init', (state) => {
    // we could render channel list and presence here (prototype keeps it simple)
    console.log('init', state);
    // if there are recent messages for current channel, render them
    const existing = (state.messages && state.messages[currentChannel]) || [];
    existing.forEach(renderMessage);
  });

  // channel messages (when switching or on join)
  socket.on('channelMessages', ({ channelId, messages }) => {
    chatMessages.innerHTML = '';
    (messages || []).forEach(renderMessage);
  });

  // new single message (broadcast)
  socket.on('message', (m) => {
    renderMessage(m);
  });

  // presence updates (online users)
  socket.on('presence', ({ online }) => {
    // for a fuller UI you would update an "online users" panel
    console.log('presence', online);
  });

  // send message
  function send(){
    const text = chatInput.value.trim();
    if(!text) return;
    const payload = {
      channel: currentChannel,
      user: username,
      avatar,
      rank,
      time: nowTime(),
      text
    };
    socket.emit('message', payload);
    chatInput.value = '';
  }

  chatSend.addEventListener('click', send);
  chatInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      send();
    }
  });

})();
