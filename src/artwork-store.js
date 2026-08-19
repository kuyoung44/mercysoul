import { createClient } from '@supabase/supabase-js';

const enabled = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = enabled ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }) : null;

export async function saveArtworkJob(job) {
  if (!supabase) return { data: job, error: null };
  const { data, error } = await supabase.from('artworks').insert({
    order_id: job.orderId,
    status: job.status,
    prompt: job.prompt,
    image_url: job.imageUrl || null
  }).select().single();
  return { data, error };
}

export async function updateArtwork(id, patch) {
  if (!supabase) return { data: { id, ...patch }, error: null };
  const { data, error } = await supabase.from('artworks').update(patch).eq('id', id).select().single();
  return { data, error };
}
