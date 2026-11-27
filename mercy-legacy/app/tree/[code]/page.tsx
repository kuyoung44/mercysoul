export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminDb } from "@/lib/supabase/admin";

export default async function Tree({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = getAdminDb();
  const { data: tree } = await db
    .from("legacy_trees")
    .select("tree_code,species,planted_at,site_name,status,legacy_profiles!inner(legacy_code,full_name,visibility)")
    .eq("tree_code", code)
    .maybeSingle();

  if (!tree || !["verified", "living"].includes(tree.status)) notFound();

  const profile = tree.legacy_profiles?.[0];
  if (!profile || profile.visibility !== "public") notFound();

  return (
    <main className="wrap">
      <section className="hero">
        <div className="eyebrow">LIVING TREE · {tree.tree_code}</div>
        <h1>{tree.species || "A Living Tree"}</h1>
        <p className="lead">
          Planted {tree.planted_at || "with care"} at {tree.site_name || "a MercyLegacy forest site"}.
        </p>
        <p>
          Connected legacy: <Link href={"/legacy/" + profile.legacy_code}>{profile.full_name}</Link>
        </p>
        <Link className="btn alt" href="/forest">Forest Map</Link>
      </section>
    </main>
  );
}
