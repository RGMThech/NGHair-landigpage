// Agendamento próprio via API Trinks. Nunca devolve preços ao navegador.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const API = "https://api.trinks.com/v1";
const UNIDADES: Record<string, string> = { "campo-belo": "20181", brooklin: "281029" };

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function trinks(path: string, estab: string, init: RequestInit = {}) {
  const key = Deno.env.get("TRINKS_API_KEY");
  if (!key) throw new Error("not_configured");
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { "X-Api-Key": key, estabelecimentoId: estab, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const t = await r.text();
  if (!r.ok) { console.error("trinks", path, r.status, t.slice(0, 300)); throw new Error(`trinks_${r.status}`); }
  return t ? JSON.parse(t) : {};
}
const list = (d: any) => (Array.isArray(d) ? d : d?.data ?? d?.items ?? []);
const clean = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const estab = UNIDADES[body.unidade];
    if (!estab) return json({ error: "unidade_invalida" }, 400);

    switch (body.action) {
      case "servicos": {
        const d = await trinks("/servicos?somenteVisiveisCliente=true&pageSize=200", estab);
        return json({ servicos: list(d).map((s: any) => ({
          id: s.id, nome: s.nome, categoria: s.categoria?.nome ?? s.categoria ?? "Outros",
          descricao: s.descricao ?? "", duracao: s.duracaoEmMinutos ?? s.duracao ?? null,
        })) });
      }
      case "profissionais": {
        const d = await trinks(`/profissionais?servicoId=${Number(body.servicoId)}`, estab);
        return json({ profissionais: list(d).map((p: any) => ({ id: p.id, nome: p.apelido || p.nome, funcao: p.funcao ?? "" })) });
      }
      case "horarios": {
        const data = clean(body.data, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return json({ error: "data_invalida" }, 400);
        const q = new URLSearchParams({ servicoId: String(Number(body.servicoId)) });
        if (body.profissionalId) q.set("profissionalId", String(Number(body.profissionalId)));
        const d = await trinks(`/agendamentos/profissionais/${data}?${q}`, estab);
        const horarios: { profissionalId: number; nome: string; hora: string }[] = [];
        for (const p of list(d)) for (const h of p.horariosVagos ?? p.horarios ?? [])
          horarios.push({ profissionalId: p.id, nome: p.apelido || p.nome, hora: String(h).slice(0, 5) });
        return json({ horarios });
      }
      case "buscarCliente": {
        const nome = clean(body.nome, 100), tel = clean(body.telefone, 20).replace(/\D/g, "");
        if (nome.length < 3 && tel.length < 8) return json({ error: "dados_invalidos" }, 400);
        const q = new URLSearchParams({ pageSize: "20" });
        if (tel) q.set("telefone", tel);
        if (nome) q.set("nome", nome);
        const found = list(await trinks(`/clientes?${q}`, estab));
        const mask = (t: any) => {
          const n = `${t?.ddd ?? ""}${t?.numero ?? ""}`.replace(/\D/g, "");
          return n.length >= 4 ? `(••) •••••-${n.slice(-4)}` : "";
        };
        return json({ clientes: found.slice(0, 10).map((c: any) => ({
          id: c.id, nome: c.nome, telefone: mask((c.telefones ?? [])[0]),
        })) });
      }
      case "atualizarTelefone": {
        const clienteId = Number(body.clienteId);
        const tel = clean(body.telefone, 20).replace(/\D/g, "");
        if (!clienteId) return json({ error: "cliente_obrigatorio" }, 400);
        if (tel.length < 10 || tel.length > 11) return json({ error: "telefone_invalido" }, 400);
        const ddd = tel.slice(0, 2), numero = tel.slice(2);
        const digits = (t: any) => `${t?.ddd ?? ""}${t?.numero ?? ""}`.replace(/\D/g, "");
        // Telefone placeholder (11) 90000-0000: remover sempre que estiver no cadastro.
        const PLACEHOLDER = "11900000000";
        const removerPlaceholder = async (telefones: any[]) => {
          for (const t of telefones) {
            if (digits(t) === PLACEHOLDER)
              await trinks(`/clientes/${clienteId}/telefones/${t.id}`, estab, { method: "DELETE" });
          }
        };
        // PUT /clientes/{id} NÃO aceita telefones — usar a rota própria de telefones.
        const atuais = list(await trinks(`/clientes/${clienteId}/telefones`, estab));
        await removerPlaceholder(atuais);
        if (!atuais.some((t: any) => digits(t).endsWith(tel) || tel.endsWith(digits(t)) && digits(t).length >= 8)) {
          await trinks(`/clientes/${clienteId}/telefones`, estab, { method: "POST", body: JSON.stringify({
            ddi: "55", ddd, numero, tipoId: numero.length === 9 ? 3 : 1,
          }) });
        }
        // Relê do Trinks para confirmar que gravou
        const depois = list(await trinks(`/clientes/${clienteId}/telefones`, estab));
        const gravado = depois.some((t: any) => digits(t).endsWith(tel));
        if (!gravado) { console.error("telefone nao gravado", clienteId, JSON.stringify(depois).slice(0, 300)); return json({ error: "nao_gravado" }); }
        const c = await trinks(`/clientes/${clienteId}`, estab);
        return json({ ok: true, cliente: {
          id: clienteId, nome: c?.nome ?? "",
          telefone: `(${ddd}) ${numero.length === 9 ? numero.slice(0, 5) + "-" + numero.slice(5) : numero.slice(0, 4) + "-" + numero.slice(4)}`,
        } });
      }
      case "agendar": {
        const clienteId = Number(body.clienteId);
        if (!clienteId) return json({ error: "cliente_obrigatorio" }, 400);
        const ag = await trinks("/agendamentos", estab, { method: "POST", body: JSON.stringify({
          servicoId: Number(body.servicoId), clienteId, profissionalId: Number(body.profissionalId),
          dataHoraInicio: `${clean(body.data, 10)}T${clean(body.hora, 5)}:00`,
          duracaoEmMinutos: Number(body.duracao) || 60, confirmado: false,
        }) });
        return json({ ok: true, id: ag.id ?? null });
      }
      default: return json({ error: "acao_invalida" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message || "erro" }, 200);
  }
});
