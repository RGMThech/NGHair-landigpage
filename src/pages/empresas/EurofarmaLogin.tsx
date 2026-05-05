import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const reToEmail = (re: string) => `re-${re.trim().toLowerCase()}@eurofarma.local`;

const EurofarmaLogin = () => {
  const navigate = useNavigate();
  const [re, setRe] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/empresas/eurofarma/portal");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRe = re.trim();
    if (!/^[a-zA-Z0-9]{3,20}$/.test(cleanRe)) {
      toast({
        title: "RE inválido",
        description: "Use apenas letras e números (3 a 20 caracteres).",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const email = reToEmail(cleanRe);
    const pwd = password || cleanRe;

    // 1) Try sign in
    const signIn = await supabase.auth.signInWithPassword({ email, password: pwd });

    let session = signIn.data?.session ?? null;

    if (signIn.error) {
      // Try first-access signup. If user already exists, signup returns an
      // error and we can show the appropriate message.
      const signup = await supabase.auth.signUp({
        email,
        password: pwd,
        options: { emailRedirectTo: `${window.location.origin}/empresas/eurofarma/portal` },
      });

      if (signup.error) {
        const msg = signup.error.message?.toLowerCase() ?? "";
        const isExisting = msg.includes("registered") || msg.includes("exists");
        setLoading(false);
        toast({
          title: isExisting ? "Senha incorreta" : "Erro no acesso",
          description: isExisting
            ? "Esse RE já tem cadastro. Informe sua senha ou use 'Esqueci minha senha'."
            : signup.error.message,
          variant: "destructive",
        });
        return;
      }

      session = signup.data.session;

      // Create profile (auto-confirm is on, so we have a session)
      if (signup.data.user) {
        await supabase.from("eurofarma_profiles").upsert(
          {
            user_id: signup.data.user.id,
            re: cleanRe,
            must_change_password: true,
          },
          { onConflict: "user_id" },
        );
      }
    }

    if (!session) {
      setLoading(false);
      toast({
        title: "Sessão não iniciada",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    // Decide next step based on profile flag
    const { data: profile } = await supabase
      .from("eurofarma_profiles")
      .select("must_change_password")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setLoading(false);
    navigate(profile?.must_change_password ? "/empresas/eurofarma/trocar-senha" : "/empresas/eurofarma/portal");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 text-center">Acesso Eurofarma</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Use seu RE de colaborador. No primeiro acesso, apenas RE, entre sem senha.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="re">RE (matrícula)</Label>
            <Input id="re" value={re} onChange={(e) => setRe(e.target.value)} required autoFocus />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco no primeiro acesso"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <Link
            to="/empresas/eurofarma/esqueci-senha"
            className="block text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </main>
  );
};

export default EurofarmaLogin;
