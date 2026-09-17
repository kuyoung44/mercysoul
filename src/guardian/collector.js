import { createGuardianEvent } from './event-schema.js';

export class GuardianCollector {
  constructor({ agentId, ownerId, send }) {
    if (!agentId || !ownerId || typeof send !== 'function') throw new Error('agentId, ownerId and send are required');
    this.agentId = agentId;
    this.ownerId = ownerId;
    this.send = send;
  }

  async emit(eventType, { severity = 'info', title, details = {} } = {}) {
    const event = createGuardianEvent({
      agentId: this.agentId,
      ownerId: this.ownerId,
      eventType,
      severity,
      title,
      details,
    });
    return this.send(event);
  }
}
