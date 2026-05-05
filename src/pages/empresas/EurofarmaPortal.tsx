import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Table as TableIcon, History } from "lucide-react";

const EurofarmaPortal = () => {
  const navigate = useNavigate();
  const [re, setRe] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/empresas/eurofarma");
        return;
      }
      const { data: profile } = await supabase
        .from("eurofarma_profiles")
        .select("re, must_change_password")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile?.must_change_password) {
        navigate("/empresas/eurofarma/trocar-senha");
        return;
      }
      if (profile) setRe(profile.re);
    })();
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/empresas/eurofarma");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl flex items-center justify-between py-6">
          <div>
            <Link to="/" className="font-display text-2xl text-foreground">NGHair</Link>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              Portal Eurofarma {re && `· RE ${re}`}
            </p>
          </div>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <section className="container max-w-5xl py-16">
        <h1 className="font-display text-4xl text-foreground mb-3">Bem-vindo(a)</h1>
        <p className="text-muted-foreground mb-12">Escolha uma das opções abaixo.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/empresas/eurofarma/precos"
            className="group border border-border rounded-2xl p-8 bg-card hover:border-primary transition-all"
          >
            <TableIcon className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Tabela de preços</h2>
            <p className="text-sm text-muted-foreground">
              Consulte todos os serviços e o valor exclusivo para colaboradores Eurofarma.
            </p>
          </Link>

          <Link
            to="/empresas/eurofarma/historico"
            className="group border border-border rounded-2xl p-8 bg-card hover:border-primary transition-all"
          >
            <History className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Serviços utilizados</h2>
            <p className="text-sm text-muted-foreground">
              Consulte por período os serviços que você utilizou.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default EurofarmaPortal;