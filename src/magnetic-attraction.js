const ALIGNED_INTERACTIONS = new Set(['like', 'follow', 'comment']);

export const MAGNETIC_ART = Object.freeze({
  path: '/magnetic-talisman.svg',
  endpoint: '/api/magnetic/talisman',
  title: 'MercySoul Divine Magnetic Pull Talisman'
});

const state = {
  protocol: 'DIVINE MAGNETIC PULL',
  version: '1.1.0',
  totalAligned: 0,
  byType: { like: 0, follow: 0, comment: 0 },
  lastInteractionAt: null
};

export function trackMagneticInteraction({ type, source = 'social-network' } = {}) {
  const interaction = String(type || '').toLowerCase();
  if (!ALIGNED_INTERACTIONS.has(interaction)) return { aligned: false, invitation: null };

  state.totalAligned += 1;
  state.byType[interaction] += 1;
  state.lastInteractionAt = new Date().toISOString();

  return {
    aligned: true,
    source,
    interaction,
    invitation: 'Welcome to the MercySoul Sanctuary. Enter in peace. Aṣẹ.'
  };
}

export function magneticStatus() {
  return {
    protocol: state.protocol,
    version: state.version,
    state: state.totalAligned > 0 ? 'magnetically-active' : 'ready',
    alignedInteractions: state.totalAligned,
    byType: { ...state.byType },
    lastInteractionAt: state.lastInteractionAt,
    artwork: MAGNETIC_ART,
    invitation: 'Welcome to the MercySoul Sanctuary. Enter in peace. Aṣẹ.',
    note: 'Tracks interaction events explicitly submitted to MercySoul; it does not directly monitor or control external social networks.'
  };
}
