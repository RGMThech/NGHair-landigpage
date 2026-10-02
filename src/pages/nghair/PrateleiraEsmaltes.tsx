import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Search, Loader2, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useNghairStaff } from "@/hooks/useNghairStaff";
import {
  Esmalte, esmaltesTable, fetchEsmaltes, fmtData, fmtValidade, hojeISO, MOTIVOS, situacaoValidade, UNIDADES,
} from "@/lib/esmaltes";

const POR_PAGINA = 50;

const SitBadge = ({ v }: { v: string | null }) => {
  const s = situacaoValidade(v);
  if (s === "vencido") return <Badge variant="destructive">Vencido</Badge>;
  if (s === "vencendo") return <Badge className="bg-accent text-accent-foreground hover:bg-accent">Vence em breve</Badge>;
  if (s === "ok") return <Badge variant="secondary">No prazo</Badge>;
  return <Badge variant="outline">Sem validade</Badge>;
};

const PrateleiraEsmaltes = () => {
  const { checking } = useNghairStaff();
  const [lista, setLista] = useState<Esmalte[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [unidade, setUnidade] = useState("todas");
  const [status, setStatus] = useState("Prateleira");
  const [validade, setValidade] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const [novo, setNovo] = useState(false);
  const [remover, setRemover] = useState<Esmalte | null>(null);

  const carregar = async () => {
    setLoading(true);
    try { setLista(await fetchEsmaltes()); }
    catch (e) { toast({ title: "Erro ao carregar", description: String((e as Error).message), variant: "destructive" }); }
    setLoading(false);
  };
  useEffect(() => { if (!checking) void carregar(); }, [checking]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return lista.filter((e) =>
      (unidade === "todas" || e.unidade === unidade) &&
      (status === "todos" || e.status === status) &&
      (validade === "todas" || situacaoValidade(e.validade) === validade) &&
      (!t || [e.etiqueta, e.marca, e.serie, e.cor].some((x) => String(x ?? "").toLowerCase().includes(t))));
  }, [lista, busca, unidade, status, validade]);
  useEffect(() => setPagina(1), [busca, unidade, status, validade]);

  const naPrateleira = lista.filter((e) => e.status === "Prateleira" && (unidade === "todas" || e.unidade === unidade));
  const cards = [
    { label: "Na prateleira", n: naPrateleira.length, f: () => { setStatus("Prateleira"); setValidade("todas"); } },
    { label: "Vencidos na prateleira", n: naPrateleira.filter((e) => situacaoValidade(e.validade) === "vencido").length, f: () => { setStatus("Prateleira"); setValidade("vencido"); }, destaque: true },
    { label: "Vencem em 60 dias", n: naPrateleira.filter((e) => situacaoValidade(e.validade) === "vencendo").length, f: () => { setStatus("Prateleira"); setValidade("vencendo"); } },
    { label: "Removidos", n: lista.filter((e) => e.status !== "Prateleira" && (unidade === "todas" || e.unidade === unidade)).length, f: () => { setStatus("Removido"); setValidade("todas"); } },
  ];
  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visiveis = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  if (checking) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" />Início</Link>
            <h1 className="font-display text-3xl text-foreground mt-1">Prateleira de Esmaltes</h1>
          </div>
          <Button onClick={() => setNovo(true)}><Plus className="h-4 w-4 mr-1" />Cadastrar esmalte</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((c) => (
            <button key={c.label} onClick={c.f} className={`rounded-xl border p-4 text-left transition hover:border-primary ${c.destaque ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}>
              <div className={`text-2xl font-semibold ${c.destaque ? "text-destructive" : "text-foreground"}`}>{c.n}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</div>
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar etiqueta, marca, série ou cor" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={unidade} onValueChange={setUnidade}>
            <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todas">Todas unidades</SelectItem>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="Prateleira">Prateleira</SelectItem>
              <SelectItem value="Removido">Removido</SelectItem>
              <SelectItem value="Desaparecido">Desaparecido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={validade} onValueChange={setValidade}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda validade</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
              <SelectItem value="vencendo">Vencem em 60 dias</SelectItem>
              <SelectItem value="ok">No prazo</SelectItem>
              <SelectItem value="sem">Sem validade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          {loading ? <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>{["Etiqueta", "Marca", "Série", "Cor", "Validade", "Situação", "Cadastro", "Status", "Unidade", ""].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {visiveis.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold">{e.etiqueta}</td>
                    <td className="px-3 py-2 capitalize">{e.marca}</td>
                    <td className="px-3 py-2 capitalize">{e.serie}</td>
                    <td className="px-3 py-2 capitalize">{e.cor}</td>
                    <td className="px-3 py-2">{fmtValidade(e.validade)}</td>
                    <td className="px-3 py-2"><SitBadge v={e.validade} /></td>
                    <td className="px-3 py-2">{fmtData(e.data_cadastro)}</td>
                    <td className="px-3 py-2">{e.status}{e.motivo ? <span className="block text-xs text-muted-foreground">{e.motivo} · {fmtData(e.data_removido)}</span> : null}</td>
                    <td className="px-3 py-2">{e.unidade}</td>
                    <td className="px-3 py-2 text-right">
                      {e.status === "Prateleira" && <Button size="sm" variant="ghost" onClick={() => setRemover(e)}><PackageX className="h-4 w-4 mr-1" />Remover</Button>}
                    </td>
                  </tr>
                ))}
                {!visiveis.length && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Nenhum esmalte encontrado.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtrados.length} esmaltes</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <span>{pagina} / {paginas}</span>
            <Button size="sm" variant="outline" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Próxima</Button>
          </div>
        </div>
      </div>

      <NovoEsmalte open={novo} onClose={() => setNovo(false)} proxima={Math.max(0, ...lista.map((e) => e.etiqueta ?? 0)) + 1} onSaved={carregar} />
      <RemoverEsmalte esmalte={remover} onClose={() => setRemover(null)} onSaved={carregar} />
    </div>
  );
};

const NovoEsmalte = ({ open, onClose, proxima, onSaved }: { open: boolean; onClose: () => void; proxima: number; onSaved: () => void }) => {
  const [f, setF] = useState({ etiqueta: "", marca: "", serie: "", cor: "", validade: "", unidade: "Campo Belo" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setF((p) => ({ ...p, etiqueta: String(proxima), marca: "", serie: "", cor: "", validade: "" })); }, [open, proxima]);
  const salvar = async () => {
    if (!f.marca.trim() || !f.cor.trim() || !f.validade) { toast({ title: "Preencha marca, cor e validade", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await esmaltesTable().insert({
      etiqueta: Number(f.etiqueta) || null, marca: f.marca.trim(), serie: f.serie.trim() || null, cor: f.cor.trim(),
      validade: `${f.validade}-01`, unidade: f.unidade, status: "Prateleira", data_cadastro: hojeISO(),
    });
    setSaving(false);
    if (error) { toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Esmalte cadastrado" }); onClose(); onSaved();
  };
  const campo = (k: keyof typeof f, label: string, type = "text") => (
    <div className="space-y-1"><Label>{label}</Label><Input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cadastrar esmalte</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {campo("etiqueta", "Etiqueta", "number")}
          <div className="space-y-1"><Label>Unidade</Label>
            <Select value={f.unidade} onValueChange={(v) => setF({ ...f, unidade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {campo("marca", "Marca")}
          {campo("serie", "Série")}
          {campo("cor", "Cor")}
          {campo("validade", "Validade (mês/ano)", "month")}
        </div>
        <p className="text-xs text-muted-foreground">Data de cadastro: hoje ({fmtData(hojeISO())}) · Status: Prateleira</p>
        <DialogFooter><Button onClick={salvar} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RemoverEsmalte = ({ esmalte, onClose, onSaved }: { esmalte: Esmalte | null; onClose: () => void; onSaved: () => void }) => {
  const [motivo, setMotivo] = useState("Vencido");
  const salvar = async () => {
    if (!esmalte) return;
    const { error } = await esmaltesTable().update({
      status: motivo === "Desaparecido" ? "Desaparecido" : "Removido", motivo, data_removido: hojeISO(),
    }).eq("id", esmalte.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Esmalte removido da prateleira" }); onClose(); onSaved();
  };
  return (
    <Dialog open={!!esmalte} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Remover da prateleira — etiqueta {esmalte?.etiqueta}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground capitalize">{esmalte?.marca} · {esmalte?.serie} · {esmalte?.cor}</p>
        <div className="space-y-1"><Label>Motivo</Label>
          <Select value={motivo} onValueChange={setMotivo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MOTIVOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DialogFooter><Button variant="destructive" onClick={salvar}>Confirmar remoção</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrateleiraEsmaltes;
