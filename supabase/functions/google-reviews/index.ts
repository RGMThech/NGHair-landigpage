import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLACE_ID = "ChIJESZwFZ5QzpQRYl4wRxkKvqo";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch fresh reviews from Google Places API
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    let googleRating: number | null = null;
    let googleTotalReviews: number | null = null;

    if (apiKey) {
      try {
        const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=rating,userRatingCount,reviews&languageCode=pt-BR`;
        const response = await fetch(url, {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "rating,userRatingCount,reviews",
          },
        });

        const data = await response.json();

        if (response.ok && data.reviews) {
          googleRating = data.rating;
          googleTotalReviews = data.userRatingCount;

          // 2. Upsert new reviews into cache table
          for (const r of data.reviews) {
            const authorName = r.authorAttribution?.displayName || "Anônimo";
            const reviewText = r.text?.text || r.originalText?.text || "";
            const rating = r.rating;
            const relativeTime = r.relativePublishTimeDescription || "";
            const profilePhoto = r.authorAttribution?.photoUri || "";
            // Create a unique ID from author name + first 50 chars of text
            const googleReviewId = `${authorName}_${reviewText.substring(0, 50)}`.replace(/\s+/g, '_');

            await supabase.from("google_reviews").upsert(
              {
                author_name: authorName,
                review_text: reviewText,
                rating,
                relative_time: relativeTime,
                profile_photo_url: profilePhoto,
                google_review_id: googleReviewId,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "google_review_id" }
            );
          }
        }
      } catch (err) {
        console.error("Error fetching from Google:", err);
      }
    }

    // 3. Return ALL cached reviews from database
    const { data: cachedReviews, error: dbError } = await supabase
      .from("google_reviews")
      .select("*")
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const result = {
      rating: googleRating,
      totalReviews: googleTotalReviews,
      reviews: (cachedReviews || []).map((r: any) => ({
        name: r.author_name,
        text: r.review_text,
        rating: r.rating,
        time: r.relative_time,
        profilePhoto: r.profile_photo_url,
      })),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
