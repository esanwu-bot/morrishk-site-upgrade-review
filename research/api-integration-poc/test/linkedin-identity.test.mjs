import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LinkedInProvider } from '../src/providers/social/linkedin.js';
import { FileTokenStore } from '../src/token-store.js';
import { startMockOAuthServer } from '../src/mock-oauth-server.js';

const acls = JSON.parse(fs.readFileSync(new URL('./fixtures/linkedin-acls.json', import.meta.url), 'utf8'));

async function startServer(handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(resolve);
      })
  };
}

function tempStore(tokens = null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-li-'));
  const store = new FileTokenStore(dir);
  if (tokens) store.save('linkedin', tokens);
  return {
    store,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true })
  };
}

test('Mock 身份：个人资料与组织主页分离，组织不冒充已验证', async () => {
  const server = await startMockOAuthServer();
  const tmp = tempStore();
  try {
    const provider = new LinkedInProvider({
      mode: 'mock',
      config: { linkedin: { clientId: '', clientSecret: '', redirectUri: `${server.baseUrl}/callback/linkedin`, authorUrn: '', organizationId: '' } },
      tokenStore: tmp.store,
      logger: null,
      authBase: `${server.baseUrl}/authorize`,
      tokenUrl: `${server.baseUrl}/token`
    });
    const { authorizationUrl, state } = await provider.connect();
    const res = await fetch(authorizationUrl, { redirect: 'manual' });
    const callback = new URL(res.headers.get('location'));

    const { account, organization } = await provider.handleCallback({
      code: callback.searchParams.get('code'),
      state: callback.searchParams.get('state'),
      expectedState: state
    });
    assert.equal(account.type, 'person');
    assert.notEqual(account.id, organization.id);
    assert.equal(organization.type, 'organization');
    assert.equal(organization.verified, false);
    assert.match(organization.note, /不代表真实组织验证/);

    const accounts = await provider.listAccounts();
    assert.deepEqual(accounts.map((a) => a.type), ['person', 'organization']);
    assert.equal(await provider.resolveAuthorUrn(), 'urn:li:organization:mock-1001');
  } finally {
    await server.close();
    tmp.cleanup();
  }
});

test('真实模式：userinfo 映射为个人身份，组织接口单独返回', async () => {
  const calls = [];
  const srv = await startServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), auth: req.headers.authorization });
    res.setHeader('content-type', 'application/json');
    if (url.pathname === '/v2/userinfo') {
      res.end(JSON.stringify({ sub: 'person-1', name: 'Test User', email: 'user@example.com' }));
      return;
    }
    if (url.pathname === '/rest/organizations/1001') {
      res.end(JSON.stringify({ id: 1001, localizedName: 'Morrishk Page', vanityName: 'morrishk' }));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  const tmp = tempStore({ accessToken: 'fixture-token', refreshToken: 'r', expiresAt: Date.now() + 3600_000 });
  try {
    const provider = new LinkedInProvider({
      mode: 'real',
      config: { linkedin: { clientId: 'id', clientSecret: 'secret', redirectUri: '', authorUrn: '', organizationId: '1001' } },
      tokenStore: tmp.store,
      logger: null,
      apiBase: srv.baseUrl
    });

    const person = await provider.getAccount();
    assert.deepEqual(person, { id: 'person-1', name: 'Test User', email: 'user@example.com', type: 'person', mode: 'real' });

    const org = await provider.getOrganization();
    assert.equal(org.id, '1001');
    assert.equal(org.name, 'Morrishk Page');
    assert.equal(org.type, 'organization');
    assert.equal(org.mode, 'real');

    const accounts = await provider.listAccounts();
    assert.deepEqual(accounts.map((a) => a.type), ['person', 'organization']);
    assert.equal(calls.every((c) => c.auth === 'Bearer fixture-token'), true);
  } finally {
    await srv.close();
    tmp.cleanup();
  }
});

test('真实模式：无配置时通过 organizationAcls 发现 authorUrn', async () => {
  const calls = [];
  const srv = await startServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), auth: req.headers.authorization });
    if (url.pathname === '/v2/organizationAcls') {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(acls));
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
  const tmp = tempStore({ accessToken: 'fixture-token', refreshToken: 'r', expiresAt: Date.now() + 3600_000 });
  try {
    const provider = new LinkedInProvider({
      mode: 'real',
      config: { linkedin: { clientId: 'id', clientSecret: 'secret', redirectUri: '', authorUrn: '', organizationId: '' } },
      tokenStore: tmp.store,
      logger: null,
      apiBase: srv.baseUrl
    });
    const urn = await provider.resolveAuthorUrn();
    assert.equal(urn, 'urn:li:organization:1001');
    assert.equal(calls[0].path, '/v2/organizationAcls');
    assert.equal(calls[0].query.q, 'roleAssignee');
    assert.equal(calls[0].query.role, 'ADMINISTRATOR');
    assert.equal(calls[0].query.state, 'APPROVED');
  } finally {
    await srv.close();
    tmp.cleanup();
  }
});

test('真实模式：显式 authorUrn 优先，不触发发现请求', async () => {
  let calls = 0;
  const srv = await startServer((req, res) => {
    calls += 1;
    res.statusCode = 500;
    res.end('should not be called');
  });
  const tmp = tempStore({ accessToken: 'fixture-token', refreshToken: 'r', expiresAt: Date.now() + 3600_000 });
  try {
    const provider = new LinkedInProvider({
      mode: 'real',
      config: { linkedin: { clientId: 'id', clientSecret: 'secret', redirectUri: '', authorUrn: 'urn:li:organization:9999', organizationId: '' } },
      tokenStore: tmp.store,
      logger: null,
      apiBase: srv.baseUrl
    });
    assert.equal(await provider.resolveAuthorUrn(), 'urn:li:organization:9999');
    assert.equal(calls, 0);
  } finally {
    await srv.close();
    tmp.cleanup();
  }
});

test('真实模式：无组织配置且发现为空时抛 CONFIG_MISSING', async () => {
  const srv = await startServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ elements: [] }));
  });
  const tmp = tempStore({ accessToken: 'fixture-token', refreshToken: 'r', expiresAt: Date.now() + 3600_000 });
  try {
    const provider = new LinkedInProvider({
      mode: 'real',
      config: { linkedin: { clientId: 'id', clientSecret: 'secret', redirectUri: '', authorUrn: '', organizationId: '' } },
      tokenStore: tmp.store,
      logger: null,
      apiBase: srv.baseUrl
    });
    await assert.rejects(() => provider.resolveAuthorUrn(), (err) => err.code === 'CONFIG_MISSING');
  } finally {
    await srv.close();
    tmp.cleanup();
  }
});
