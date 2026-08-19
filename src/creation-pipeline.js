import { createArtworkJob } from './creation-engine.js';
import { generateImage } from './image-provider.js';
import { saveArtworkJob, updateArtwork } from './artwork-store.js';

export async function runCreationPipeline(vision, order) {
  const job = createArtworkJob(vision, order);
  if (job.status !== 'ready_for_creation') return job;

  const saved = await saveArtworkJob(job);
  if (saved.error) throw saved.error;

  const artworkId = saved.data?.id || job.id;
  const queuedJob = { ...job, id: artworkId, status: 'creating' };
  await updateArtwork(artworkId, { status: 'creating' });

  const generation = await generateImage(job.prompt);

  if (generation.status === 'completed') {
    const result = await updateArtwork(artworkId, {
      status: 'completed',
      image_url: generation.imageUrl
    });
    if (result.error) throw result.error;
    return { ...queuedJob, ...generation, status: 'completed' };
  }

  await updateArtwork(artworkId, { status: generation.status });
  return { ...queuedJob, status: generation.status, provider: generation.provider, message: generation.message };
}
