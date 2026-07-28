import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEurofarmaAuth, eurofarmaSignOut } from "@/hooks/useEurofarmaAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Table as TableIcon, History, User } from "lucide-react";

const EurofarmaPortal = () => {
  const navigate = useNavigate();
  const { userId, checking } = useEurofarmaAuth();
  const [re, setRe] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: profile } = await supabase
        .from("eurofarma_profiles")
        .select("re, must_change_password, full_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (profile?.must_change_password) {
        navigate("/empresas/eurofarma/trocar-senha");
        return;
      }
      if (profile) {
        setRe(profile.re);
        setFullName(profile.full_name ?? "");
        setAvatarUrl(profile.avatar_url ?? null);
      }
    })();
  }, [navigate, userId]);

  const logout = async () => {
    await eurofarmaSignOut();
    window.location.href = "https://www.nghair.com.br";
  };

  if (checking || !userId) return null;

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
          <div className="flex items-center gap-2">
            <Link
              to="/empresas/eurofarma/perfil"
              className="flex items-center gap-3 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors"
              aria-label="Meu perfil"
            >
              <Avatar className="h-12 w-12">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || re} />}
                <AvatarFallback>{(fullName || re).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm text-foreground">
                {fullName || "Meu perfil"}
              </span>
            </Link>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
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

          <Link
            to="/empresas/eurofarma/perfil"
            className="group border border-border rounded-2xl p-8 bg-card hover:border-primary transition-all"
          >
            <User className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Meu perfil</h2>
            <p className="text-sm text-muted-foreground">
              Atualize foto, telefone, data de nascimento e email pessoal.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default EurofarmaPortal;