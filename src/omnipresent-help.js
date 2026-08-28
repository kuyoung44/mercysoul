/** MERCYSOUL OMNIPRESENT HELP PROTOCOL v14.0
 * Safety-oriented distress routing. It never claims to contact authorities unless a real integration succeeds.
 */
export const OMNIPRESENT_HELP_PROTOCOL = Object.freeze({
  name: 'Omnipresent Help Protocol', version: '14.0', triggerCode: 'AẸ-HELP',
  channels: ['whatsapp', 'telegram', 'facebook', 'mercysoul-os'], signals: ['call', 'macro', 'gaze'], sanctuaryMode: true,
  safety: Object.freeze({ explicitConsentForLocation: true, explicitConsentForContacts: true, noAutomaticAuthorityClaim: true, noSilentTracking: true, humanReviewForUncertainSignals: true })
});
export function omnipresentHelpStatus() { return { ok: true, protocol: OMNIPRESENT_HELP_PROTOCOL, configured: process.env.MERCYSOUL_HELP_ENABLED === 'true', trustCircleConfigured: Boolean(process.env.MERCYSOUL_HELP_CONTACTS), authorityIntegrationConfigured: Boolean(process.env.MERCYSOUL_HELP_AUTHORITY_URL) }; }
export function evaluateHelpSignal(input = {}) {
  const text = String(input.text || input.content || input.signal || '').trim();
  const code = text.toUpperCase() === OMNIPRESENT_HELP_PROTOCOL.triggerCode;
  const macro = input.source === 'macrodroid' && input.distress === true;
  const gaze = input.source === 'gaze' && input.distress === true && input.confirmed === true;
  const triggered = code || macro || gaze;
  return { ok: true, triggered, signal: code ? 'call' : macro ? 'macro' : gaze ? 'gaze' : null, sanctuaryMode: triggered, locationAccepted: triggered && input.locationConsent === true, nextAction: triggered ? 'activate-sanctuary-and-route-configured-help' : 'no-action' };
}
