const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 4173);
const root = path.resolve(__dirname, '..', 'dist');
const logFile = path.resolve(__dirname, '..', 'serve-dist.log');

function log(message) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} ${message}\n`);
}

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error.stack || error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log(`unhandledRejection: ${error?.stack || error}`);
  process.exit(1);
});

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  const requestedPath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const candidate = path.resolve(root, requestedPath || 'index.html');
  const safePath = candidate.startsWith(root) ? candidate : path.join(root, 'index.html');

  fs.stat(safePath, (statError, stat) => {
    const filePath = statError || stat.isDirectory() ? path.join(root, 'index.html') : safePath;

    fs.readFile(filePath, (readError, file) => {
      if (readError) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        res.end(readError.message);
        return;
      }

      res.writeHead(200, { 'content-type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
      res.end(file);
    });
  });
});

server.listen(port, '127.0.0.1', () => {
  log(`Serving ${root} at http://127.0.0.1:${port}`);
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

server.on('error', (error) => {
  log(`server error: ${error.stack || error.message}`);
});
