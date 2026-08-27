export function protocolGatewayStatus() {
  return {
    ok: true,
    mode: 'approved-HTTPS-sources-only',
    automaticInternetAccess: true,
    arbitraryInternetControl: false,
    sourceCount: 0,
    protocolCount: 0,
    lastSyncAt: null,
    oauth: {
      gmail: 'requires explicit Google OAuth consent',
      social: 'requires explicit platform OAuth/API consent'
    }
  };
}

export function listProtocolSources() { return []; }
export function listProtocols() { return []; }
export async function syncInternetProtocols() {
  return { ok: false, skipped: true, reason: 'No approved protocol sources configured' };
}
export function startProtocolRefresh() { return null; }
