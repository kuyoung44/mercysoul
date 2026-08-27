const DIRECTIVE_REF = 'MERCY-DIR-2026-0827-001';
const DIRECTIVE_VERSION = '1.0.0';
const EFFECTIVE_DATE = '2026-08-27';

// Internal MercySoul deployment protocol. It does not confer governmental,
// law-enforcement, military, or other external legal authority.
const DEPLOYMENT_DIRECTIVE = Object.freeze({
  ref: DIRECTIVE_REF,
  version: DIRECTIVE_VERSION,
  classification: 'PUBLIC APPLICATION DEPLOYMENT SPECIFICATION',
  status: 'ACTIVE',
  effectiveDate: EFFECTIVE_DATE,
  authority: 'MercySoul OS application scope only',
  externalAuthorityClaim: false,
  stages: Object.freeze([
    { stage: 1, action: 'Public announcement through authorized MercySoul channels', timeline: 'Day 1' },
    { stage: 2, action: 'Publish application notices and operational copies', timeline: 'Day 1-2' },
    { stage: 3, action: 'Brief authorized MercySoul operators', timeline: 'Day 2' },
    { stage: 4, action: 'Activate verification and reporting channels', timeline: 'Day 2' },
    { stage: 5, action: 'Begin application-level enforcement according to MercySoul policy', timeline: 'Day 3' }
  ]),
  reporting: Object.freeze({
    investigationTargetHours: 24,
    complianceReportTargetHours: 72,
    channels: Object.freeze({
      hotline: process.env.DEPLOYMENT_VERIFICATION_HOTLINE || null,
      email: process.env.DEPLOYMENT_REPORTING_EMAIL || null,
      office: process.env.DEPLOYMENT_REPORTING_OFFICE || null
    })
  }),
  safeguards: Object.freeze([
    'This protocol governs only MercySoul-controlled application behavior and infrastructure.',
    'It does not authorize action by police, military, government agencies, or other external institutions.',
    'No penalty is imposed outside MercySoul-controlled systems.',
    'Ambiguous reports remain subject to human review.',
    'Verification channels must be configured before being advertised as active.'
  ])
});

const reports = [];

export function deploymentDirectiveStatus() {
  return {
    ok: true,
    directive: DEPLOYMENT_DIRECTIVE,
    reportsInMemory: reports.length,
    configuredVerificationChannels: Object.values(DEPLOYMENT_DIRECTIVE.reporting.channels).filter(Boolean).length
  };
}

export function recordDeploymentReport({ category = 'general', description = '', reporter = null, requestId = null } = {}) {
  const clean = (value, max) => String(value ?? '').trim().slice(0, max);
  const report = Object.freeze({
    id: cryptoRandomId(),
    directiveRef: DIRECTIVE_REF,
    category: clean(category, 80) || 'general',
    description: clean(description, 5000),
    reporter: clean(reporter, 254) || null,
    requestId: clean(requestId, 128) || null,
    createdAt: new Date().toISOString(),
    status: 'received'
  });
  reports.unshift(report);
  return report;
}

function cryptoRandomId() {
  return globalThis.crypto?.randomUUID?.() || `report-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listDeploymentReports(limit = 50) {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 200);
  return reports.slice(0, safeLimit).map((report) => ({ ...report }));
}
