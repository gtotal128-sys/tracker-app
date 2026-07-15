const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Reason: enable cross‑origin requests so the Android app can talk to this server
app.use(cors());
// Reason: parse JSON data sent from the phone
app.use(express.json());

// Reason: persist data even if server restarts – store in a simple JSON file
if (!fs.existsSync('db.json')) fs.writeFileSync('db.json', '[]');

// Endpoint that the Android app calls to send a URL
app.post('/track', (req, res) => {
  const db = JSON.parse(fs.readFileSync('db.json'));
  db.push({ 
    url: req.body.url, 
    time: Date.now(),
    deviceId: req.body.deviceId || 'unknown' 
  });
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
  res.send('ok');
});

// The Admin Dashboard – served at the root URL
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Parental Monitor</title>
  <style>
    body { background: #0b0e14; color: #e8edf5; font-family: sans-serif; padding: 20px; }
    table { width: 100%; background: #1a222e; border-radius: 12px; padding: 10px; }
    th, td { padding: 8px 12px; border-bottom: 1px solid #2a3340; text-align: left; }
    a { color: #6f9eff; }
  </style>
</head>
<body>
  <h1>📡 Live Browsing Activity</h1>
  <div id="list">Loading...</div>
  <script>
    // Reason: auto‑refresh every 5 seconds to show new URLs instantly
    async function load() {
      const res = await fetch('/data');
      const data = await res.json();
      let html = '<table><tr><th>#</th><th>URL</th><th>Time</th><th>Device</th></tr>';
      data.slice().reverse().slice(0, 200).forEach((item, i) => {
        html += \`<tr>
          <td>\${i+1}</td>
          <td><a href="\${item.url}" target="_blank">\${item.url}</a></td>
          <td>\${new Date(item.time).toLocaleString()}</td>
          <td>\${item.deviceId || '—'}</td>
        </tr>\`;
      });
      html += '</table>';
      document.getElementById('list').innerHTML = html;
    }
    load();
    setInterval(load, 5000); // refresh every 5 seconds
  </script>
</body>
</html>
  `);
});

// Endpoint for the dashboard to fetch all stored URLs
app.get('/data', (req, res) => {
  res.json(JSON.parse(fs.readFileSync('db.json')));
});

app.listen(PORT, () => console.log('✅ Server running at http://localhost:3000'));