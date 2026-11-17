import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';

export async function startMockOAuthServer({ port = 0, clientId = 'mock-client' } = {}) {
  const codes = new Map();
  const tokens = new Map();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${server.address().port}`);
    res.setHeader('content-type', 'application/json; charset=utf-8');

    if (url.pathname === '/authorize') {
      const state = url.searchParams.get('state');
      const redirectUri = url.searchParams.get('redirect_uri');
      const code = `mock-code-${randomUUID()}`;
      codes.set(code, { createdAt: Date.now(), redirectUri });
      const target = new URL(redirectUri);
      target.searchParams.set('code', code);
      if (state) target.searchParams.set('state', state);
      res.statusCode = 302;
      res.setHeader('location', target.toString());
      res.end(JSON.stringify({ consent: 'auto-approved (mock)' }));
      return;
    }

    if (url.pathname === '/token' && req.method === 'POST') {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        const params = new URLSearchParams(raw);
        const grant = params.get('grant_type');
        if (grant === 'refresh_token') {
          const rt = params.get('refresh_token');
          if (!tokens.has(rt)) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'invalid_grant' }));
            return;
          }
          const issued = issueToken(tokens.get(rt).subject);
          res.end(JSON.stringify(issued));
          return;
        }
        const code = params.get('code');
        const record = codes.get(code);
        if (!record) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'invalid_grant' }));
          return;
        }
        codes.delete(code);
        res.end(JSON.stringify(issueToken('mock-user')));
      });
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'not_found' }));
  });

  function issueToken(subject) {
    const accessToken = `mock-access-${randomUUID()}`;
    const refreshToken = `mock-refresh-${randomUUID()}`;
    tokens.set(refreshToken, { subject, issuedAt: Date.now() });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile w_organization_social'
    };
  }

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  const actualPort = server.address().port;
  return {
    port: actualPort,
    baseUrl: `http://127.0.0.1:${actualPort}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}
