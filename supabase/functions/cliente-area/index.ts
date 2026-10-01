// Área do Cliente NGHair: login por código no e-mail (cliente localizada/criada no Trinks),
// perfil sincronizado e agendamentos futuros com cancelamento. Nunca devolve valores.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-region",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API = "https://api.trinks.com/v1";
const ESTAB = "20181"; // Campo Belo (Brooklin aguardando liberação da API)
const UNIDADES: Record<string, { id: string; nome: string }> = {
  "campo-belo": { id: "20181", nome: "Campo Belo" },
  brooklin: { id: "281029", nome: "Brooklin" },
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

async function trinks(path: string, estab: string, init: RequestInit = {}) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`${API}${path}`, {
      ...init,
      headers: { "X-Api-Key": Deno.env.get("TRINKS_API_KEY")!, estabelecimentoId: estab, "Content-Type": "application/json" },
    });
    const t = await r.text();
    if (r.status === 429 && i < 2) {
      await new Promise((res) => setTimeout(res, Math.min(Number(r.headers.get("retry-after") ?? 2), 10) * 1000));
      continue;
    }
    if (!r.ok) { console.error("trinks", path, r.status, t.slice(0, 300)); throw new Error(`trinks_${r.status}`); }
    try { return t ? JSON.parse(t) : {}; } catch { return {}; }
  }
  throw new Error("trinks_429");
}
const list = (d: any) => (Array.isArray(d) ? d : d?.data ?? []);
const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const digits = (t: any) => {
  const s = typeof t === "string" ? t : `${t?.ddi ?? ""}${t?.ddd ?? ""}${t?.numero ?? ""}`;
  let d = s.replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  return d;
};
const hasCode = (n: string) => /\|\s*\d+\s*\|/.test(n);

async function buscarPorEmail(email: string) {
  const found = list(await trinks(`/clientes?email=${encodeURIComponent(email)}&pageSize=10`, ESTAB));
  return found.find((c: any) => clean(c?.email, 150).toLowerCase() === email) ?? null;
}

