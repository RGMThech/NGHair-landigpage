import { Link } from "react-router-dom";
import { ArrowLeft, Scissors, Sparkles, Hand } from "lucide-react";
import { verticePriceCategories } from "@/lib/vertice-prices";
import { useVerticeAuth } from "@/hooks/useVerticeAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const categoryIcons = {
  Cabelo: Scissors,
  Unhas: Hand,
  Estética: Sparkles,
};

const VerticePrices = () => {
  const { userId, checking } = useVerticeAuth();
  if (checking || !userId) return null;
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl flex items-center justify-between py-6">
          <Link to="/empresas/vertice/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao portal
          </Link>
        </div>
      </header>

      <section className="container max-w-5xl py-12">
        <h1 className="font-display text-4xl text-foreground mb-3">Tabela de preços</h1>
        <p className="text-muted-foreground mb-8">
          Consulte os serviços disponíveis e seus respectivos valores.
        </p>

        <div className="space-y-8">
          {verticePriceCategories.map((category) => {
            const Icon = categoryIcons[category.name as keyof typeof categoryIcons];
            return (
              <section key={category.name} className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-5 py-4">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 className="font-display text-2xl text-foreground">{category.name}</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.items.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right font-semibold text-foreground">
                          {fmt(item.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default VerticePrices;
