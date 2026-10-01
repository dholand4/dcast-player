/**
 * @jest-environment node
 */
import http from 'http';
import { AddressInfo } from 'net';

const { createServer } = require('../../../server.js');

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port, path }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 0, body }));
      })
      .on('error', reject);
  });
}

describe('server.js', () => {
  let server: http.Server;
  let port = 0;

  beforeAll((done) => {
    server = createServer().listen(0, '127.0.0.1', () => {
      port = (server.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('responde 404 fora de /api/proxy', async () => {
    expect((await get(port, '/')).status).toBe(404);
    expect((await get(port, '/api/proxy/../etc/passwd')).status).toBe(404);
  });

  it('repassa /api/proxy para o proxy com o parâmetro url', async () => {
    const semUrl = await get(port, '/api/proxy');
    expect(semUrl.status).toBe(400);
    expect(semUrl.body).toContain('Parâmetro url é obrigatório');

    const interno = await get(port, `/api/proxy?url=${encodeURIComponent('http://[::ffff:127.0.0.1]/')}`);
    expect(interno.status).toBe(403);
  });
});
