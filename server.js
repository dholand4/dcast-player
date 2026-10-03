// Servidor do proxy de streams na VPS. O Caddy serve o build da Web (dist) e
// repassa só /api/proxy para cá, então ele escuta apenas no localhost.
const http = require('http');
const proxyHandler = require('./api/proxy.js');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname !== '/api/proxy') {
      res.statusCode = 404;
      res.end();
      return;
    }
    req.query = { url: url.searchParams.get('url') };
    proxyHandler(req, res).catch(() => {
      if (!res.headersSent) res.statusCode = 500;
      res.end();
    });
  });
}

if (require.main === module) {
  createServer().listen(PORT, HOST, () => {
    console.log(`[dcast] proxy ouvindo em http://${HOST}:${PORT}/api/proxy`);
  });
}

module.exports = { createServer };
