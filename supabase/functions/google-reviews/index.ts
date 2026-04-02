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
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    // Using Places API (New)
    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}?fields=rating,userRatingCount,reviews&languageCode=pt-BR`;

    const response = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} - ${JSON.stringify(data)}`);
    }

    const result = {
      rating: data.rating,
      totalReviews: data.userRatingCount,
      reviews: (data.reviews || []).map((r: any) => ({
        name: r.authorAttribution?.displayName || "Anônimo",
        text: r.text?.text || r.originalText?.text || "",
        rating: r.rating,
        time: r.relativePublishTimeDescription || "",
        profilePhoto: r.authorAttribution?.photoUri || "",
      })),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
