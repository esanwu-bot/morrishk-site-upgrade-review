import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startMockOAuthServer } from '../src/mock-oauth-server.js';
import { LinkedInProvider } from '../src/providers/social/linkedin.js';
import { FileTokenStore } from '../src/token-store.js';
import { ErrorCode } from '../src/errors.js';

async function makeProvider() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'poc-oauth-'));
  const server = await startMockOAuthServer();
  const config = {
    linkedin: {
      clientId: '',
      clientSecret: '',
      redirectUri: `${server.baseUrl}/callback/linkedin`
    }
  };
  const tokenStore = new FileTokenStore(dir);
  const provider = new LinkedInProvider({
    mode: 'mock',
    config,
    tokenStore,
    logger: null,
    authBase: `${server.baseUrl}/authorize`,
    tokenUrl: `${server.baseUrl}/token`
  });
  return {
    provider,
    tokenStore,
    server,
    dir,
    cleanup: async () => {
      await server.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

async function authorize(provider) {
  const { authorizationUrl, state } = await provider.connect();
  const res = await fetch(authorizationUrl, { redirect: 'manual' });
  const location = res.headers.get('location');
  const url = new URL(location);
  return { state, code: url.searchParams.get('code'), returnedState: url.searchParams.get('state') };
}

test('OAuth 授权地址包含 state 与最小发布 scope', async () => {
  const ctx = await makeProvider();
  try {
    const { authorizationUrl, state, scopes, includeOrgAdmin } = await ctx.provider.connect();
    const url = new URL(authorizationUrl);
    assert.equal(url.pathname, '/authorize');
    assert.equal(url.searchParams.get('state'), state);
    assert.equal(url.searchParams.get('response_type'), 'code');
    const requested = url.searchParams.get('scope').split(/\s+/);
    assert.deepEqual(requested, ['openid', 'profile', 'w_organization_social']);
    assert.deepEqual(scopes, requested);
    assert.equal(includeOrgAdmin, false);
  } finally {
    await ctx.cleanup();
  }
});

test('组织发现权限 rw_organization_admin 需显式申请，不能默认混入发布授权', async () => {
  const ctx = await makeProvider();
  try {
    const withAdmin = await ctx.provider.connect({ includeOrgAdmin: true });
    const url = new URL(withAdmin.authorizationUrl);
    const requested = url.searchParams.get('scope').split(/\s+/);
    assert.ok(requested.includes('rw_organization_admin'));
    assert.ok(requested.includes('w_organization_social'));
    assert.equal(withAdmin.includeOrgAdmin, true);
  } finally {
    await ctx.cleanup();
  }
});

test('state 缺失时拒绝回调', async () => {
  const ctx = await makeProvider();
  try {
    const { code } = await authorize(ctx.provider);
    await assert.rejects(
      () => ctx.provider.handleCallback({ code, state: 'anything' }),
      (err) => err.code === ErrorCode.BAD_REQUEST && /expectedState/.test(err.message)
    );
    assert.equal(ctx.tokenStore.load('linkedin'), null);
  } finally {
    await ctx.cleanup();
  }
});

test('state 不匹配时拒绝回调', async () => {
  const ctx = await makeProvider();
  try {
    const { code } = await authorize(ctx.provider);
    await assert.rejects(
      () => ctx.provider.handleCallback({ code, state: 'tampered', expectedState: 'expected' }),
      (err) => err.code === ErrorCode.BAD_REQUEST && /state/.test(err.message)
    );
    assert.equal(ctx.tokenStore.load('linkedin'), null);
  } finally {
    await ctx.cleanup();
  }
});

test('完整流程：授权码换 token、保存、读取个人与组织身份', async () => {
  const ctx = await makeProvider();
  try {
    const { state, code, returnedState } = await authorize(ctx.provider);
    assert.equal(returnedState, state);
    const { account, organization } = await ctx.provider.handleCallback({ code, state: returnedState, expectedState: state });
    assert.equal(account.id, 'mock-person-2001');
    assert.equal(account.type, 'person');
    assert.equal(organization.type, 'organization');
    assert.equal(organization.verified, false);
    assert.match(organization.note, /Mock/);

    const stored = ctx.tokenStore.load('linkedin');
    assert.ok(stored.accessToken.startsWith('mock-access-'));
    assert.ok(stored.refreshToken.startsWith('mock-refresh-'));
    assert.ok(stored.expiresAt > Date.now());
  } finally {
    await ctx.cleanup();
  }
});

test('state 重放被拒绝', async () => {
  const ctx = await makeProvider();
  try {
    const { state, code, returnedState } = await authorize(ctx.provider);
    await ctx.provider.handleCallback({ code, state: returnedState, expectedState: state });
    await assert.rejects(
      () => ctx.provider.handleCallback({ code, state: returnedState, expectedState: state }),
      (err) => err.code === ErrorCode.BAD_REQUEST && /state/.test(err.message)
    );
  } finally {
    await ctx.cleanup();
  }
});

test('同一授权码不能重复使用', async () => {
  const ctx = await makeProvider();
  try {
    const { state, code, returnedState } = await authorize(ctx.provider);
    await ctx.provider.handleCallback({ code, state: returnedState, expectedState: state });
    await assert.rejects(
      () => ctx.provider.exchangeCode(code),
      (err) => err.code === ErrorCode.BAD_REQUEST
    );
  } finally {
    await ctx.cleanup();
  }
});

test('token 过期后用 refresh_token 换新并落盘', async () => {
  const ctx = await makeProvider();
  try {
    const { state, code, returnedState } = await authorize(ctx.provider);
    await ctx.provider.handleCallback({ code, state: returnedState, expectedState: state });
    const before = ctx.tokenStore.load('linkedin');
    ctx.tokenStore.save('linkedin', { ...before, expiresAt: Date.now() - 1000 });

    const refreshed = await ctx.provider.ensureToken();
    assert.notEqual(refreshed.accessToken, before.accessToken);
    assert.ok(refreshed.expiresAt > Date.now());
    assert.equal(ctx.tokenStore.load('linkedin').accessToken, refreshed.accessToken);
  } finally {
    await ctx.cleanup();
  }
});

test('无 token 时 ensureToken 抛 AUTH_EXPIRED', async () => {
  const ctx = await makeProvider();
  try {
    await assert.rejects(() => ctx.provider.ensureToken(), (err) => err.code === ErrorCode.AUTH_EXPIRED);
  } finally {
    await ctx.cleanup();
  }
});

test('disconnect 删除本地 token 文件', async () => {
  const ctx = await makeProvider();
  try {
    const { state, code, returnedState } = await authorize(ctx.provider);
    await ctx.provider.handleCallback({ code, state: returnedState, expectedState: state });
    const result = await ctx.provider.disconnect();
    assert.equal(result.disconnected, true);
    assert.equal(ctx.tokenStore.load('linkedin'), null);
  } finally {
    await ctx.cleanup();
  }
});
