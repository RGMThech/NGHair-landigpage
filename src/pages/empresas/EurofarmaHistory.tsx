import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEurofarmaAuth } from "@/hooks/useEurofarmaAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Entry = {
  id: string;
  month_ref: string;
  data: string | null;
  hora: string | null;
  profissional: string | null;
  servico: string | null;
  cliente: string | null;
  re: string;
  valor: number | null;
  rubrica: string | null;
};

const MONTH_LABELS: Record<string, string> = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
};

const formatMonth = (m: string) => {
  const [y, mm] = m.split("-");
  return `${MONTH_LABELS[mm] ?? mm} / ${y}`;
};

const EurofarmaHistory = () => {
  const navigate = useNavigate();
  const { userId, checking } = useEurofarmaAuth();
  const [params, setParams] = useSearchParams();
  const selectedMonth = params.get("mes");
  const [months, setMonths] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("eurofarma_entries")
        .select("month_ref")
        .order("month_ref", { ascending: false });
      const unique = Array.from(new Set((data ?? []).map((d) => d.month_ref)));
      setMonths(unique);
      setLoading(false);
    })();
  }, [navigate, userId]);

  useEffect(() => {
    if (!selectedMonth) {
      setEntries([]);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("eurofarma_entries")
        .select("*")
        .eq("month_ref", selectedMonth)
        .order("data", { ascending: true })
        .order("hora", { ascending: true });
      setEntries((data ?? []) as Entry[]);
      setLoading(false);
    })();
  }, [selectedMonth]);

  const total = useMemo(
    () => entries.reduce((acc, e) => acc + (Number(e.valor) || 0), 0),
    [entries],
  );

  const totalColaborador = useMemo(
    () =>
      entries.reduce((acc, e) => {
        const valor = Number(e.valor) || 0;
        const rubrica = (e.rubrica ?? "").trim().replace(/^0+/, "");
        const fator = rubrica === "105" ? 0.5 : 1;
        return acc + valor * fator;
      }, 0),
    [entries],
  );

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
        <h1 className="font-display text-4xl text-foreground mb-2">Serviços utilizados</h1>
        <p className="text-muted-foreground mb-8">
          Selecione o mês para visualizar somente os seus lançamentos.
        </p>

        {!selectedMonth && (
          <>
            {loading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : months.length === 0 ? (
              <p className="text-muted-foreground">Nenhum período disponível ainda.</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => setParams({ mes: m })}
                    className="group border border-border rounded-2xl p-6 bg-card hover:border-primary transition-all text-left"
                  >
                    <Calendar className="h-6 w-6 text-primary mb-3" />
                    <h2 className="font-display text-xl">{formatMonth(m)}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ver lançamentos
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {selectedMonth && (
          <>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setParams({})}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Outros meses
              </button>
              <h2 className="font-display text-2xl">{formatMonth(selectedMonth)}</h2>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Carregando…</p>
            ) : entries.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum lançamento encontrado para o seu RE neste período.
              </p>
            ) : (
              <div className="border border-border rounded-2xl bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>RE</TableHead>
                      <TableHead>Rubrica</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          {e.data
                            ? new Date(e.data + "T00:00:00").toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell>{e.hora ?? "-"}</TableCell>
                        <TableCell>{e.profissional ?? "-"}</TableCell>
                        <TableCell>{e.servico ?? "-"}</TableCell>
                        <TableCell>{e.cliente ?? "-"}</TableCell>
                        <TableCell>{e.re}</TableCell>
                        <TableCell>{e.rubrica ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          {e.valor != null
                            ? e.valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={7} className="font-medium text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} className="font-medium text-right">
                        Valor do colaborador
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {totalColaborador.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export default EurofarmaHistory;