async function sendCode(email: string, code: string) {
  const client = new SMTPClient({
    connection: { hostname: "smtp.hostinger.com", port: 465, tls: true,
      auth: { username: "contato@nghair.com.br", password: Deno.env.get("SMTP_PASSWORD")! } },
  });
  try {
    await client.send({
      from: "NGHair <contato@nghair.com.br>", to: email,
      subject: "Seu código de acesso - NGHair",
      content: `Seu código de acesso à Área do Cliente NGHair: ${code}\nEle expira em 10 minutos.`,
      html: `<div style="font-family:Arial,sans-serif;padding:20px 25px;color:#000">
        <h1 style="font-size:22px;margin:0 0 20px">Seu código de acesso NGHair</h1>
        <p style="font-size:14px;color:#55575d;margin:0 0 25px">Use o código abaixo para entrar na sua Área do Cliente. Ele expira em 10 minutos.</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 0 25px">${code}</p>
        <p style="font-size:12px;color:#999">Se você não solicitou este código, ignore este e-mail.</p></div>`,
    });
  } finally { await client.close(); }
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
function genCode() {
  const b = new Uint32Array(1); crypto.getRandomValues(b);
  return String(b[0] % 1_000_000).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const email = clean(body.email, 150).toLowerCase();

    // ---------- Login (sem sessão) ----------
    if (action === "verificar" || action === "criar" || action === "enviar" || action === "validar") {
      if (!EMAIL_RE.test(email)) return json({ error: "email_invalido" });

      if (action === "verificar") {
        const c = await buscarPorEmail(email);
        return json({ encontrado: !!c });
      }

      if (action === "criar") {
        const nome = clean(body.nome, 100).replace(/\s+/g, " ");
        const tel = digits(clean(body.telefone, 30));
        if (nome.split(" ").length < 2) return json({ error: "nome_invalido" });
        if (tel.length < 10 || tel.length > 11) return json({ error: "telefone_invalido" });
        if (await buscarPorEmail(email)) return json({ ok: true, jaExistia: true });
        const ddd = tel.slice(0, 2), numero = tel.slice(2);
        const payload = JSON.stringify({
          nome, email, telefones: [{ ddi: "55", ddd, numero, tipoId: numero.length === 9 ? 3 : 1 }],
        });
        // Cadastro feito pela Área do Cliente é criado nos dois salões.
        await trinks("/clientes", ESTAB, { method: "POST", body: payload });
        for (const un of Object.values(UNIDADES)) {
          if (un.id === ESTAB) continue;
          try {
            const ja = list(await trinks(`/clientes?email=${encodeURIComponent(email)}&pageSize=5`, un.id))
              .some((c: any) => clean(c?.email, 150).toLowerCase() === email);
            if (!ja) await trinks("/clientes", un.id, { method: "POST", body: payload });
          } catch (e) {
            console.error("criar cliente na unidade", un.nome, (e as Error).message);
          }
        }
        // O Trinks às vezes cria sem devolver o ID: relocaliza pelo e-mail.
        for (let i = 0; i < 3; i++) {
          if (await buscarPorEmail(email)) return json({ ok: true });
          await new Promise((r) => setTimeout(r, 1500));
        }
        return json({ error: "criacao_nao_confirmada" });
      }

      if (action === "enviar") {
        if (!(await buscarPorEmail(email))) return json({ error: "nao_encontrado" });
        const { data: last } = await admin.from("cliente_login_codes").select("created_at")
          .eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (last && Date.now() - new Date(last.created_at).getTime() < RESEND_MS) return json({ error: "aguarde" });
        const code = genCode();
        await admin.from("cliente_login_codes").insert({
          email, code_hash: await sha(code), expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
        });
        try { await sendCode(email, code); } catch (e) { console.error("smtp", e); return json({ error: "envio_falhou" }); }
        return json({ ok: true });
      }

      // validar
      const code = clean(body.code, 6);
      const { data: row } = await admin.from("cliente_login_codes").select("id, code_hash, expires_at, attempts, used_at")
        .eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!/^\d{6}$/.test(code) || !row || row.used_at || new Date(row.expires_at) < new Date() || row.attempts >= MAX_ATTEMPTS) {
        return json({ error: "codigo_invalido" });
      }
      if ((await sha(code)) !== row.code_hash) {
        await admin.from("cliente_login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
        return json({ error: "codigo_invalido" });
      }
      await admin.from("cliente_login_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
      const { error: ce } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (ce && !/already|registered|exists/i.test(ce.message)) return json({ error: "erro_acesso" }, 500);
      const { data: link, error: le } = await admin.auth.admin.generateLink({ type: "magiclink", email });
      if (le || !link?.properties?.hashed_token) return json({ error: "erro_acesso" }, 500);

      // Cria/atualiza o perfil com os dados do Trinks
      const userId = link.user.id;
      const c = await buscarPorEmail(email).catch(() => null);
      const { data: existing } = await admin.from("cliente_profiles").select("id, full_name, phone").eq("user_id", userId).maybeSingle();
      let phone: string | null = null;
      if (c?.id) {
        try { phone = list(await trinks(`/clientes/${c.id}/telefones`, ESTAB)).map(digits).find((t: string) => t !== "11900000000") ?? null; } catch { /* ignora */ }
      }
      const nomeTrinks = c?.nome ? String(c.nome).replace(/\|[^|]*\|.*$/, "").trim() : null;
      const row2 = { user_id: userId, email, trinks_cliente_id: c?.id ?? null,
        full_name: existing?.full_name || nomeTrinks, phone: existing?.phone || phone };
      if (existing) await admin.from("cliente_profiles").update(row2).eq("id", existing.id);
      else await admin.from("cliente_profiles").insert(row2);
      return json({ ok: true, token_hash: link.properties.hashed_token });
    }

    // ---------- Ações autenticadas ----------
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "nao_autenticado" }, 401);
    const { data: perfil } = await admin.from("cliente_profiles").select("*").eq("user_id", u.user.id).maybeSingle();
    if (!perfil) return json({ error: "sem_perfil" }, 403);

    let clienteId: number | null = perfil.trinks_cliente_id;
    if (!clienteId) {
      const c = await buscarPorEmail(perfil.email).catch(() => null);
      if (c?.id) { clienteId = c.id; await admin.from("cliente_profiles").update({ trinks_cliente_id: c.id }).eq("id", perfil.id); }
    }
    if (!clienteId) return json({ error: "sem_cadastro_trinks" });

    if (action === "sincronizar") {
      // Atualiza nome e telefone no Trinks (nomes com código de colaborador nunca mudam)
      const nome = clean(body.nome, 100).replace(/\s+/g, " ");
      const tel = digits(clean(body.telefone, 30));
      const atual = await trinks(`/clientes/${clienteId}`, ESTAB);
      const nomeAtual = clean(atual?.nome, 100);
      if (nome && !hasCode(nomeAtual) && nome !== nomeAtual) {
        await trinks(`/clientes/${clienteId}`, ESTAB, { method: "PUT", body: JSON.stringify({
          nome, email: atual?.email || perfil.email, cpf: atual?.cpf || null, genero: atual?.genero || null,
          observacoes: atual?.observacoes || null, codigoExterno: atual?.codigoExterno || null,
        }) }).catch((e) => console.error("put nome", e));
      }
      if (tel.length >= 10 && tel.length <= 11) {
        const tels = list(await trinks(`/clientes/${clienteId}/telefones`, ESTAB));
        if (!tels.some((t: any) => digits(t) === tel)) {
          const ddd = tel.slice(0, 2), numero = tel.slice(2);
          await trinks(`/clientes/${clienteId}/telefones`, ESTAB, { method: "POST",
            body: JSON.stringify({ ddi: "55", ddd, numero, tipoId: numero.length === 9 ? 3 : 1 }) }).catch((e) => console.error("tel", e));
        }
        for (const t of tels) if (digits(t) === "11900000000" && t.id) {
          await trinks(`/clientes/${clienteId}/telefones/${t.id}`, ESTAB, { method: "DELETE" }).catch(() => undefined);
        }
      }
      return json({ ok: true, nomeProtegido: hasCode(nomeAtual) });
    }

    const hoje = new Date(Date.now() - 3 * 3600_000);
    const fimD = new Date(hoje); fimD.setMonth(fimD.getMonth() + 2);
    const ini = hoje.toISOString().slice(0, 10), fim = fimD.toISOString().slice(0, 10);
    const agoraSP = hoje.toISOString().slice(0, 16);
    const agsDe = async (estab: string) => {
      const out: any[] = [];
      for (let page = 1; page <= 5; page++) {
        const d = await trinks(`/agendamentos?clienteId=${clienteId}&dataInicio=${ini}&dataFim=${fim}&pageSize=50&page=${page}`, estab);
        out.push(...list(d));
        if (!d?.totalPages || page >= d.totalPages) break;
      }
      return out.filter((a) => a?.cliente?.id === clienteId);
    };

    if (action === "cancelar") {
      const agId = Number(body.agendamentoId);
      if (!agId) return json({ error: "dados_invalidos" }, 400);
      if (!(await agsDe(ESTAB)).some((a) => a.id === agId)) return json({ error: "nao_encontrado" }, 404);
      await trinks(`/agendamentos/${agId}/status/cancelado`, ESTAB, { method: "PATCH",
        body: JSON.stringify({ quemCancelou: 2, motivo: "Cancelado pela cliente na Área do Cliente" }) });
      return json({ ok: true });
    }

    if (action === "agendamentos") {
      const un = UNIDADES["campo-belo"];
      const agendamentos = (await agsDe(ESTAB))
        .filter((a) => !/cancel|finaliz|faltou/i.test(String(a?.status?.nome ?? "")) && String(a.dataHoraInicio).slice(0, 16) >= agoraSP)
        .map((a) => ({ id: a.id, unidade: "campo-belo", unidadeNome: un.nome, status: String(a?.status?.nome ?? ""),
          servico: a?.servico?.nome ?? "", profissional: a?.profissional?.nome ?? "", dataHoraInicio: a.dataHoraInicio }))
        .sort((a, b) => String(a.dataHoraInicio).localeCompare(String(b.dataHoraInicio)));
      return json({ agendamentos });
    }

    return json({ error: "acao_invalida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "erro_interno" }, 500);
  }
});
