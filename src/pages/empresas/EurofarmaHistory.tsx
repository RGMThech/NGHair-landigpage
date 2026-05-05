import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";

const EurofarmaHistory = () => {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl flex items-center justify-between py-6">
          <Link to="/empresas/eurofarma/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao portal
          </Link>
        </div>
      </header>

      <section className="container max-w-3xl py-24 text-center">
        <Clock className="h-12 w-12 text-primary mx-auto mb-6" />
        <h1 className="font-display text-4xl text-foreground mb-4">Em breve</h1>
        <p className="text-muted-foreground">
          A consulta de serviços utilizados por período estará disponível em breve.
        </p>
      </section>
    </main>
  );
};

export default EurofarmaHistory;