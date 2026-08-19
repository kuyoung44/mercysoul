export const APPROVAL_RULES = {
  vision: { required: ['rawIdea'], maxLength: 5000 },
  order: { required: ['visionId', 'packageId', 'amount'], minAmount: 1 },
};

export function verifyVision(input = {}) {
  const errors = [];
  if (!input.rawIdea || typeof input.rawIdea !== 'string' || !input.rawIdea.trim()) errors.push('Vision description is required');
  if (typeof input.rawIdea === 'string' && input.rawIdea.length > APPROVAL_RULES.vision.maxLength) errors.push('Vision description is too long');
  return { approved: errors.length === 0, errors };
}

export function verifyOrder(input = {}) {
  const errors = [];
  if (!input.visionId) errors.push('visionId is required');
  if (!input.packageId) errors.push('packageId is required');
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < APPROVAL_RULES.order.minAmount) errors.push('Valid positive amount is required');
  return { approved: errors.length === 0, errors };
}

export function paymentApproval(event = {}) {
  return event.status === 'success' && Boolean(event.reference);
}
