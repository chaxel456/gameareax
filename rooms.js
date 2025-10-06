<script type="module" src="./roomLogic.js"></script>
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://tygkufldabsuntomirku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Z2t1ZmxkYWJzdW50b21pcmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzU3MjUsImV4cCI6MjA3NTE1MTcyNX0.uyHkWLDNp7D5L5B0yDVuhHiddlRe6-vH9Wsec-KHMQE';

export const supabase = createClient(supabaseUrl, supabaseKey);
document.getElementById('createRoomBtn').addEventListener('click', async () => {
  const game = document.getElementById('gameSelect').value;
  const mode = document.getElementById('modeSelect').value;
  const feeCurrency = document.getElementById('feeCurrency').value;
  const feeAmount = Number(document.getElementById('feeAmount').value) || 0;
  const code = genCode();

  // ✅ Save to Supabase
  const { data, error } = await supabase
    .from('rooms')
    .insert([
      {
        code: code,
        game: game,
        mode: mode,
        fee: feeAmount,
        currency: feeCurrency
      }
    ]);

  if (error) {
    console.error('Error creating room:', error);
    alert('Failed to create room.');
    return;
  }

  // ✅ Redirect after saving
  window.location.href = 
    `tournament-room.html?room=${code}&game=${game}&mode=${mode}&fee=${feeAmount}&currency=${feeCurrency}`;
});
