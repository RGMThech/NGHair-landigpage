import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { PasswordRulesChecklist } from "@/components/PasswordRulesChecklist";
import { validatePassword } from "@/lib/password-rules";

const EurofarmaChangePassword = () => {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        navigate("/empresas/eurofarma", { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast({ title: "Aceite obrigatório", description: "Você precisa aceitar o Termo de Consentimento (LGPD) para continuar.", variant: "destructive" });
      return;
    }
    if (!validatePassword(pwd)) {
      toast({ title: "Senha fora do padrão", description: "Atenda a todos os requisitos listados.", variant: "destructive" });
      return;
    }
    if (pwd !== confirm) {
      toast({ title: "Senhas diferentes", description: "Confirme a mesma senha.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("eurofarma_profiles")
        .update({ must_change_password: false })
        .eq("user_id", user.id);
    }
    setLoading(false);
    toast({ title: "Senha atualizada", description: "Acesse o portal." });
    navigate("/empresas/eurofarma/portal");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 text-center">Defina sua nova senha</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">Primeiro acesso detectado. Escolha uma senha segura.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pwd">Nova senha</Label>
            <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
            <div className="mt-2">
              <PasswordRulesChecklist password={pwd} />
            </div>
          </div>
          <div>
            <Label htmlFor="confirm">Confirme a senha</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(v) => setAcceptedTerms(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
              Li e aceito o tratamento e compartilhamento dos meus dados conforme o{" "}
              <a
                href="/termo-lgpd-eurofarma.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-foreground hover:text-primary"
              >
                Termo de Consentimento (LGPD)
              </a>
              .
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !acceptedTerms}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </div>
    </main>
  );
};

export default EurofarmaChangePassword;