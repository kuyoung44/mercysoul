import crypto from 'node:crypto';

const DEFAULT_CALLBACK = 'https://mercysoul-os.onrender.com/api/auth/google/callback';
const states = new Map();
let googleConnection = null;

function callbackUrl() { return process.env.GOOGLE_REDIRECT_URI || DEFAULT_CALLBACK; }
function clientConfigured() { return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET); }
function scopes() {
  const raw = process.env.GOOGLE_OAUTH_SCOPES || 'openid email profile';
  return raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
}
function pruneStates() {
  const now = Date.now();
  for (const [state, expires] of states) if (expires < now) states.delete(state);
}

export function googleOAuthStatus() {
  pruneStates();
  return {
    configured: clientConfigured(),
    callbackUrl: callbackUrl(),
    scopes: scopes(),
    connected: Boolean(googleConnection),
    gmailRequested: scopes().includes('https://www.googleapis.com/auth/gmail.readonly'),
    note: 'Google OAuth requires explicit user consent. Credentials are read from environment variables and are never returned by this API.'
  };
}

export function createGoogleOAuthUrl() {
  if (!clientConfigured()) throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
  pruneStates();
  const state = crypto.randomBytes(32).toString('base64url');
  states.set(state, Date.now() + 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: callbackUrl(),
    response_type: 'code',
    scope: scopes().join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function completeGoogleOAuth(code, state) {
  pruneStates();
  if (!state || !states.has(state)) throw new Error('Invalid or expired OAuth state');
  states.delete(state);
  if (!code) throw new Error('Missing authorization code');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: String(code),
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl(),
      grant_type: 'authorization_code'
    })
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) throw new Error(token.error_description || token.error || 'Google token exchange failed');

  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${token.access_token}` }
  });
  const profile = await userResponse.json();
  if (!userResponse.ok) throw new Error(profile.error_description || profile.error || 'Google profile lookup failed');

  googleConnection = {
    subject: profile.sub || null,
    email: profile.email || null,
    name: profile.name || null,
    picture: profile.picture || null,
    scope: token.scope || scopes().join(' '),
    accessToken: token.access_token,
    refreshToken: token.refresh_token || googleConnection?.refreshToken || null,
    expiresAt: Date.now() + (Number(token.expires_in) || 3600) * 1000,
    connectedAt: new Date().toISOString()
  };
  return { ...googleConnection, accessToken: undefined, refreshToken: undefined };
}

export function getGoogleAccessToken() {
  if (!googleConnection) return null;
  if (googleConnection.expiresAt > Date.now() + 30000) return googleConnection.accessToken;
  return null;
}

export function disconnectGoogle() { googleConnection = null; }
