import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const EurofarmaForgotPassword = () => {
  const navigate = useNavigate();
  const [re, setRe] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!re.trim() || !email.trim()) return;
    setLoading(true);
    const { error } = await supabase.functions.invoke("eurofarma-password-reset", {
      body: { action: "request", re: re.trim(), personal_email: email.trim() },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Verifique seu email",
      description: "Se os dados conferirem, enviaremos um código em instantes.",
    });
    navigate(`/empresas/eurofarma/redefinir-senha?re=${encodeURIComponent(re.trim())}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 text-center">Esqueci minha senha</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Informe seu RE e o email pessoal cadastrado no perfil. Enviaremos um código de 6 dígitos.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="re">RE</Label>
            <Input id="re" value={re} onChange={(e) => setRe(e.target.value)} required autoFocus />
          </div>
          <div>
            <Label htmlFor="email">Email pessoal</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar código"}
          </Button>
          <Link to="/empresas/eurofarma" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Voltar ao login
          </Link>
        </form>
      </div>
    </main>
  );
};

export default EurofarmaForgotPassword;