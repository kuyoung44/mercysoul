/** MERCYSOUL AUTO-CORRECTION & LEGACY PROTOCOL v17.0
 * Turns recoverable dead ends into bounded, constructive reroutes.
 */
export const AUTO_CORRECTION_LEGACY = Object.freeze({
  name: 'Auto-Correction & Legacy Protocol', version: '17.0',
  cycle: ['detect','freeze','pivot','evidence','legacy'],
  deadEndSignals: ['glitch','blank-screen','blocked-profile','failed-api','lost-connection','failed-deployment'],
  pivotTasks: ['build-the-os','work-on-the-site','rest-and-recover'],
  boundaries: Object.freeze({ no_external_control: true, no_silent_action: true, preserve_user_agency: true })
});
export function autoCorrectionStatus(){ return { ok:true, protocol:AUTO_CORRECTION_LEGACY, active:true }; }
export function evaluateAutoCorrection(input={}) {
  const text=String(input.text||input.error||input.status||input.event||'').toLowerCase();
  const matched=AUTO_CORRECTION_LEGACY.deadEndSignals.filter(s=>text.includes(s));
  const triggered=matched.length>0 || input.failed===true;
  return { ok:true, triggered, matchedSignals:matched,
    freeze: triggered ? { mode:'pause-external-engagement', automatic:true } : null,
    pivot: triggered ? { type:'legacy', options:AUTO_CORRECTION_LEGACY.pivotTasks, recommended:'choose-one-small-constructive-step' } : null,
    evidence: triggered ? { type:'redirection-victory', success:true, timestamp:new Date().toISOString() } : null,
    legacyChain: triggered ? 'legacy-grounding-help-reality-shift-soul-freeze-auto-correction' : null
  };
}
