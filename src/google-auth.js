import crypto from 'node:crypto';

const DEFAULT_REDIRECT_URI = 'https://mercysoul-os.onrender.com/api/auth/google/callback';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';
const SESSION_COOKIE = 'mercysoul_google_session';
const STATE_COOKIE = 'mercysoul_google_state';
const STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function required(name) { const value = process.env[name]; if (!value) throw new Error(`${name} is not configured`); return value; }
function redirectUri() { return process.env.GOOGLE_REDIRECT_URI || DEFAULT_REDIRECT_URI; }
function scopes() { const base = ['openid', 'email', 'profile']; if (process.env.GOOGLE_GMAIL_SCOPE === 'true') base.push('https://www.googleapis.com/auth/gmail.readonly'); return base; }
function sign(value) { return crypto.createHmac('sha256', required('GOOGLE_SESSION_SECRET')).update(value).digest('base64url'); }
function pack(value) { const body = Buffer.from(JSON.stringify(value)).toString('base64url'); return `${body}.${sign(body)}`; }
function unpack(value) {
  if (!value || !value.includes('.')) return null;
  const [body, mac] = value.split('.'); const expected = sign(body);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try { const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); if (data.exp && Date.now() > data.exp) return null; return data; } catch { return null; }
}
export function parseCookies(req) {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const i = part.indexOf('=');
    return i < 0 ? [part, ''] : [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
  }));
}
export function setSignedCookie(res, name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${options.path || '/'}`, 'HttpOnly', 'Secure', `SameSite=${options.sameSite || 'Lax'}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  res.append('Set-Cookie', parts.join('; '));
}
export function clearCookie(res, name, path = '/') { setSignedCookie(res, name, '', { maxAge: 0, path }); }
export function googleAuthConfigured() { return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_SESSION_SECRET); }
export function googleAuthStatus() { return { configured: googleAuthConfigured(), provider: 'Google', redirectUri: redirectUri(), scopes: scopes(), gmailAccess: process.env.GOOGLE_GMAIL_SCOPE === 'true', session: 'signed HttpOnly cookie', secretStoredIn: 'Render environment variables' }; }
export function createGoogleAuthorization(res) {
  required('GOOGLE_CLIENT_ID'); required('GOOGLE_SESSION_SECRET');
  const state = crypto.randomBytes(32).toString('base64url');
  setSignedCookie(res, STATE_COOKIE, pack({ value: state, exp: Date.now() + STATE_TTL_MS }), { maxAge: STATE_TTL_MS, path: '/api/auth/google' });
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID); url.searchParams.set('redirect_uri', redirectUri()); url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes().join(' ')); url.searchParams.set('state', state);
  url.searchParams.set('access_type', process.env.GOOGLE_GMAIL_SCOPE === 'true' ? 'offline' : 'online');
  url.searchParams.set('prompt', process.env.GOOGLE_GMAIL_SCOPE === 'true' ? 'consent' : 'select_account');
  return url.toString();
}
export function validateGoogleState(req, state) { const payload = unpack(parseCookies(req)[STATE_COOKIE]); return Boolean(payload && payload.value === state); }
export async function exchangeGoogleCode(code) {
  required('GOOGLE_CLIENT_ID'); required('GOOGLE_CLIENT_SECRET');
  const response = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri(), grant_type: 'authorization_code' }) });
  if (!response.ok) throw new Error(`Google token exchange failed: HTTP ${response.status}`);
  return response.json();
}
export async function fetchGoogleProfile(accessToken) {
  const response = await fetch(USERINFO_ENDPOINT, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Google profile request failed: HTTP ${response.status}`);
  return response.json();
}
export function createSessionCookie(profile) { return pack({ sub: profile.sub, email: profile.email, name: profile.name, picture: profile.picture, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }); }
export function readSession(req) { return unpack(parseCookies(req)[SESSION_COOKIE]); }
export const GOOGLE_SESSION_COOKIE = SESSION_COOKIE;
export const GOOGLE_STATE_COOKIE = STATE_COOKIE;
export const GOOGLE_SESSION_TTL_SECONDS = SESSION_TTL_SECONDS;
