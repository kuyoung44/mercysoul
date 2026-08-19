const styles = ['cinematic', 'editorial', 'fine-art', 'photorealistic', 'surreal', 'minimal'];

export function buildCreativeBrief(rawIdea = '') {
  const idea = rawIdea.trim().replace(/\s+/g, ' ');
  if (!idea) throw new Error('A vision is required');
  const lower = idea.toLowerCase();
  const style = styles.find((item) => lower.includes(item)) || 'cinematic';
  return {
    source: idea,
    subject: idea.slice(0, 240),
    style,
    mood: inferMood(lower),
    composition: inferComposition(lower),
    lighting: 'intentional cinematic lighting with clear subject separation',
    direction: `Create a polished MercySoul artwork from this vision: ${idea}`,
    status: 'brief_ready'
  };
}

function inferMood(text) {
  if (/dark|myster|night|shadow/.test(text)) return 'mysterious';
  if (/joy|happy|bright|celebrat/.test(text)) return 'joyful';
  if (/power|king|queen|warrior|strong/.test(text)) return 'powerful';
  return 'evocative';
}

function inferComposition(text) {
  if (/portrait|person|standing|full body|full-body/.test(text)) return 'hero portrait';
  if (/landscape|city|mountain|ocean|forest/.test(text)) return 'wide environmental scene';
  return 'subject-led balanced composition';
}
