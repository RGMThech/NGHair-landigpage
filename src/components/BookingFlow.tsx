import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Check, Clock, Loader2, Scissors, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reportConversion } from "@/lib/gtag";

type Servico = { id: number; nome: string; categoria: string; descricao: string; duracao: number | null };
type Prof = { id: number; nome: string };
type Horario = { profissionalId: number; nome: string; hora: string };

const call = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("trinks-booking", { body });
  if (error || data?.error) throw new Error(data?.error || error?.message);
  return data;
};

type Cliente = { id: number; nome: string; telefone: string };
const schema = z.object({
  nome: z.string().trim().max(100),
  telefone: z.string().trim().max(20),
}).refine((v) => v.nome.length >= 3 || v.telefone.replace(/\D/g, "").length >= 8, "Informe ao menos 3 letras do nome ou o telefone");

const nextDays = () =>
  Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d;
  }).filter((d) => d.getDay() !== 0 && d.getDay() !== 1);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const steps = ["Serviço", "Profissional", "Horário", "Seus dados"];

export default function BookingFlow({ unidade, nomeUnidade, fallbackUrl }: { unidade: string; nomeUnidade: string; fallbackUrl: string }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [indisponivel, setIndisponivel] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [servico, setServico] = useState<Servico | null>(null);
  const [prof, setProf] = useState<Prof | null>(null); // null = sem preferência
  const [data, setData] = useState<string>("");
  const [slot, setSlot] = useState<Horario | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "" });
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [telOk, setTelOk] = useState(false);
  const [novoTel, setNovoTel] = useState("");
  const [telAtualizado, setTelAtualizado] = useState(false);
  const [editTel, setEditTel] = useState(false);
  const [aberta, setAberta] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState(false);
  const dias = useMemo(nextDays, []);

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

  const escolherServico = (s: Servico) => {
    setServico(s); setStep(1);
    run(async () => setProfs((await call({ action: "profissionais", unidade, servicoId: s.id })).profissionais ?? []));
  };
  const escolherProf = (p: Prof | null) => { setProf(p); setStep(2); setData(""); setHorarios([]); };
  const escolherData = (d: string) => {
    setData(d); setSlot(null);
    run(async () => setHorarios((await call({ action: "horarios", unidade, servicoId: servico!.id, profissionalId: prof?.id, data: d })).horarios ?? []));
  };
  const buscar = async () => {
    const r = schema.safeParse(form);
    if (!r.success) return setErro(r.error.issues[0].message);
    setLoading(true); setErro(""); setCliente(null); setClientes(null); setTelOk(false); setEditTel(false); setNovoTel(""); setTelAtualizado(false);
    try {
      const d = await call({ action: "buscarCliente", unidade, nome: form.nome.trim(), telefone: form.telefone.trim() });
      const list: Cliente[] = d.clientes ?? [];
      setClientes(list);
      if (list.length === 1) setCliente(list[0]);
      if (!list.length) setErro("Não encontramos seu cadastro. Confira os dados ou fale conosco pelo WhatsApp.");
    } catch { setErro("Não conseguimos buscar seu cadastro agora. Tente novamente."); }
    finally { setLoading(false); }
  };
  const salvarTelefone = async () => {
    const tel = novoTel.replace(/\D/g, "");
    if (tel.length < 10 || tel.length > 11) return setErro("Informe o telefone com DDD (ex.: 11 99999-9999).");
    setLoading(true); setErro("");
    try {
      const d = await call({ action: "atualizarTelefone", unidade, clienteId: cliente!.id, telefone: tel });
      if (!d?.ok || !d.cliente) throw new Error(d?.error || "falha");
      setCliente(d.cliente); setTelAtualizado(true); setTelOk(true); setEditTel(false);
    } catch { setErro("Não conseguimos atualizar o telefone agora. Tente novamente."); }
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
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {dias.map((d) => (
              <button key={iso(d)} onClick={() => escolherData(iso(d))}
                className={`shrink-0 w-16 rounded-xl border py-3 text-center transition ${data === iso(d) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary"}`}>
                <p className="font-body text-[10px] uppercase tracking-widest">{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</p>
                <p className="font-display text-xl">{d.getDate()}</p>
              </button>
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
          <p className="font-body text-sm text-muted-foreground">Informe seu nome (pode ser parcial) ou seu telefone para localizarmos seu cadastro.</p>
          {(["nome", "telefone"] as const).map((k) => (
            <input key={k} value={form[k]} onChange={(e) => { setForm({ ...form, [k]: e.target.value }); setClientes(null); setCliente(null); }}
              placeholder={{ nome: "Nome", telefone: "Telefone com DDD" }[k]}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 font-body text-sm outline-none focus:border-primary" />
          ))}
          {!clientes?.length && (
            <button onClick={buscar} disabled={loading}
              className="w-full rounded-full border border-primary px-8 py-3 font-body text-xs font-semibold uppercase tracking-wider text-primary disabled:opacity-60">
              {loading ? "Buscando..." : "Localizar meu cadastro"}
            </button>
          )}
          {!!clientes?.length && (
            <div className="space-y-2">
              <p className="font-body text-xs uppercase tracking-widest text-muted-foreground">Confirme que é você</p>
              {clientes.map((c) => (
                <button key={c.id} onClick={() => { setCliente(c); setTelOk(false); setEditTel(false); setNovoTel(""); setTelAtualizado(false); }}
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
              <p className="font-body text-sm text-foreground">
                Seu telefone cadastrado é <strong>{cliente.telefone || "não informado"}</strong>. Ele está correto?
              </p>
              {!editTel && (
                <div className="flex gap-2">
                  <button onClick={() => setTelOk(true)}
                    className="flex-1 rounded-full bg-primary px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                    Sim, está correto
                  </button>
                  <button onClick={() => setEditTel(true)}
                    className="flex-1 rounded-full border border-primary px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wider text-primary">
                    Atualizar
                  </button>
                </div>
              )}
              {editTel && (
                <div className="space-y-2">
                  <input value={novoTel} onChange={(e) => setNovoTel(e.target.value)}
                    placeholder="Novo telefone com DDD" inputMode="tel"
                    className="w-full rounded-xl border border-input bg-card px-4 py-3 font-body text-sm outline-none focus:border-primary" />
                  <div className="flex gap-2">
                    <button onClick={salvarTelefone} disabled={loading}
                      className="flex-1 rounded-full bg-primary px-4 py-2.5 font-body text-xs font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-60">
                      {loading ? "Salvando..." : "Salvar telefone"}
                    </button>
                    <button onClick={() => setEditTel(false)} className="font-body text-xs text-muted-foreground underline">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {cliente && telOk && (
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-1">
              <p className="font-body text-sm text-foreground flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> {telAtualizado ? "Cadastro atualizado no salão:" : "Telefone confirmado:"}
              </p>
              <p className="font-body text-sm text-foreground"><strong>{cliente.nome}</strong></p>
              <p className="font-body text-sm text-muted-foreground">{cliente.telefone || "—"}</p>
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
