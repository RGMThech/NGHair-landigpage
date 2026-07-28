import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { eurofarmaPrices } from "@/lib/eurofarma-prices";
import { useEurofarmaAuth } from "@/hooks/useEurofarmaAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const EurofarmaPrices = () => {
  const { userId, checking } = useEurofarmaAuth();
  if (checking || !userId) return null;
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl flex items-center justify-between py-6">
          <Link to="/empresas/eurofarma/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao portal
          </Link>
        </div>
      </header>

      <section className="container max-w-5xl py-12">
        <h1 className="font-display text-4xl text-foreground mb-3">Tabela de preços</h1>
        <p className="text-muted-foreground mb-8">
          Valores exclusivos para colaboradores Eurofarma — 50% de desconto sobre o valor cheio.
        </p>

        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead className="text-right">Valor cheio</TableHead>
                <TableHead className="text-right text-primary">Valor colaborador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eurofarmaPrices.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right text-muted-foreground line-through">
                    {fmt(item.full)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {fmt(item.collaborator)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
};

export default EurofarmaPrices;