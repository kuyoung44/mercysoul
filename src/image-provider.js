export async function generateImage(prompt) {
  const provider = process.env.IMAGE_PROVIDER || 'not_configured';

  if (provider === 'mock') {
    return {
      provider,
      status: 'completed',
      imageUrl: 'https://example.invalid/mercysoul/mock-artwork.png'
    };
  }

  return {
    provider,
    status: 'awaiting_provider',
    imageUrl: null,
    message: 'Configure an approved image provider before production generation.'
  };
}
