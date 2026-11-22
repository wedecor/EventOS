import express from 'express';
import type { AddressInfo } from 'node:net';
import { configureProxyTrust, TRUSTED_PROXY_HOPS } from './trust-proxy';

describe('configureProxyTrust (M5-01)', () => {
  it('trusts exactly one proxy hop', () => {
    const app = { set: jest.fn() };

    configureProxyTrust(app);

    expect(TRUSTED_PROXY_HOPS).toBe(1);
    expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
  });

  it('resolves req.ip from the proxy-appended hop, ignoring a spoofed prefix', async () => {
    const app = express();
    configureProxyTrust(app);
    app.get('/ip', (req, res) => {
      res.send(req.ip);
    });
    const server = app.listen(0);
    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/ip`, {
        headers: { 'X-Forwarded-For': '6.6.6.6, 203.0.113.7' },
      });

      // 203.0.113.7 was appended by the (single) trusted proxy; 6.6.6.6 is client-supplied.
      await expect(response.text()).resolves.toBe('203.0.113.7');
    } finally {
      server.close();
    }
  });

  it('without trust, req.ip is the socket address (the load balancer)', async () => {
    const app = express();
    app.get('/ip', (req, res) => {
      res.send(req.ip);
    });
    const server = app.listen(0);
    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/ip`, {
        headers: { 'X-Forwarded-For': '6.6.6.6' },
      });

      await expect(response.text()).resolves.toMatch(/127\.0\.0\.1/);
    } finally {
      server.close();
    }
  });
});
