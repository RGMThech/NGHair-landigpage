// Registra cada chamada de API externa em api_call_log (sem bloquear a resposta).
const UNIDADE_NOME: Record<string, string> = { "20181": "Campo Belo", "281029": "Brooklin" };

export function logApiCall(api: string, endpoint: string, metodo: string, estab: string | null, status: number, origem: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return;
  fetch(`${url}/rest/v1/api_call_log`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      api, endpoint: endpoint.split("?")[0].slice(0, 200), metodo,
      unidade: estab ? UNIDADE_NOME[estab] ?? estab : null, status, origem,
    }),
  }).catch((e) => console.error("api_log", e));
}
