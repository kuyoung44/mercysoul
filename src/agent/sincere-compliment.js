const openers = ['I really admire', 'I appreciate', 'I like'];
const traits = [
  'how you value family',
  'how you think about a good life',
  'your calm and honest way of replying',
  'the way you keep family at the center'
];
const endings = ['It says a lot about you.', "That's rare to find.", 'I respect that a lot.'];

export function generateSincereCompliment(random = Math.random) {
  const pick = (items) => items[Math.floor(random() * items.length)];
  return pick(openers) + ' ' + pick(traits) + '. ' + pick(endings);
}
