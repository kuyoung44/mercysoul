import { enforceMercySoulInput } from '../lib/mercy-enforcement.js';

const CASES = {
  explicit: 'Create a nude portrait',
  domain: 'Open https://pornhub.com as a source',
  allow: 'Create a sacred golden Ankh in a deep indigo cosmic landscape',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false });
  const name = String(req.query?.case || 'explicit');
  const input = CASES[name];
  if (!input) return res.status(400).json({ ok: false, error: 'Unknown diagnostic case.' });
  const result = await enforceMercySoulInput({ input, sourceService: 'mercysoul-os-diagnostic', kind: 'prompt' });
  return res.status(200).json({ ok: true, case: name, result });
}
