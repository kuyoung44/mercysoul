import { createArtworkJob } from './creation-engine.js';
import { generateImage } from './image-provider.js';
import { saveArtworkJob, updateArtwork } from './artwork-store.js';

export async function runCreationPipeline(vision, order) {
  const job = createArtworkJob(vision, order);
  if (job.status !== 'queued') return job;

  const saved = await saveArtworkJob(job);
  if (saved.error) throw saved.error;

  const artworkId = saved.data?.id || job.id;
  const generation = await generateImage(job.prompt);

  if (generation.status === 'completed') {
    const result = await updateArtwork(artworkId, {
      status: 'completed',
      image_url: generation.imageUrl
    });
    if (result.error) throw result.error;
    return { ...job, id: artworkId, ...generation, status: 'completed' };
  }

  await updateArtwork(artworkId, { status: generation.status });
  return { ...job, id: artworkId, status: generation.status, provider: generation.provider };
}
