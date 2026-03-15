const https = require('https');

const URL = 'https://spoton-web.onrender.com/';
const INTERVAL = 14 * 60 * 1000; // 14 minutes

function ping() {
  console.log(`[Keep-Awake] Pinging ${URL} at ${new Date().toISOString()}`);
  https
    .get(URL, (res) => {
      console.log(`[Keep-Awake] Responded with status: ${res.statusCode}`);
    })
    .on('error', (err) => {
      console.error(`[Keep-Awake] Error pinging: ${err.message}`);
    });
}

// Ping immediately on start
ping();

// Then ping every 14 minutes
setInterval(ping, INTERVAL);
