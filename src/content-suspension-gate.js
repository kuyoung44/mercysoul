import crypto from 'node:crypto';
import { loadContentSuspensionState, persistContentSuspension, updateContentSuspension } from './supabase.js';

export const CONTENT_SUSPENSION_GATE = Object.freeze({
  name: 'MercySoul Auto-Suspend Evidence Gate',
  version: '1.0.0',
  mode: 'suspend-until-concrete-evidence',
  principle: 'Suspicious links/images are quarantined inside MercySoul until evidence establishes that they are safe; suspension is not a finding of guilt.',
  automaticExternalAction: false,
  publicInternetControl: false,
  humanConfirmationRequiredForRelease: true,
  auditRequired: true,
  strikeProtocol: 'THUNDER-IJI'
});

const URL_RE = /https?:\/\/[^\s<>"')]+/gi;
const SHORTENER_RE = /(?:bit\.ly|tinyurl\.com|t\.co|is\.gd|ow\.ly|buff\.ly|cutt\.ly|rebrand\.ly|shorturl\.at)\//i;
const TRACKING_PARAMS = /(?:[?&](?:utm_[^=&]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|vero_id)=)/i;
const REDIRECT_RE = /(?:redirect|redir|url=|target=|dest=|destination=|continue=|next=)/i;
const IP_HOST_RE = /^https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)/i;
const PUNYCODE_RE = /https?:\/\/[^/]*xn--/i;

const state = new Map();
let persistenceReady = false;
let persistenceError = null;

