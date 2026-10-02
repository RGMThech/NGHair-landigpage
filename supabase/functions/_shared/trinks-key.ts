// Seleciona o token da API Trinks por salão, com o token do outro salão como
// reserva automática quando o principal esgota a cota (429).
const KEY_POR_ESTAB: Record<string, string> = {
  "20181": "TRINKS_API_KEY", // Campo Belo
  "281029": "TRINKS_API_KEY_BROOKLIN", // Brooklin
};

export function trinksKeys(estab: string): string[] {
  const principal = Deno.env.get(KEY_POR_ESTAB[estab] ?? "TRINKS_API_KEY");
  const reserva = estab === "281029"
    ? Deno.env.get("TRINKS_API_KEY")
    : Deno.env.get("TRINKS_API_KEY_BROOKLIN");
  return [...new Set([principal, reserva].filter((k): k is string => !!k))];
}
