import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const EurofarmaResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [re, setRe] = useState(params.get("re") ?? "");
  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) {
      toast({ title: "Senha curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (pwd !== confirm) {
      toast({ title: "Senhas diferentes", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("eurofarma-password-reset", {
      body: { action: "confirm", re: re.trim(), token: token.trim(), new_password: pwd },
    });
    if (error || (data as { error?: string })?.error) {
      toast({
        title: "Não foi possível redefinir",
        description: (data as { error?: string })?.error ?? error?.message ?? "Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    // auto sign in
    const email = (data as { email?: string })?.email;
    if (email) await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    toast({ title: "Senha redefinida", description: "Você já está conectado." });
    navigate("/empresas/eurofarma/portal");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 text-center">Redefinir senha</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Digite o código de 6 dígitos enviado ao seu email pessoal.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="re">RE</Label>
            <Input id="re" value={re} onChange={(e) => setRe(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="token">Código</Label>
            <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required maxLength={6} inputMode="numeric" />
          </div>
          <div>
            <Label htmlFor="pwd">Nova senha</Label>
            <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="confirm">Confirme a senha</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir"}
          </Button>
          <Link to="/empresas/eurofarma" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Voltar ao login
          </Link>
        </form>
      </div>
    </main>
  );
};

export default EurofarmaResetPassword;