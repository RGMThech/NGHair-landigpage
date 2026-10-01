// Agendamento próprio via API Trinks. Nunca devolve preços ao navegador.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const API = "https://api.trinks.com/v1";
const UNIDADES: Record<string, string> = { "campo-belo": "20181", brooklin: "281029" };
const datasCache = new Map<string, { expiraEm: number; datas: string[] }>();

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function trinks(path: string, estab: string, init: RequestInit = {}) {
  const key = Deno.env.get("TRINKS_API_KEY");
  if (!key) throw new Error("not_configured");
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    const r = await fetch(`${API}${path}`, {
      ...init,
      headers: { "X-Api-Key": key, estabelecimentoId: estab, "Content-Type": "application/json", ...(init.headers || {}) },
    });
    const t = await r.text();
    if (r.ok) return t ? JSON.parse(t) : {};
    if (r.status === 429 && tentativa < 2) {
      const espera = Math.min(Number(r.headers.get("retry-after") || 2), 10) * 1000;
      await new Promise((resolve) => setTimeout(resolve, espera));
      continue;
    }
    console.error("trinks", path, r.status, t.slice(0, 300));
    throw new Error(`trinks_${r.status}`);
  }
}
const list = (d: any) => (Array.isArray(d) ? d : d?.data ?? d?.items ?? []);
const clean = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);
const digits = (t: any) => {
  const value = `${t?.ddi ?? ""}${t?.ddd ?? ""}${t?.numero ?? t?.telefone ?? ""}`.replace(/\D/g, "");
  return value.startsWith("55") && value.length >= 12 ? value.slice(2) : value;
};
const formatPhone = (value: string) => {
  const raw = value.replace(/\D/g, "");
  const tel = raw.startsWith("55") && raw.length >= 12 ? raw.slice(2) : raw;
  const ddd = tel.slice(0, 2), numero = tel.slice(2);
  if (tel.length < 10) return "";
  return `(${ddd}) ${numero.length === 9 ? numero.slice(0, 5) + "-" + numero.slice(5) : numero.slice(0, 4) + "-" + numero.slice(4)}`;
};
const hasEmployeeCode = (name: string) => /\|\s*\d+\s*\|/.test(name);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        const sid = Number(body.servicoId);
        const [autorizados, todos] = await Promise.all([
          trinks(`/servicos/${sid}/profissionais`, estab),
          trinks("/profissionais", estab),
        ]);
        const ids = new Set(list(autorizados).map((p: any) => p.id));
        return json({ profissionais: list(todos)
          .filter((p: any) => ids.has(p.id))
          .map((p: any) => ({ id: p.id, nome: p.apelido || p.nome, funcao: p.funcao ?? "" })) });
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
      case "datasDisponiveis": {
        const inicio = clean(body.inicio, 10);
        const servicoId = Number(body.servicoId);
        const profissionalId = body.profissionalId ? Number(body.profissionalId) : null;
        const idsPermitidos = new Set(
          (Array.isArray(body.profissionalIds) ? body.profissionalIds : [])
            .map(Number)
            .filter((id: number) => Number.isInteger(id) && id > 0),
        );
        if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !servicoId) return json({ error: "dados_invalidos" }, 400);
        const cacheKey = `${estab}:${servicoId}:${profissionalId ?? [...idsPermitidos].sort((a, b) => a - b).join(",")}:${inicio}`;
        const cache = datasCache.get(cacheKey);
        if (cache && cache.expiraEm > Date.now()) return json({ datas: cache.datas });
        const [ano, mes, dia] = inicio.split("-").map(Number);
        const primeiraData = new Date(Date.UTC(ano, mes - 1, dia));
        if (Number.isNaN(primeiraData.getTime())) return json({ error: "data_invalida" }, 400);
        const agoraSp = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
        const hojeSp = `${agoraSp.getFullYear()}-${String(agoraSp.getMonth() + 1).padStart(2, "0")}-${String(agoraSp.getDate()).padStart(2, "0")}`;
        const limiteHoje = agoraSp.getHours() * 60 + agoraSp.getMinutes() - 5;
        const datas: string[] = [];
        for (let offset = 0; offset < 30; offset += 1) {
          const atual = new Date(primeiraData);
          atual.setUTCDate(primeiraData.getUTCDate() + offset);
          const data = atual.toISOString().slice(0, 10);
          const q = new URLSearchParams({ servicoId: String(servicoId) });
          if (profissionalId) q.set("profissionalId", String(profissionalId));
          const resposta = await trinks(`/agendamentos/profissionais/${data}?${q}`, estab);
          const disponivel = list(resposta).some((p: any) => {
            if (!profissionalId && idsPermitidos.size > 0 && !idsPermitidos.has(Number(p.id))) return false;
            return (p.horariosVagos ?? p.horarios ?? []).some((hora: unknown) => {
              if (data !== hojeSp) return true;
              const [h, m] = String(hora).slice(0, 5).split(":").map(Number);
              return h * 60 + m > limiteHoje;
            });
          });
          if (disponivel) datas.push(data);
        }
        datasCache.set(cacheKey, { expiraEm: Date.now() + 120_000, datas });
        return json({ datas });
      }
      case "buscarCliente": {
        const nome = clean(body.nome, 100), tel = clean(body.telefone, 20).replace(/\D/g, "");
        const email = clean(body.email, 150).toLowerCase();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (nome.length < 3 && tel.length < 8 && !emailOk) return json({ error: "dados_invalidos" }, 400);
        const q = new URLSearchParams({ pageSize: "20" });
        if (tel) q.set("telefone", tel);
        if (nome) q.set("nome", nome);
        if (emailOk) q.set("email", email);
        const found = list(await trinks(`/clientes?${q}`, estab));
        const mask = (t: any) => {
          const n = `${t?.ddd ?? ""}${t?.numero ?? t?.telefone ?? ""}`.replace(/\D/g, "");
          return n.length >= 4 ? `(••) •••••-${n.slice(-4)}` : "";
        };
        return json({ clientes: found.slice(0, 10).map((c: any) => ({
          id: c.id, nome: c.nome, telefone: mask((c.telefones ?? [])[0]),
        })) });
      }
      case "obterCliente": {
        const clienteId = Number(body.clienteId);
        if (!clienteId) return json({ error: "cliente_obrigatorio" }, 400);
        const [cliente, telefonesData] = await Promise.all([
          trinks(`/clientes/${clienteId}`, estab),
          trinks(`/clientes/${clienteId}/telefones`, estab),
        ]);
        const telefones = list(telefonesData);
        const telefone = telefones.map(digits).find((tel: string) => tel !== "11900000000") ?? "";
        const nome = clean(cliente?.nome, 100);
        return json({ cliente: { id: clienteId, nome, telefone: formatPhone(telefone), email: clean(cliente?.email, 150), nomeProtegido: hasEmployeeCode(nome) } });
      }
      case "atualizarCliente":
      case "atualizarTelefone": {
        const clienteId = Number(body.clienteId);
        const tel = clean(body.telefone, 20).replace(/\D/g, "");
        const nomeSolicitado = clean(body.nome, 100);
        const emailSolicitado = clean(body.email, 150).toLowerCase();
        if (emailSolicitado && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSolicitado)) return json({ error: "email_invalido" }, 400);
        if (!clienteId) return json({ error: "cliente_obrigatorio" }, 400);
        if (tel.length < 10 || tel.length > 11) return json({ error: "telefone_invalido" }, 400);
        const ddd = tel.slice(0, 2), numero = tel.slice(2);
        const clienteAtual = await trinks(`/clientes/${clienteId}`, estab);
        const nomeAtual = clean(clienteAtual?.nome, 100);
        const emailAtual = clean(clienteAtual?.email, 150).toLowerCase();
        const nomeFinal = hasEmployeeCode(nomeAtual) ? nomeAtual : nomeSolicitado || nomeAtual;
        const emailFinal = emailSolicitado || emailAtual;
        if (nomeFinal.length < 3) return json({ error: "nome_invalido" }, 400);
        let aviso: string | null = null;
        if ((!hasEmployeeCode(nomeAtual) && nomeFinal !== nomeAtual) || emailFinal !== emailAtual) {
          // PUT /clientes/{id} (EditClientRequest): nome, email, cpf, genero, observacoes, codigoExterno.
          // Campos omitidos são apagados pelo Trinks, então os demais são reenviados como estão.
          const c0 = clienteAtual ?? {};
          await trinks(`/clientes/${clienteId}`, estab, {
            method: "PUT",
            body: JSON.stringify({
              nome: nomeFinal, email: emailFinal || null, cpf: c0.cpf || null,
              genero: c0.genero ?? null, observacoes: c0.observacoes ?? null,
              codigoExterno: c0.codigoExterno ?? null,
            }),
          });
          const conf = await trinks(`/clientes/${clienteId}`, estab);
          const nomeOk = clean(conf?.nome, 100) === nomeFinal;
          const emailOk = !emailFinal || clean(conf?.email, 150).toLowerCase() === emailFinal;
          if (!nomeOk || !emailOk) {
            // O Trinks responde 204 mas não altera cadastros gerenciados pela própria cliente (conta Trinks).
            console.error("dados bloqueados pelo Trinks", clienteId, conf?.nome, conf?.email);
            aviso = "dados_bloqueados";
          }
        }
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
        return json({ ok: true, aviso, cliente: {
          id: clienteId, nome: c?.nome ?? "",
          telefone: formatPhone(tel), email: clean(c?.email, 150),
          nomeProtegido: hasEmployeeCode(clean(c?.nome, 100)),
        } });
      }
      case "criarCliente": {
        const nome = clean(body.nome, 100);
        const tel = clean(body.telefone, 20).replace(/\D/g, "");
        const email = clean(body.email, 150).toLowerCase();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email_invalido" }, 400);
        if (nome.length < 5 || !nome.includes(" ")) return json({ error: "nome_invalido" }, 400);
        if (tel.length < 10 || tel.length > 11) return json({ error: "telefone_invalido" }, 400);
        const ddd = tel.slice(0, 2), numero = tel.slice(2);
        // Evita duplicar: se o telefone já existe, devolve esse cadastro.
        const existentes = list(await trinks(`/clientes?telefone=${tel}&pageSize=5`, estab));
        if (existentes.length) return json({ error: "ja_existe" });
        if (email) {
          const porEmail = list(await trinks(`/clientes?email=${encodeURIComponent(email)}&pageSize=5`, estab));
          if (porEmail.length) return json({ error: "email_ja_existe" });
        }
        const novo = await trinks("/clientes", estab, { method: "POST", body: JSON.stringify({
          nome, email: email || undefined,
          telefones: [{ ddi: "55", ddd, numero, tipoId: numero.length === 9 ? 3 : 1 }],
        }) });
        // O POST pode criar o cliente e responder sem corpo/ID. Nesse caso, relocaliza
        // o registro recém-criado antes de informar falha, evitando cadastro duplicado.
        let id = Number(novo?.id ?? novo?.clienteId ?? novo?.data?.id ?? (typeof novo === "number" ? novo : 0));
        for (let tentativa = 0; !id && tentativa < 5; tentativa += 1) {
          await wait(tentativa === 0 ? 250 : 700);
          const porTelefone = list(await trinks(`/clientes?telefone=${tel}&pageSize=10`, estab));
          const localizado = porTelefone.find((c: any) => {
            const telefones = Array.isArray(c?.telefones) ? c.telefones : [];
            return telefones.length === 0 || telefones.some((t: any) => digits(t).endsWith(tel));
          });
          id = Number(localizado?.id);
          if (!id && email) {
            const porEmail = list(await trinks(`/clientes?email=${encodeURIComponent(email)}&pageSize=10`, estab));
            const peloEmail = porEmail.find((c: any) => clean(c?.email, 150).toLowerCase() === email && clean(c?.nome, 100).toLowerCase() === nome.toLowerCase());
            id = Number(peloEmail?.id);
          }
        }
        if (!id) return json({ error: "criacao_nao_confirmada" });
        const tels = list(await trinks(`/clientes/${id}/telefones`, estab));
        if (!tels.some((t: any) => digits(t).endsWith(tel))) {
          await trinks(`/clientes/${id}/telefones`, estab, { method: "POST", body: JSON.stringify({
            ddi: "55", ddd, numero, tipoId: numero.length === 9 ? 3 : 1,
          }) });
        }
        const [confirmado, telefonesConfirmados] = await Promise.all([
          trinks(`/clientes/${id}`, estab),
          trinks(`/clientes/${id}/telefones`, estab),
        ]);
        const telefoneConfirmado = list(telefonesConfirmados).map(digits).find((item: string) => item.endsWith(tel));
        if (!telefoneConfirmado) return json({ error: "telefone_nao_confirmado" });
        return json({ ok: true, cliente: {
          id,
          nome: clean(confirmado?.nome, 100) || nome,
          telefone: formatPhone(telefoneConfirmado),
          email: clean(confirmado?.email, 150) || email,
          nomeProtegido: hasEmployeeCode(clean(confirmado?.nome, 100)),
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
