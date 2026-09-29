import crypto from 'node:crypto';

function clean(value, max = 256) { return String(value ?? '').trim().slice(0, max); }
function timingSafeEqualHex(a, b) {
  if (!a || !b || !/^[a-f0-9]+$/i.test(a) || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
export const KYC_PAYMENT_PROTOCOL = { name: 'MERCYSOUL KYC-BEFORE-PAYMENT', version: '1.0.0', policy: 'fail-closed' };
export function signKycAssertion({ subject, reference, expiresAt }, secret = process.env.KYC_SIGNING_SECRET) {
  if (!secret) throw new Error('KYC_SIGNING_SECRET is not configured');
  const payload = [clean(subject), clean(reference), clean(expiresAt)].join('|');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
export function verifyKycAssertion({ subject, reference, expiresAt, signature } = {}) {
  const secret = String(process.env.KYC_SIGNING_SECRET || '').trim();
  if (!secret) return { verified: false, code: 'KYC_NOT_CONFIGURED', reason: 'KYC verification infrastructure is not configured' };
  const s = clean(subject), r = clean(reference), e = clean(expiresAt), sig = clean(signature, 256);
  if (!s || !r || !e || !sig) return { verified: false, code: 'KYC_REQUIRED', reason: 'Verified KYC assertion is required before payment' };
  const expiry = Date.parse(e);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return { verified: false, code: 'KYC_EXPIRED', reason: 'KYC verification has expired' };
  const expected = signKycAssertion({ subject: s, reference: r, expiresAt: e }, secret);
  if (!timingSafeEqualHex(sig, expected)) return { verified: false, code: 'KYC_INVALID', reason: 'KYC verification signature is invalid' };
  return { verified: true, reference: r, expiresAt: e };
}
export function requireVerifiedKyc(input) { const result = verifyKycAssertion(input); return result.verified ? { ok: true, kyc: result } : { ok: false, status: 403, kyc: result }; }
export function kycPaymentStatus() { return { ...KYC_PAYMENT_PROTOCOL, configured: Boolean(String(process.env.KYC_SIGNING_SECRET || '').trim()), paymentRule: 'KYC verification is required before payment authorization' }; }
