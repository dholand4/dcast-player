const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');
const proxyHandler = require('./api/proxy.js');

const config = getDefaultConfig(__dirname);

const originalEnhanceMiddleware = config.server?.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    return (req, res, next) => {
      if (req.url && (req.url === '/favicon.ico' || req.url === '/favicon.png')) {
        const iconPath = path.resolve(__dirname, 'assets/favicon.png');
        if (fs.existsSync(iconPath)) {
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          fs.createReadStream(iconPath).pipe(res);
          return;
        }
      }
      if (req.url && req.url.startsWith('/api/proxy')) {
        try {
          const parsed = new URL(req.url, 'http://localhost');
          req.query = { url: parsed.searchParams.get('url') };
          return proxyHandler(req, res);
        } catch {
          res.statusCode = 500;
          res.end('Proxy internal error');
          return;
        }
      }
      if (originalEnhanceMiddleware) {
        return originalEnhanceMiddleware(middleware, server)(req, res, next);
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
