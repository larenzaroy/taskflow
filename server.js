/**
 * TaskFlow — Lightweight Static Development Server
 * Zero dependencies. Runs on Node.js 14+ on Windows, macOS, or Linux.
 * Usage: node server.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || process.argv[2] || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Normalize URL and remove query strings
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

  // Strip leading slashes to prevent root-drive jump on Windows
  const cleanPath = pathname.replace(/^\/+/, '').replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, cleanPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  TaskFlow — Task & Productivity Dashboard`);
  console.log(`  GDG BPPIMT Tech Team Submission`);
  console.log(`======================================================`);
  console.log(`  Local server running at:`);
  console.log(`  ➜  http://localhost:${PORT}`);
  console.log(`  ➜  http://127.0.0.1:${PORT}`);
  console.log(`\n  Press Ctrl + C to stop the server.`);
  console.log(`======================================================\n`);
});
