import crypto from 'node:crypto';

const SMARTTHINGS_BASE = 'https://api.smartthings.com/v1';
const SCOPES = ['r:locations:*', 'r:devices:*', 'x:devices:*'];
const ALLOWED_CAPABILITIES = new Set(['switch', 'switchLevel', 'colorControl']);

export const SMARTTHINGS_PROTOCOL = Object.freeze({
  version: '1.0.0',
  provider: 'SmartThings',
  baseUrl: SMARTTHINGS_BASE,
  scopes: SCOPES,
  productionAuth: 'OAuth2',
  externalControl: true,
  highRiskDevicesRequireExplicitAuthorization: true
});

export function smartThingsStatus() {
  return { ...SMARTTHINGS_PROTOCOL, configured: Boolean(process.env.SMARTTHINGS_CLIENT_ID && process.env.SMARTTHINGS_CLIENT_SECRET && process.env.SMARTTHINGS_REDIRECT_URI) };
}

function requireConfig() {
  const keys = ['SMARTTHINGS_CLIENT_ID', 'SMARTTHINGS_CLIENT_SECRET', 'SMARTTHINGS_REDIRECT_URI'];
  const missing = keys.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`Missing SmartThings configuration: ${missing.join(', ')}`);
}

export function createOAuthState() {
  return crypto.randomBytes(32).toString('hex');
}

export function smartThingsAuthorizeUrl(state) {
  requireConfig();
  const url = new URL(`${SMARTTHINGS_BASE}/../oauth/authorize`);
  url.searchParams.set('client_id', process.env.SMARTTHINGS_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', process.env.SMARTTHINGS_REDIRECT_URI);
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('state', state);
  return url.toString();
}

export async function exchangeOAuthCode(code) {
  requireConfig();
  const basic = Buffer.from(`${process.env.SMARTTHINGS_CLIENT_ID}:${process.env.SMARTTHINGS_CLIENT_SECRET}`).toString('base64');
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, client_id: process.env.SMARTTHINGS_CLIENT_ID, redirect_uri: process.env.SMARTTHINGS_REDIRECT_URI });
  const response = await fetch(`${SMARTTHINGS_BASE}/../oauth/token`, { method: 'POST', headers: { Authorization: `Basic ${basic}`, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!response.ok) throw new Error(`SmartThings token exchange failed: ${response.status}`);
  return response.json();
}

async function apiRequest(accessToken, path, options = {}) {
  if (!accessToken) throw new Error('SmartThings access token required');
  const response = await fetch(`${SMARTTHINGS_BASE}${path}`, { ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json;charset=utf-8' } : {}), Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`SmartThings API ${response.status}: ${JSON.stringify(data)}`);
  return data;
}

export const listSmartThingsDevices = accessToken => apiRequest(accessToken, '/devices');
export const getSmartThingsLocations = accessToken => apiRequest(accessToken, '/locations');

export async function sendSmartThingsCommand(accessToken, deviceId, command) {
  if (!deviceId || !command || typeof command !== 'object') throw new Error('deviceId and command are required');
  const capability = command.capability || 'switch';
  const action = command.command;
  if (!ALLOWED_CAPABILITIES.has(capability)) throw new Error('Capability is not permitted by MercySoul SmartThings policy');
  const allowed = { switch: ['on', 'off'], switchLevel: ['setLevel'], colorControl: ['setColor'] };
  if (!allowed[capability].includes(action)) throw new Error('Command is not permitted by MercySoul SmartThings policy');
  return apiRequest(accessToken, `/devices/${encodeURIComponent(deviceId)}/commands`, { method: 'POST', body: JSON.stringify({ commands: [{ component: command.component || 'main', capability, command: action, arguments: Array.isArray(command.arguments) ? command.arguments : [] }] }) });
}
