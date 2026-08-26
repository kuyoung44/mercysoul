/** MERCYSOUL ENGINE v8.0.0 */

import { globalJurisdictionStatus } from '../governance/global-jurisdiction.js';
import { sovereignRestStatus } from '../governance/sovereign-rest.js';
import { WATCHTOWER_PROTOCOL } from '../watchtower.js';

export const MERCYSOUL_ENGINE = Object.freeze({
  name: 'MercySoul OS Engine',
  version: '8.0.0',
  modules: ['watchtower', 'global-jurisdiction', 'spirit-protocol', 'sovereign-rest'],
  safetyFirst: true,
  behaviorBasedModeration: true,
  reversibleEnforcement: true,
  humanReviewForAmbiguous: true
});

export function engineStatus() {
  return {
    engine: MERCYSOUL_ENGINE,
    watchtower: WATCHTOWER_PROTOCOL,
    jurisdiction: globalJurisdictionStatus(),
    sovereignRest: sovereignRestStatus()
  };
}
