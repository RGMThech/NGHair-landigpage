import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Unidade = { slug: string; nome: string; placeId?: string; query: string };

const UNIDADES: Unidade[] = [
  { slug: "campo-belo", nome: "Campo Belo", placeId: "ChIJESZwFZ5QzpQRYl4wRxkKvqo", query: "NGHair Campo Belo São Paulo" },
  { slug: "brooklin", nome: "Brooklin", query: "NGHair Rua Barão do Triunfo 1455 Brooklin São Paulo" },
];

const placeIdCache = new Map<string, string>();
let lastSync = 0;
const SYNC_TTL = 24 * 60 * 60 * 1000; // 24h — Google só é consultado quando alguém abre o site, no máximo 1x ao dia

async function resolvePlaceId(u: Unidade, key: string): Promise<string | null> {
  if (u.placeId) return u.placeId;
  if (placeIdCache.has(u.slug)) return placeIdCache.get(u.slug)!;
  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress" },
    body: JSON.stringify({ textQuery: u.query, languageCode: "pt-BR" }),
  });
  const d = await r.json();
  const p = (d.places || []).find((x: any) => /triunfo/i.test(x.formattedAddress || "")) || d.places?.[0];
  if (!p?.id) { console.error("place não encontrado", u.slug, JSON.stringify(d).slice(0, 300)); return null; }
  placeIdCache.set(u.slug, p.id);
  return p.id;
}

type Rev = { author: string; text: string; rating: number; rel: string; photo: string; publishedAt: string | null };

async function fetchNew(placeId: string, key: string) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews" },
  });
  const d = await r.json();
  if (!r.ok) { console.error("v1", d); return { rating: null, total: null, reviews: [] as Rev[] }; }
  return {
    rating: d.rating ?? null,
    total: d.userRatingCount ?? null,
    reviews: (d.reviews || []).map((x: any): Rev => ({
      author: x.authorAttribution?.displayName || "Anônimo",
      text: x.text?.text || x.originalText?.text || "",
      rating: x.rating,
      rel: x.relativePublishTimeDescription || "",
      photo: x.authorAttribution?.photoUri || "",
      publishedAt: x.publishTime || null,
    })),
  };
}

// API legada permite ordenar por "mais recentes"
async function fetchLegacy(placeId: string, key: string, sort: "newest" | "most_relevant"): Promise<Rev[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&reviews_sort=${sort}&language=pt-BR&key=${key}`;
    const d = await (await fetch(url)).json();
    if (d.status !== "OK") { console.warn("legacy", sort, d.status, d.error_message); return []; }
    return (d.result?.reviews || []).map((x: any): Rev => ({
      author: x.author_name || "Anônimo",
      text: x.text || "",
      rating: x.rating,
      rel: x.relative_time_description || "",
      photo: x.profile_photo_url || "",
      publishedAt: x.time ? new Date(x.time * 1000).toISOString() : null,
    }));
  } catch (e) { console.warn("legacy erro", e); return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const key = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const resumo: Record<string, { nome: string; rating: number | null; totalReviews: number | null }> = {};

    if (key && Date.now() - lastSync > SYNC_TTL) {
      for (const u of UNIDADES) {
        try {
          const pid = await resolvePlaceId(u, key);
          if (!pid) continue;
          const [n, newest, relevant] = await Promise.all([
            fetchNew(pid, key), fetchLegacy(pid, key, "newest"), fetchLegacy(pid, key, "most_relevant"),
          ]);
          resumo[u.slug] = { nome: u.nome, rating: n.rating, totalReviews: n.total };
          const seen = new Set<string>();
          for (const r of [...newest, ...n.reviews, ...relevant]) {
            if (!r.text) continue;
            const id = `${u.slug}_${r.author}_${r.text.substring(0, 50)}`.replace(/\s+/g, "_");
            if (seen.has(id)) continue;
            seen.add(id);
            await supabase.from("google_reviews").upsert({
              author_name: r.author, review_text: r.text, rating: r.rating, relative_time: r.rel,
              profile_photo_url: r.photo, google_review_id: id, unidade: u.slug,
              published_at: r.publishedAt, updated_at: new Date().toISOString(),
            }, { onConflict: "google_review_id" });
          }
        } catch (e) { console.error("unidade", u.slug, e); }
      }
      lastSync = Date.now();
      if (Object.keys(resumo).length) {
        await supabase.from("google_reviews").delete().like("google_review_id", "__resumo_%");
      }
    }

    const { data, error } = await supabase
      .from("google_reviews").select("*")
      .gte("rating", 4)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(40);
    if (error) throw new Error(error.message);

    const ratings = Object.values(resumo).filter((r) => r.rating && r.totalReviews);
    const totalReviews = ratings.reduce((s, r) => s + (r.totalReviews || 0), 0) || null;
    const rating = totalReviews ? ratings.reduce((s, r) => s + r.rating! * r.totalReviews!, 0) / totalReviews : null;

    return new Response(JSON.stringify({
      rating, totalReviews, unidades: resumo,
      reviews: (data || []).map((r: any) => ({
        name: r.author_name, text: r.review_text, rating: r.rating, time: r.relative_time,
        profilePhoto: r.profile_photo_url, unidade: r.unidade, publishedAt: r.published_at,
      })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
