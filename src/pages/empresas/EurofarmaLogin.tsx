import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    if (!re.trim()) return;
    setLoading(true);
    const email = reToEmail(re);
    const pwd = password || re.trim();

    // Try sign in
    let { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });

    if (error) {
      // First access: try sign up using RE as initial password
      const signup = await supabase.auth.signUp({
        email,
        password: re.trim(),
        options: { emailRedirectTo: `${window.location.origin}/empresas/eurofarma/portal` },
      });
      if (signup.error) {
        toast({ title: "Erro no acesso", description: signup.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      // Insert profile
      if (signup.data.user) {
        await supabase.from("eurofarma_profiles").insert({
          user_id: signup.data.user.id,
          re: re.trim(),
          must_change_password: true,
        });
      }
      data = signup.data as typeof data;
    }

    setLoading(false);
    if (data?.session) {
      const { data: profile } = await supabase
        .from("eurofarma_profiles")
        .select("must_change_password")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (profile?.must_change_password) {
        navigate("/empresas/eurofarma/trocar-senha");
      } else {
        navigate("/empresas/eurofarma/portal");
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 text-center">Acesso Eurofarma</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Use seu RE de colaborador. No primeiro acesso, a senha é o próprio RE.
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
        </form>
      </div>
    </main>
  );
};

export default EurofarmaLogin;