import { createGuardianEvent } from './event-schema.js';

export function detectStartupChange(input) {
  return createGuardianEvent({
    ...input,
    eventType: 'startup_change',
    severity: input.severity ?? 'medium',
    title: input.title ?? 'Startup configuration changed',
  });
}

export function detectCredentialAccessAttempt(input) {
  return createGuardianEvent({
    ...input,
    eventType: 'credential_access_attempt',
    severity: input.severity ?? 'high',
    title: input.title ?? 'Potential credential-access behavior detected',
  });
}

export function detectInputHook(input) {
  return createGuardianEvent({
    ...input,
    eventType: 'input_hook',
    severity: input.severity ?? 'high',
    title: input.title ?? 'Potential unauthorized input hook detected',
  });
}

export function detectProcess(input) {
  return createGuardianEvent({
    ...input,
    eventType: 'process',
    severity: input.severity ?? 'info',
    title: input.title ?? 'Process security event',
  });
}

export function detectIntegrityChange(input) {
  return createGuardianEvent({
    ...input,
    eventType: 'integrity',
    severity: input.severity ?? 'medium',
    title: input.title ?? 'Protected file integrity change detected',
  });
}
