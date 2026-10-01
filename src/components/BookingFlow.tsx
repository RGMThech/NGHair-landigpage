import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, Clock, Loader2, Scissors, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reportConversion } from "@/lib/gtag";

type Servico = { id: number; nome: string; categoria: string; descricao: string; duracao: number | null };
type Prof = { id: number; nome: string; funcao?: string };
type Horario = { profissionalId: number; nome: string; hora: string };

const call = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("trinks-booking", { body });
  if (error || data?.error) throw new Error(data?.error || error?.message);
  return data;
};

type Cliente = { id: number; nome: string; telefone: string; email?: string; nomeProtegido?: boolean };
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const schema = z.object({
  nome: z.string().trim().max(100),
  telefone: z.string().trim().max(20),
  email: z.string().trim().max(150),
}).refine((v) => v.nome.length >= 3 || v.telefone.replace(/\D/g, "").length >= 8 || emailOk(v.email), "Informe ao menos 3 letras do nome, o telefone ou o e-mail");

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hojeEmSaoPaulo = () => {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo: string) => Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);
  return new Date(valor("year"), valor("month") - 1, valor("day"));
};

const steps = ["Serviço", "Profissional", "Horário", "Seus dados"];

export default function BookingFlow({ unidade, nomeUnidade, fallbackUrl }: { unidade: string; nomeUnidade: string; fallbackUrl: string }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [indisponivel, setIndisponivel] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState<Set<string>>(new Set());
  const [loadingDatas, setLoadingDatas] = useState(false);
  const [servico, setServico] = useState<Servico | null>(null);
  const [prof, setProf] = useState<Prof | null>(null); // null = sem preferência
  const [data, setData] = useState<string>("");
  const [slot, setSlot] = useState<Horario | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [telOk, setTelOk] = useState(false);
  const [telAtualizado, setTelAtualizado] = useState(false);
  const hoje = useMemo(hojeEmSaoPaulo, []);
  const limiteAgendamento = useMemo(() => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + 29);
    return d;
  }, [hoje]);
  const mesesExibidos = useMemo(() => [0, 1].map((offset) => {
    const mes = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
    const inicio = new Date(mes);
    inicio.setDate(1 - mes.getDay());
    const semanas = Array.from({ length: 6 }, (_, semana) =>
      Array.from({ length: 7 }, (_, dia) => {
        const d = new Date(inicio);
        d.setDate(inicio.getDate() + semana * 7 + dia);
        return d;
      })
    );
    return {
      mes,
      semanas,
      label: mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }), [hoje]);
  const diaHabil = (d: Date) => d >= hoje && d <= limiteAgendamento && datasDisponiveis.has(iso(d));
  const [aberta, setAberta] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState(false);

  const run = async <T,>(fn: () => Promise<T>) => {
    setLoading(true); setErro("");
    try { return await fn(); }
    catch { setIndisponivel(true); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setStep(0); setServico(null); setProf(null); setSlot(null); setFeito(false); setIndisponivel(false); setAberta(null);
    run(async () => setServicos((await call({ action: "servicos", unidade })).servicos ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidade]);

  useEffect(() => {
    if (step !== 2 || !servico) return;
    let ativo = true;
    setLoadingDatas(true);
    setDatasDisponiveis(new Set());
    call({
      action: "datasDisponiveis",
      unidade,
      servicoId: servico.id,
      profissionalId: prof?.id,
      profissionalIds: prof ? [prof.id] : profs.map((p) => p.id),
      inicio: iso(hoje),
    }).then((resposta) => {
      if (ativo) setDatasDisponiveis(new Set(resposta.datas ?? []));
    }).catch(() => {
      if (ativo) setErro("Não conseguimos consultar os dias disponíveis agora. Tente novamente.");
    }).finally(() => {
      if (ativo) setLoadingDatas(false);
    });
    return () => { ativo = false; };
  }, [step, servico, prof, profs, unidade, hoje]);

  const escolherServico = (s: Servico) => {
    setServico(s); setStep(1);
    run(async () => {
      const bruto: Prof[] = (await call({ action: "profissionais", unidade, servicoId: s.id })).profissionais ?? [];
      const executores = bruto.filter((p) => /manicure|cabeleireir/i.test(p.funcao ?? ""));
      const casa = (f: string, c: string) => {
        const fu = f.toLowerCase(), ca = c.toLowerCase();
        if (/manicure|unha|podolog/.test(ca)) return /manicure/.test(fu);
        if (/cabel/.test(ca)) return /cabeleireiro/.test(fu);
        return true;
      };
      setProfs(executores.sort((a, b) => Number(casa(b.funcao ?? "", s.categoria)) - Number(casa(a.funcao ?? "", s.categoria))));
    });
  };
  const escolherProf = (p: Prof | null) => { setProf(p); setStep(2); setData(""); setSlot(null); setHorarios([]); };
  const escolherData = (d: string) => {
    setData(d); setSlot(null);
    run(async () => {
      const hs = (await call({ action: "horarios", unidade, servicoId: servico!.id, profissionalId: prof?.id, data: d })).horarios ?? [];
      // "Sem preferência": só horários de profissionais aptos (manicure/cabeleireiro)
      let lista = prof ? hs : hs.filter((h) => profs.some((p) => p.id === h.profissionalId));
      // No dia de hoje, esconde horários que já passaram (tolerância de 5 min dentro do slot atual)
      if (d === iso(hoje)) {
        const agora = new Date();
        const limite = agora.getHours() * 60 + agora.getMinutes() - 5;
        lista = lista.filter((h) => {
          const [hh, mm] = h.hora.split(":").map(Number);
          return hh * 60 + mm > limite;
        });
      }
      setHorarios(lista);
    });
  };
  const buscar = async () => {
    const r = schema.safeParse(form);
    if (!r.success) return setErro(r.error.issues[0].message);
    setLoading(true); setErro(""); setCliente(null); setClientes(null); setTelOk(false); setTelAtualizado(false);
    try {
      const d = await call({ action: "buscarCliente", unidade, nome: form.nome.trim(), telefone: form.telefone.trim(), email: form.email.trim() });
      const list: Cliente[] = d.clientes ?? [];
      setClientes(list);
      if (list.length === 1) setCliente(list[0]);
      if (!list.length) { setNaoEncontrado(true); setErro("Não encontramos seu cadastro. Confira os dados ou crie seu cadastro abaixo."); }
      else setNaoEncontrado(false);
    } catch { setErro("Não conseguimos buscar seu cadastro agora. Tente novamente."); }
    finally { setLoading(false); }
  };
  const selecionarCliente = async (resultado: Cliente) => {
    setLoading(true); setErro(""); setTelOk(false); setTelAtualizado(false);
    try {
      const d = await call({ action: "obterCliente", unidade, clienteId: resultado.id });
      if (!d?.cliente) throw new Error("cadastro_nao_encontrado");
      const completo: Cliente = d.cliente;
      setCliente(completo);
      setForm({ nome: completo.nome, telefone: completo.telefone || "", email: completo.email || "" });
    } catch { setErro("Não conseguimos carregar os dados deste cadastro. Tente novamente."); }
    finally { setLoading(false); }
  };
  const criarCadastro = async () => {
    const tel = form.telefone.replace(/\D/g, "");
    const nome = form.nome.trim().replace(/\s+/g, " ");
    const email = form.email.trim();
    if (nome.length < 5 || !nome.includes(" ")) return setErro("Para criar o cadastro, informe nome e sobrenome.");
    if (tel.length < 10 || tel.length > 11) return setErro("Informe o telefone com DDD (ex.: 11 99999-9999).");
    if (email && !emailOk(email)) return setErro("Informe um e-mail válido ou deixe em branco.");
    setLoading(true); setErro("");
    try {
      const d = await call({ action: "criarCliente", unidade, nome, telefone: tel, email });
      if (d?.error === "ja_existe") { setNaoEncontrado(false); return setErro("Já existe um cadastro com este telefone. Busque apenas pelo telefone."); }
      if (d?.error === "email_ja_existe") { setNaoEncontrado(false); return setErro("Já existe um cadastro com este e-mail. Busque apenas pelo e-mail."); }
      if (!d?.ok || !d.cliente) throw new Error(d?.error || "falha");
      setCliente(d.cliente); setClientes([d.cliente]); setNaoEncontrado(false);
      setTelOk(true); setTelAtualizado(true);
      setForm({ nome: d.cliente.nome, telefone: d.cliente.telefone, email: d.cliente.email || email });
    } catch { setErro("Não conseguimos criar seu cadastro agora. Tente novamente."); }
    finally { setLoading(false); }
  };
  const salvarCadastro = async () => {
    const tel = form.telefone.replace(/\D/g, "");
    const nome = form.nome.trim();
    const email = form.email.trim();
    if (nome.length < 3) return setErro("Informe o nome completo ou com pelo menos 3 caracteres.");
    if (tel.length < 10 || tel.length > 11) return setErro("Informe o telefone com DDD (ex.: 11 99999-9999).");
    if (email && !emailOk(email)) return setErro("Informe um e-mail válido ou deixe em branco.");
    setLoading(true); setErro("");
    try {
      const d = await call({ action: "atualizarCliente", unidade, clienteId: cliente?.id, nome, telefone: tel, email });
      if (!d?.ok || !d.cliente) throw new Error(d?.error || "falha");
      setCliente(d.cliente); setTelAtualizado(true); setTelOk(true);
      setForm({ nome: d.cliente.nome, telefone: d.cliente.telefone || form.telefone, email: d.cliente.email || "" });
      if (d.aviso === "dados_bloqueados") setErro("Telefone salvo. O nome/e-mail deste cadastro só pode ser alterado pela própria cliente no app Trinks — mantivemos os dados atuais e você já pode confirmar o agendamento.");
    } catch (e) {
      const m = (e as Error).message;
      setErro(m === "nome_nao_gravado" ? "O salão não aceitou a alteração do nome. Tente novamente." : m === "email_nao_gravado" ? "O e-mail não foi gravado no salão. Tente novamente." : m === "nao_gravado" ? "O telefone não foi gravado no salão. Tente novamente." : "Não conseguimos atualizar o cadastro agora. Tente novamente.");
    }
    finally { setLoading(false); }
  };
  const confirmar = async () => {
    if (!cliente) return setErro("Selecione seu cadastro para continuar.");
    if (!telOk) return setErro("Confirme ou atualize seu telefone para continuar.");
    setLoading(true); setErro("");
    try {
      await call({ action: "agendar", unidade, clienteId: cliente.id, servicoId: servico!.id, profissionalId: slot!.profissionalId, data, hora: slot!.hora, duracao: servico!.duracao });
      reportConversion(); setFeito(true);
    } catch { setErro("Não conseguimos confirmar agora. Tente outro horário ou agende pelo link abaixo."); }
    finally { setLoading(false); }
  };

  const card = "text-left bg-card border border-border rounded-2xl p-5 transition-all hover:border-primary hover:-translate-y-0.5";

  if (indisponivel)
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <p className="font-display text-2xl text-foreground mb-2">Agendamento online em preparação</p>
        <p className="font-body text-muted-foreground mb-6">A agenda da unidade {nomeUnidade} ainda não está conectada. Enquanto isso, agende pelo Trinks.</p>
        <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" onClick={reportConversion}
          className="inline-block rounded-full bg-primary px-8 py-3 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground">
          Agendar pelo Trinks
        </a>
      </div>
    );

  if (feito)
    return (
      <div className="bg-card border border-primary/40 rounded-2xl p-10 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center"><Check className="h-7 w-7 text-primary" /></div>
        <p className="font-display text-3xl text-foreground mb-2">Agendamento solicitado!</p>
        <p className="font-body text-muted-foreground">{servico?.nome} com {slot?.nome}<br />
          {new Date(data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {slot?.hora} · NGHair {nomeUnidade}</p>
      </div>
    );

  const grupos = servicos.reduce<Record<string, Servico[]>>((a, s) => ((a[s.categoria] ||= []).push(s), a), {});

  return (
    <div className="bg-background">
      <div className="flex items-center gap-2 mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <span className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-body ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
            <span className={`font-body text-xs uppercase tracking-widest ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <span className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step > 0 && (
        <button onClick={() => setStep(step - 1)} className="mb-4 inline-flex items-center gap-1 font-body text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Voltar
        </button>
      )}
      {loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

      {!loading && step === 0 && Object.entries(grupos).map(([cat, list]) => (
        <div key={cat} className="mb-3">
          <button onClick={() => setAberta(aberta === cat ? null : cat)}
            className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 hover:border-primary">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-accent">{cat}</span>
            <span className="font-body text-xs text-muted-foreground">{list.length} · {aberta === cat ? "−" : "+"}</span>
          </button>
          {aberta === cat && <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {list.map((s) => (
              <button key={s.id} onClick={() => escolherServico(s)} className={card}>
                <div className="flex items-start gap-3">
                  <Scissors className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="font-display text-lg text-foreground">{s.nome}</p>
                    {s.duracao && <p className="font-body text-xs text-muted-foreground inline-flex items-center gap-1 mt-1"><Clock className="h-3 w-3" />{s.duracao} min</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>}
        </div>
      ))}

      {!loading && step === 1 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          <button onClick={() => escolherProf(null)} className={`${card} border-primary/40`}>
            <p className="font-display text-lg text-foreground">Sem preferência</p>
            <p className="font-body text-xs text-muted-foreground">Primeiro horário disponível</p>
          </button>
          {profs.map((p) => (
            <button key={p.id} onClick={() => escolherProf(p)} className={card}>
              <div className="flex items-center gap-3"><User className="h-4 w-4 text-primary" /><p className="font-display text-lg text-foreground">{p.nome}</p></div>
              {p.funcao && <p className="font-body text-[11px] text-muted-foreground mt-1 ml-7">{p.funcao}</p>}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="mb-4 text-center font-body text-sm text-muted-foreground">
            {loadingDatas ? "Consultando a agenda do profissional..." : "Escolha uma data disponível nos próximos 30 dias."}
          </p>
          <div className="mx-auto mb-6 grid max-w-3xl gap-6 md:grid-cols-2">
            {mesesExibidos.map(({ mes, semanas, label }) => (
              <div key={iso(mes)} className="min-w-0">
                <p className="mb-3 text-center font-display text-lg capitalize text-foreground">{label}</p>
                <div className="mb-1 grid grid-cols-7 gap-1">
                  {["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map((l) => (
                    <span key={l} className="py-1 text-center font-body text-[10px] uppercase tracking-widest text-muted-foreground">{l}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {semanas.flat().map((d) => {
                    const fora = d.getMonth() !== mes.getMonth();
                    const habil = !loadingDatas && !fora && diaHabil(d);
                    const sel = data === iso(d);
                    return (
                      <button key={iso(d)} disabled={!habil} onClick={() => escolherData(iso(d))}
                        aria-label={d.toLocaleDateString("pt-BR")}
                        className={`h-10 rounded-lg font-body text-sm transition ${sel ? "bg-primary text-primary-foreground" : habil ? "border border-border bg-card hover:border-primary hover:text-primary" : "text-muted-foreground/40"}`}>
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {!loading && data && (horarios.length === 0
            ? <p className="font-body text-sm text-muted-foreground text-center py-6">Sem horários livres neste dia. Escolha outra data.</p>
            : <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {horarios.map((h) => (
                  <button key={h.profissionalId + h.hora} onClick={() => { setSlot(h); setStep(3); }}
                    className="rounded-lg border border-border bg-card py-2 font-body text-sm hover:border-primary hover:text-primary">
                    {h.hora}{!prof && <span className="block text-[10px] text-muted-foreground">{h.nome}</span>}
                  </button>
                ))}
              </div>)}
        </div>
      )}

      {step === 3 && slot && (
        <div className="max-w-md space-y-4">
          <div className="rounded-xl bg-muted/50 p-4 font-body text-sm text-foreground">
            <strong>{servico?.nome}</strong> com {slot.nome}<br />
            {new Date(data + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} às {slot.hora}
          </div>
          <p className="font-body text-sm text-muted-foreground">Informe seu nome (pode ser parcial), seu telefone ou seu e-mail para localizarmos seu cadastro.</p>
          {(["nome", "telefone", "email"] as const).map((k) => (
            <label key={k} className="block space-y-1">
              {cliente && <span className="font-body text-xs text-muted-foreground">{{ nome: "Nome", telefone: "Telefone", email: "E-mail" }[k]}</span>}
              <input value={form[k]} onChange={(e) => {
                setForm({ ...form, [k]: e.target.value });
                if (cliente) { setTelOk(false); setTelAtualizado(false); }
                else { setClientes(null); }
              }}
                disabled={k === "nome" && cliente?.nomeProtegido}
                placeholder={{ nome: "Nome", telefone: "Telefone com DDD", email: "E-mail (opcional)" }[k]}
                inputMode={k === "telefone" ? "tel" : k === "email" ? "email" : undefined}
                autoComplete={k === "telefone" ? "tel" : k === "email" ? "email" : "name"}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 font-body text-sm outline-none focus:border-primary disabled:opacity-70" />
            </label>
          ))}
          {cliente?.nomeProtegido && <p className="font-body text-xs text-muted-foreground">Este nome contém seu código de colaborador e será mantido.</p>}
          {!clientes?.length && (
            <button onClick={buscar} disabled={loading}
              className="w-full rounded-full border border-primary px-8 py-3 font-body text-xs font-semibold uppercase tracking-wider text-primary disabled:opacity-60">
              {loading ? "Buscando..." : "Localizar meu cadastro"}
            </button>
          )}
          {naoEncontrado && !cliente && (
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
              <p className="font-body text-sm text-foreground">Primeira vez no salão? Preencha acima seu nome completo, telefone com DDD e, se quiser, seu e-mail. Depois crie seu cadastro.</p>
              <button onClick={criarCadastro} disabled={loading}
                className="w-full rounded-full bg-primary px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-60">
                {loading ? "Criando..." : "Criar meu cadastro"}
              </button>
            </div>
          )}
          {!!clientes?.length && (
            <div className="space-y-2">
              <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">Confirme que é você</p>
              {clientes.map((c) => (
                <button key={c.id} onClick={() => selecionarCliente(c)}
                  className={`w-full text-left rounded-xl border px-4 py-3 font-body text-sm transition ${cliente?.id === c.id ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"}`}>
                  <span className="flex items-center gap-2">{cliente?.id === c.id && <Check className="h-4 w-4 text-primary" />}<strong>{c.nome}</strong></span>
                  {c.telefone && <span className="block text-xs text-muted-foreground">{c.telefone}</span>}
                </button>
              ))}
              <button onClick={() => { setClientes(null); setCliente(null); setTelOk(false); }} className="font-body text-xs text-muted-foreground underline">Não sou eu, buscar novamente</button>
            </div>
          )}
          {cliente && !telOk && (
            <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
              <p className="font-body text-sm text-foreground">Confira o nome, o telefone e o e-mail preenchidos acima. Você pode corrigi-los antes de continuar.</p>
              <button onClick={salvarCadastro} disabled={loading}
                className="w-full rounded-full bg-accent px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wider text-accent-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60">
                {loading ? "Salvando..." : "Confirmar e salvar dados"}
              </button>
            </div>
          )}
          {cliente && telOk && (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-1">
              <p className="font-body text-sm text-foreground flex items-center gap-2">
                 <Check className="h-4 w-4 text-primary" /> {telAtualizado ? "Cadastro atualizado no salão:" : "Dados confirmados:"}
              </p>
              <p className="font-body text-sm text-foreground"><strong>{cliente.nome}</strong></p>
              <p className="font-body text-sm text-muted-foreground">{cliente.telefone || "—"}{cliente.email ? ` · ${cliente.email}` : ""}</p>
            </div>
          )}
          {erro && <p className="font-body text-sm text-destructive">{erro}</p>}
          {cliente && telOk && (
            <button onClick={confirmar} disabled={loading}
              className="w-full rounded-full bg-primary px-8 py-3 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-60">
              {loading ? "Confirmando..." : "Confirmar agendamento"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
