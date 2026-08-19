import { createClient } from '@supabase/supabase-js';

const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const requireDurable = process.env.REQUIRE_DURABLE_PERSISTENCE === 'true';
if (requireDurable && !hasSupabase) throw new Error('Durable persistence is required but Supabase is not configured');
const supabase = hasSupabase ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }) : null;

export function storeMode() { return hasSupabase ? 'supabase' : 'memory'; }
export function durablePersistenceEnabled() { return hasSupabase; }
export function persistenceRequirement() { return requireDurable ? 'required' : 'optional'; }

export async function saveVision(vision) {
  if (!supabase) return { data: vision, error: null };
  const { data, error } = await supabase.from('visions').insert({ raw_idea: vision.rawIdea, status: vision.status, approval: vision.approval }).select().single();
  return { data, error };
}

export async function saveOrder(order) {
  if (!supabase) return { data: order, error: null };
  const { data, error } = await supabase.from('orders').insert({ vision_id: order.visionId, package: order.package, amount: order.amount, currency: order.currency || 'NGN', status: order.status, approval: order.approval, payment_reference: order.reference }).select().single();
  return { data, error };
}

export async function listOrders() {
  if (!supabase) return { data: null, error: null };
  return supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
}

export async function listVisions() {
  if (!supabase) return { data: null, error: null };
  return supabase.from('visions').select('*').order('created_at', { ascending: false }).limit(100);
}

export async function logEvent(type, entityId, data = {}) {
  if (!supabase) return { data: null, error: null };
  return supabase.from('events').insert({ type, entity_id: entityId || null, data });
}