function normalize(value) {
  return String(value ?? '').trim().slice(0, 20000);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function extractUrls(input = {}) {
  const values = [
    input.url,
    input.link,
    ...(Array.isArray(input.urls) ? input.urls : []),
    normalize(input.content ?? input.text ?? input.message ?? input.body)
  ];
  return [...new Set(values.flatMap(value => normalize(value).match(URL_RE) || (String(value).startsWith('http') ? [String(value)] : [])))].slice(0, 25);
}

function inspectUrl(url) {
  const reasons = [];
  let score = 0;
  const value = normalize(url);
  if (!/^https:\/\//i.test(value)) { score += 1; reasons.push('non-https-url'); }
  if (SHORTENER_RE.test(value)) { score += 2; reasons.push('url-shortener'); }
  if (TRACKING_PARAMS.test(value)) { score += 2; reasons.push('tracking-parameter'); }
  if (REDIRECT_RE.test(value)) { score += 2; reasons.push('redirect-pattern'); }
  if (IP_HOST_RE.test(value)) { score += 2; reasons.push('literal-ip-host'); }
  if (PUNYCODE_RE.test(value)) { score += 2; reasons.push('punycode-host'); }
  return { score, reasons };
}

function accountKey(input) {
  return normalize(input.accountId ?? input.userId ?? input.actorId ?? '');
}

function imageFingerprint(input) {
  const supplied = normalize(input.imageHash ?? input.imageId ?? input.imageUrl ?? input.image_url ?? '');
  return supplied ? hash(supplied) : null;
}

export function inspectContent(input = {}) {
  const urls = extractUrls(input);
  const urlFindings = urls.map(inspectUrl);
  const image = imageFingerprint(input);
  const subjectKeys = [...urls.map(hash), ...(image ? [image] : [])];
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  let repeatCount = 0;

  for (const key of subjectKeys) {
    const previous = state.get(key) || [];
    const recent = previous.filter(ts => now - ts < windowMs);
    repeatCount = Math.max(repeatCount, recent.length + 1);
    state.set(key, [...recent, now].slice(-20));
  }

  const score = urlFindings.reduce((sum, finding) => sum + finding.score, 0) + (repeatCount >= 3 ? 3 : 0);
  const reasons = [...new Set(urlFindings.flatMap(finding => finding.reasons))];
  if (repeatCount >= 3) reasons.push('repeated-content-24h');

  const hasLinkOrImage = urls.length > 0 || Boolean(image);
  const suspicious = hasLinkOrImage && (score >= 3 || repeatCount >= 3);

  return {
    gate: CONTENT_SUSPENSION_GATE.name,
    version: CONTENT_SUSPENSION_GATE.version,
    inspected: true,
    hasLinkOrImage,
    suspicious,
    decision: suspicious ? 'suspend' : 'allow',
    status: suspicious ? 'suspended_pending_evidence' : 'clear',
    score,
    repeatCount,
    urlsInspected: urls.length,
    imageInspected: Boolean(image),
    reasons,
    evidenceRequired: suspicious,
    releaseRequiresConfirmation: suspicious,
    strike: suspicious ? 'THUNDER-IJI' : null
  };
}

export function createContentSuspension(input = {}, inspection = inspectContent(input)) {
  if (!inspection.suspicious) return null;
  const fingerprint = hash([
    ...extractUrls(input),
    normalize(input.imageHash ?? input.imageId ?? input.imageUrl ?? input.image_url ?? ''),
    accountKey(input)
  ].join('|'));

  const existing = state.get('review:' + fingerprint);
  if (existing) return existing;

  const review = {
    reviewId: 'CSG-' + crypto.randomUUID(),
    fingerprint,
    accountId: accountKey(input) || null,
    status: 'suspended_pending_evidence',
    decision: 'pending',
    createdAt: new Date().toISOString(),
    evidence: {
      requestId: input.requestId || null,
      source: input.source || input.path || 'unknown',
      contentId: input.id || null,
      contentType: input.type || 'unknown',
      inspection,
      urlCount: inspection.urlsInspected,
      imageInspected: inspection.imageInspected
    }
  };

  state.set('review:' + fingerprint, review);
  return review;
}

export async function persistContentReview(review) {
  if (!review) return { persisted: false, reason: 'no-review' };
  return persistContentSuspension(review);
}

export async function initializeContentSuspensionPersistence() {
  try {
    const loaded = await loadContentSuspensionState();
    for (const row of loaded.reviews || []) {
      const review = {
        reviewId: row.review_id,
        fingerprint: row.fingerprint,
        accountId: row.account_id || null,
        status: row.status,
        decision: row.decision,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at || null,
        reviewedBy: row.reviewed_by || null,
        evidence: row.evidence || {}
      };
      state.set('review:' + review.fingerprint, review);
    }
    persistenceReady = true;
    persistenceError = null;
    return { persisted: loaded.persisted, loadedReviews: (loaded.reviews || []).length };
  } catch (error) {
    persistenceReady = false;
    persistenceError = error.message;
    throw error;
  }
}

export async function confirmContentEvidence(reviewId, actor = 'authorized-reviewer', evidence = {}) {
  const review = [...state.values()].find(item => item?.reviewId === reviewId);
  if (!review) return { ok: false, error: 'CONTENT_REVIEW_NOT_FOUND' };
  if (review.decision !== 'pending') return { ok: false, error: 'CONTENT_REVIEW_ALREADY_DECIDED', review };

  const reviewedAt = new Date().toISOString();
  await updateContentSuspension(review.reviewId, {
    decision: 'confirmed_safe',
    status: 'released',
    reviewed_at: reviewedAt,
    reviewed_by: actor,
    release_evidence: evidence
  });

  review.decision = 'confirmed_safe';
  review.status = 'released';
  review.reviewedAt = reviewedAt;
  review.reviewedBy = actor;
  review.evidence.releaseEvidence = evidence;
  return { ok: true, review };
}

export function contentSuspensionStatus() {
  const reviews = [...state.values()].filter(value => value?.reviewId);
  return {
    ...CONTENT_SUSPENSION_GATE,
    openSuspensions: reviews.filter(r => r.decision === 'pending').length,
    released: reviews.filter(r => r.decision === 'confirmed_safe').length,
    persistenceReady,
    persistenceError
  };
}
