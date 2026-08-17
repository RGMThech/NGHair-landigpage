import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useEurofarmaAuth } from "@/hooks/useEurofarmaAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = {
  month_ref: string;
  data: string | null;
  profissional: string | null;
  servico: string | null;
  cliente: string | null;
  re: string;
  valor: number | null;
  rubrica: string | null;
};

type AccessRow = { id: string; re: string; note: string | null };

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun",
  "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

const monthLabel = (m: string) => {
  const [y, mm] = m.split("-");
  return `${MONTH_LABELS[mm] ?? mm}/${(y ?? "").slice(2)}`;
};

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const normalizeRe = (re: string | null) =>
  (re ?? "").trim().replace(/^0+/, "") || "0";

const colaboradorValue = (r: Row) => {
  const valor = Number(r.valor) || 0;
  const rubrica = (r.rubrica ?? "").trim().replace(/^0+/, "");
  return rubrica === "105" ? valor * 0.5 : valor;
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--secondary-foreground))",
];

const EurofarmaDashboard = () => {
  const { userId, checking } = useEurofarmaAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [access, setAccess] = useState<AccessRow[]>([]);
  const [newRe, setNewRe] = useState("");
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"todos" | "mes" | "periodo">("todos");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadAccess = async () => {
    const { data } = await supabase
      .from("eurofarma_dashboard_access")
      .select("id, re, note")
      .order("created_at", { ascending: true });
    setAccess((data ?? []) as AccessRow[]);
  };

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: can } = await supabase.rpc("can_access_eurofarma_dashboard", {
        _user_id: userId,
      });
      if (!can) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      setAllowed(true);
      const { data } = await supabase.rpc("eurofarma_dashboard_entries");
      setRows((data ?? []) as Row[]);
      await loadAccess();
      setLoading(false);
    })();
  }, [userId]);

  const availableMonths = useMemo(
    () => Array.from(new Set(rows.map((r) => r.month_ref))).sort().reverse(),
    [rows],
  );

  const filteredRows = useMemo(() => {
    if (filterMode === "mes") {
      return filterMonth ? rows.filter((r) => r.month_ref === filterMonth) : rows;
    }
    if (filterMode === "periodo") {
      if (!dateFrom && !dateTo) return rows;
      return rows.filter((r) => {
        if (!r.data) return false;
        if (dateFrom && r.data < dateFrom) return false;
        if (dateTo && r.data > dateTo) return false;
        return true;
      });
    }
    return rows;
  }, [rows, filterMode, filterMonth, dateFrom, dateTo]);

  const nameByRe = useMemo(() => {
    const counts = new Map<string, Map<string, number>>();
    rows.forEach((r) => {
      const nome = (r.cliente ?? "").trim();
      if (!nome) return;
      const key = normalizeRe(r.re);
      const inner = counts.get(key) ?? new Map<string, number>();
      inner.set(nome, (inner.get(nome) ?? 0) + 1);
      counts.set(key, inner);
    });
    const out = new Map<string, string>();
    counts.forEach((inner, key) => {
      const best = Array.from(inner.entries()).sort((a, b) => b[1] - a[1])[0];
      if (best) out.set(key, best[0]);
    });
    return out;
  }, [rows]);

  const totals = useMemo(() => {
    const total = filteredRows.reduce((a, r) => a + (Number(r.valor) || 0), 0);
    const colab = filteredRows.reduce((a, r) => a + colaboradorValue(r), 0);
    const res = new Set(filteredRows.map((r) => normalizeRe(r.re)));
    return {
      total,
      colab,
      empresa: total - colab,
      atendimentos: filteredRows.length,
      colaboradoras: res.size,
      ticket: filteredRows.length ? total / filteredRows.length : 0,
    };
  }, [filteredRows]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { mes: string; total: number; colaborador: number }>();
    filteredRows.forEach((r) => {
      const cur = map.get(r.month_ref) ?? {
        mes: monthLabel(r.month_ref),
        total: 0,
        colaborador: 0,
      };
      cur.total += Number(r.valor) || 0;
      cur.colaborador += colaboradorValue(r);
      map.set(r.month_ref, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => v);
  }, [filteredRows]);

  const topList = (key: "servico" | "profissional" | "re") =>
    Object.entries(
      filteredRows.reduce<Record<string, { total: number; qtd: number }>>((acc, r) => {
        const k = (r[key] ?? "").toString().trim() || "Não informado";
        acc[k] = acc[k] ?? { total: 0, qtd: 0 };
        acc[k].total += Number(r.valor) || 0;
        acc[k].qtd += 1;
        return acc;
      }, {}),
    )
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total);

  const byServico = useMemo(() => topList("servico"), [filteredRows]);
  const byProfissional = useMemo(() => topList("profissional"), [filteredRows]);
  const byRe = useMemo(() => topList("re"), [filteredRows]);

  const addAccess = async () => {
    const re = newRe.trim();
    if (!re) return;
    setSaving(true);
    const { error } = await supabase
      .from("eurofarma_dashboard_access")
      .insert({ re, note: newNote.trim() || null, created_by: userId });
    setSaving(false);
    if (error) {
      toast({
        title: "Não foi possível cadastrar",
        description: error.message.includes("duplicate")
          ? "Este RE já tem acesso ao dashboard."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    setNewRe("");
    setNewNote("");
    toast({ title: "Acesso liberado", description: `RE ${re} agora acessa o dashboard.` });
    await loadAccess();
  };

  const removeAccess = async (id: string) => {
    const { error } = await supabase
      .from("eurofarma_dashboard_access")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    await loadAccess();
  };

  if (checking || !userId) return null;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-6xl flex items-center justify-between py-6">
          <Link
            to="/empresas/eurofarma/portal"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao portal
          </Link>
        </div>
      </header>

      <section className="container max-w-6xl py-12">
        <h1 className="font-display text-4xl text-foreground mb-2">
          Dashboard Eurofarma
        </h1>
        <p className="text-muted-foreground mb-10">
          Visão consolidada dos serviços utilizados pelas colaboradoras.
        </p>

        {loading ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : allowed === false ? (
          <div className="border border-border rounded-2xl bg-card p-8">
            <ShieldCheck className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Acesso restrito</h2>
            <p className="text-sm text-muted-foreground">
              O seu RE não tem permissão para visualizar este dashboard.
            </p>
          </div>
        ) : (
          <>
            <div className="border border-border rounded-2xl bg-card p-6 mb-8">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Filtrar por
                  </p>
                  <div className="flex gap-2">
                    {([
                      { id: "todos", label: "Tudo" },
                      { id: "mes", label: "Mês" },
                      { id: "periodo", label: "Período" },
                    ] as const).map((o) => (
                      <Button
                        key={o.id}
                        size="sm"
                        variant={filterMode === o.id ? "default" : "outline"}
                        onClick={() => setFilterMode(o.id)}
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {filterMode === "mes" && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Mês
                    </p>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos os meses" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map((m) => (
                          <SelectItem key={m} value={m}>
                            {monthLabel(m)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterMode === "periodo" && (
                  <>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        De
                      </p>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-[170px]"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        Até
                      </p>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-[170px]"
                      />
                    </div>
                  </>
                )}

                {filterMode !== "todos" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterMode("todos");
                      setFilterMonth("");
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    Limpar filtro
                  </Button>
                )}

                <p className="text-sm text-muted-foreground ml-auto">
                  {filteredRows.length} de {rows.length} lançamentos
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {[
                { label: "Valor total dos serviços", value: brl(totals.total) },
                { label: "Parte das colaboradoras", value: brl(totals.colab) },
                { label: "Subsídio (empresa)", value: brl(totals.empresa) },
                { label: "Atendimentos", value: String(totals.atendimentos) },
                { label: "Colaboradoras atendidas", value: String(totals.colaboradoras) },
                { label: "Ticket médio", value: brl(totals.ticket) },
              ].map((c) => (
                <div key={c.label} className="border border-border rounded-2xl bg-card p-6">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    {c.label}
                  </p>
                  <p className="font-display text-3xl text-foreground">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-12">
              <div className="border border-border rounded-2xl bg-card p-6">
                <h2 className="font-display text-xl mb-6">Evolução por mês</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip formatter={(v: number) => brl(Number(v))} />
                      <Legend />
                      <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="colaborador" name="Colaboradora" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-border rounded-2xl bg-card p-6">
                <h2 className="font-display text-xl mb-6">Serviços mais utilizados</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byServico.slice(0, 5)}
                        dataKey="qtd"
                        nameKey="name"
                        outerRadius={95}
                        label
                      >
                        {byServico.slice(0, 5).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-12">
              {[
                { title: "Ranking de serviços", data: byServico, col: "Serviço" },
                { title: "Ranking de profissionais", data: byProfissional, col: "Profissional" },
              ].map((t) => (
                <div key={t.title} className="border border-border rounded-2xl bg-card overflow-hidden">
                  <h2 className="font-display text-xl px-6 pt-6 pb-4">{t.title}</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.col}</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {t.data.slice(0, 10).map((r) => (
                        <TableRow key={r.name}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell className="text-right">{r.qtd}</TableCell>
                          <TableCell className="text-right">{brl(r.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>

            <div className="border border-border rounded-2xl bg-card overflow-hidden mb-12">
              <h2 className="font-display text-xl px-6 pt-6 pb-4">Consumo por RE</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RE</TableHead>
                    <TableHead className="text-right">Atendimentos</TableHead>
                    <TableHead className="text-right">Valor total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byRe.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right">{r.qtd}</TableCell>
                      <TableCell className="text-right">{brl(r.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border border-border rounded-2xl bg-card p-6">
              <h2 className="font-display text-xl mb-2">Quem pode acessar o dashboard</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Cadastre os REs autorizados. Somente estes REs verão o link no portal.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Input
                  placeholder="RE (ex.: 0000)"
                  value={newRe}
                  onChange={(e) => setNewRe(e.target.value)}
                  className="sm:max-w-[180px]"
                />
                <Input
                  placeholder="Nome / observação (opcional)"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button onClick={addAccess} disabled={saving || !newRe.trim()}>
                  <Plus className="h-4 w-4" /> Cadastrar
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RE</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {access.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.re}</TableCell>
                      <TableCell>{a.note ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAccess(a.id)}
                          aria-label={`Remover acesso do RE ${a.re}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default EurofarmaDashboard;