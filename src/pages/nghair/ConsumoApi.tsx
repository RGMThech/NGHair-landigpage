import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNghairStaff } from "@/hooks/useNghairStaff";

type Diario = { dia: string; api: string; total: number };
type Chamada = { id: string; api: string; endpoint: string | null; metodo: string | null; unidade: string | null; status: number | null; origem: string | null; created_at: string };
type ConsumoOficial = { cotaTotal: number; plano: string; saldoRestante: number; totalUtilizado: number };

const hojeSP = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const menosDias = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const fmtDia = (iso: string) => iso.split("-").reverse().join("/");
const fmtHora = (ts: string) => new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

const ConsumoApi = () => {
  const { checking } = useNghairStaff();
  const [fim, setFim] = useState(hojeSP());
  const [inicio, setInicio] = useState(menosDias(hojeSP(), 29));
  const [diario, setDiario] = useState<Diario[]>([]);
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(false);
  const [oficial, setOficial] = useState<ConsumoOficial | null>(null);

  const carregar = async () => {
    setLoading(true);
    const [r1, r2, r3] = await Promise.all([
      (supabase.rpc as any)("api_consumo_diario", { _inicio: inicio, _fim: fim }),
      (supabase.from as any)("api_call_log").select("*")
        .gte("created_at", `${inicio}T00:00:00-03:00`).lte("created_at", `${fim}T23:59:59-03:00`)
        .order("created_at", { ascending: false }).limit(500),
      supabase.functions.invoke("trinks-booking", { body: { action: "consumo", unidade: "campo-belo" } }),
    ]);
    setDiario((r1.data ?? []).map((d: any) => ({ ...d, total: Number(d.total) })));
    setChamadas(r2.data ?? []);
    setOficial(r3.data?.consumo ?? null);
    setLoading(false);
  };
  useEffect(() => { if (!checking) carregar(); }, [checking]); // eslint-disable-line react-hooks/exhaustive-deps

  const apis = useMemo(() => [...new Set(diario.map((d) => d.api))].sort(), [diario]);
  const porDia = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const d of diario) { const r = m.get(d.dia) ?? {}; r[d.api] = d.total; m.set(d.dia, r); }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [diario]);
  const totalApi = (api: string) => diario.filter((d) => d.api === api).reduce((s, d) => s + d.total, 0);
  const mesAtual = hojeSP().slice(0, 7);
  const totalMes = diario.filter((d) => d.dia.startsWith(mesAtual)).reduce((s, d) => s + d.total, 0);

  if (checking) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8 space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Voltar ao site</Link>
        <h1 className="font-display text-3xl text-foreground">Consumo de API</h1>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1"><Label>De</Label><Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
          <div className="space-y-1"><Label>Até</Label><Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></div>
          <Button onClick={carregar} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Atualizar</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {oficial && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <div className="text-xs uppercase text-muted-foreground">Consumo oficial Trinks ({oficial.plano})</div>
              <div className="text-2xl font-semibold text-foreground">{oficial.totalUtilizado.toLocaleString("pt-BR")} <span className="text-sm font-normal text-muted-foreground">de {oficial.cotaTotal.toLocaleString("pt-BR")}</span></div>
              <div className="text-xs text-muted-foreground">Saldo restante: {oficial.saldoRestante.toLocaleString("pt-BR")} chamadas</div>
            </div>
          )}
          <div className="rounded-lg border border-border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Nosso registro — total no período</div><div className="text-2xl font-semibold text-foreground">{diario.reduce((s, d) => s + d.total, 0)}</div></div>
          <div className="rounded-lg border border-border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Nosso registro — no mês atual</div><div className="text-2xl font-semibold text-foreground">{totalMes}</div></div>
          {apis.map((a) => (
            <div key={a} className="rounded-lg border border-border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">{a}</div><div className="text-2xl font-semibold text-foreground">{totalApi(a)}</div></div>
          ))}
        </div>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">Total por dia</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left"><tr><th className="p-2">Dia</th>{apis.map((a) => <th key={a} className="p-2 text-right">{a}</th>)}<th className="p-2 text-right">Total</th></tr></thead>
              <tbody>
                {porDia.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={apis.length + 2}>Nenhuma chamada no período.</td></tr>}
                {porDia.map(([dia, r]) => (
                  <tr key={dia} className="border-t border-border"><td className="p-2">{fmtDia(dia)}</td>{apis.map((a) => <td key={a} className="p-2 text-right">{r[a] ?? 0}</td>)}<td className="p-2 text-right font-semibold">{Object.values(r).reduce((s, v) => s + v, 0)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl text-foreground">Chamadas registradas <span className="text-sm text-muted-foreground">(últimas 500 do período)</span></h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left"><tr><th className="p-2">Data e hora</th><th className="p-2">API</th><th className="p-2">Chamada</th><th className="p-2">Unidade</th><th className="p-2">Origem</th><th className="p-2 text-right">Resultado</th></tr></thead>
              <tbody>
                {chamadas.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="p-2 whitespace-nowrap">{fmtHora(c.created_at)}</td><td className="p-2">{c.api}</td>
                    <td className="p-2 font-mono text-xs">{c.metodo} {c.endpoint}</td><td className="p-2">{c.unidade}</td><td className="p-2">{c.origem}</td>
                    <td className={`p-2 text-right ${c.status && c.status >= 400 ? "text-destructive" : ""}`}>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ConsumoApi;
