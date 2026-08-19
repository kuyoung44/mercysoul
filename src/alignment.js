export const AUTONOMY = Object.freeze({ AUTO: 'auto', CONFIRM: 'confirm', BLOCK: 'block' });

const BLOCKED = new Set(['delete_customer_data', 'disable_auth', 'change_payment_credentials', 'publish_without_consent']);
const CONFIRM = new Set(['publish_content', 'issue_refund', 'change_price', 'deploy_production']);

export function evaluateAlignment(action, context = {}) {
  const normalized = String(action || '').trim().toLowerCase();
  const reasons = [];
  if (!normalized) return { decision: AUTONOMY.BLOCK, risk: 'high', reasons: ['Action is required'] };
  if (BLOCKED.has(normalized)) return { decision: AUTONOMY.BLOCK, risk: 'critical', reasons: ['Action is outside autonomous authority'] };
  if (CONFIRM.has(normalized)) reasons.push('Human confirmation required for high-impact action');
  if (context.authorized === false) return { decision: AUTONOMY.BLOCK, risk: 'high', reasons: ['Authorization failed'] };
  if (context.customerIntent === false) return { decision: AUTONOMY.BLOCK, risk: 'high', reasons: ['Action does not match customer intent'] };
  return { decision: reasons.length ? AUTONOMY.CONFIRM : AUTONOMY.AUTO, risk: reasons.length ? 'medium' : 'low', reasons };
}

export function alignmentRecord(action, result, context = {}) {
  const evaluation = evaluateAlignment(action, context);
  return { action, result, ...evaluation, at: new Date().toISOString() };
}
