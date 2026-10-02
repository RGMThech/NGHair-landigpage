// Agendamentos futuros da colaboradora Eurofarma logada (localizada no Trinks pelo RE no nome).
// Nunca devolve valores ao navegador.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { logApiCall } from "../_shared/api-log.ts";
import { trinksKeys } from "../_shared/trinks-key.ts";

const API = "https://api.trinks.com/v1";
const UNIDADES: Record<string, { id: string; nome: string }> = {
  "campo-belo": { id: "20181", nome: "Campo Belo" },
  brooklin: { id: "281029", nome: "Brooklin" },
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function trinks(path: string, estab: string, init: RequestInit = {}) {
  const keys = trinksKeys(estab);
  if (!keys.length) throw new Error("not_configured");
  for (const key of keys) {
    const r = await fetch(`${API}${path}`, {
      ...init,
      headers: { "X-Api-Key": key, estabelecimentoId: estab, "Content-Type": "application/json" },
    });
    const t = await r.text();
    logApiCall("Trinks", path, init.method ?? "GET", estab, r.status, "eurofarma");
    // Cota do token esgotada: tenta o token reserva do outro salão.
    if (r.status === 429) continue;
    if (!r.ok) { console.error("trinks", path, r.status, t.slice(0, 300)); throw new Error(`trinks_${r.status}`); }
    return t ? JSON.parse(t) : {};
  }
  throw new Error("trinks_429");
}
const list = (d: any) => (Array.isArray(d) ? d : d?.data ?? []);
const normRe = (s: string) => s.replace(/\D/g, "").replace(/^0+/, "") || "0";
const ymd = (d: Date) => d.toISOString().slice(0, 10);

const normNome = (s: string) =>
  String(s ?? "").replace(/\|[^|]*\|.*$/, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();

// Localiza a colaboradora pelo RE (código no nome) OU pelo nome completo do perfil (igual, sem acentos).
async function clientesDoRe(re: string, estab: string, nome?: string | null) {
  const ids = new Set<number>();
  const alvo = normRe(re ?? "");
  if (alvo !== "0") {
    const found = list(await trinks(`/clientes?nome=${encodeURIComponent(alvo)}&pageSize=50`, estab));
    for (const c of found) {
      const m = String(c.nome ?? "").match(/\|\s*(\d+)\s*\|/);
      if (m && normRe(m[1]) === alvo) ids.add(Number(c.id));
    }
  }
  const n = normNome(nome ?? "");
  if (n.length >= 5 && n.includes(" ")) {
    const found = list(await trinks(`/clientes?nome=${encodeURIComponent(String(nome).trim())}&pageSize=50`, estab));
    for (const c of found) if (normNome(c.nome) === n) ids.add(Number(c.id));
  }
  return [...ids];
}

async function agendamentosDe(clienteId: number, estab: string, ini: string, fim: string) {
  const out: any[] = [];
  for (let page = 1; page <= 5; page++) {
    const d = await trinks(`/agendamentos?clienteId=${clienteId}&dataInicio=${ini}&dataFim=${fim}&pageSize=50&page=${page}`, estab);
    out.push(...list(d));
    if (!d?.totalPages || page >= d.totalPages) break;
  }
  return out.filter((a) => a?.cliente?.id === clienteId);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "nao_autenticado" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: u, error } = await userClient.auth.getUser();
    if (error || !u.user) return json({ error: "sessao_invalida" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await admin.from("eurofarma_profiles").select("re, full_name").eq("user_id", u.user.id).maybeSingle();
    if (!profile?.re && !profile?.full_name) return json({ error: "sem_re" }, 403);

    const body = await req.json().catch(() => ({}));
    const hoje = new Date(Date.now() - 3 * 3600_000); // horário de São Paulo
    const fimD = new Date(hoje); fimD.setMonth(fimD.getMonth() + 2);
    const ini = ymd(hoje), fim = ymd(fimD);
    const agoraSP = hoje.toISOString().slice(0, 16);

    if (body.action === "cancelar") {
      const un = UNIDADES[body.unidade];
      const agId = Number(body.agendamentoId);
      if (!un || !agId) return json({ error: "dados_invalidos" }, 400);
      const ids = await clientesDoRe(profile.re, un.id, profile.full_name);
      let pertence = false;
      for (const id of ids) {
        if ((await agendamentosDe(id, un.id, ini, fim)).some((a) => a.id === agId)) { pertence = true; break; }
      }
      if (!pertence) return json({ error: "nao_encontrado" }, 404);
      await trinks(`/agendamentos/${agId}/status/cancelado`, un.id, {
        method: "PATCH",
        body: JSON.stringify({ quemCancelou: 2, motivo: "Cancelado pela cliente no Portal Eurofarma" }),
      });
      return json({ ok: true });
    }

    const agendamentos: any[] = [];
    for (const [slug, un] of Object.entries(UNIDADES)) {
      try {
        for (const id of await clientesDoRe(profile.re, un.id, profile.full_name)) {
          for (const a of await agendamentosDe(id, un.id, ini, fim)) {
            const st = String(a?.status?.nome ?? "");
            if (/cancel|finaliz|faltou/i.test(st)) continue;
            if (String(a.dataHoraInicio).slice(0, 16) < agoraSP) continue;
            agendamentos.push({
              id: a.id, unidade: slug, unidadeNome: un.nome, status: st,
              servico: a?.servico?.nome ?? "", profissional: a?.profissional?.nome ?? "",
              dataHoraInicio: a.dataHoraInicio, duracao: a.duracaoEmMinutos ?? null,
            });
          }
        }
      } catch (e) {
        console.error("unidade indisponivel", slug, (e as Error).message);
      }
    }
    agendamentos.sort((a, b) => String(a.dataHoraInicio).localeCompare(String(b.dataHoraInicio)));
    return json({ agendamentos, ate: fim });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message || "erro" }, 500);
  }
});
