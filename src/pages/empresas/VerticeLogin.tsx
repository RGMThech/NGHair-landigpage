import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, KeyRound, ArrowLeft } from "lucide-react";

type LoginCodeResponse = { ok?: boolean; error?: string; token_hash?: string };

/** Chama a edge function e devolve a mensagem de erro do corpo mesmo em respostas não-2xx. */
async function callLoginCode(
  body: Record<string, string>,
): Promise<{ data: LoginCodeResponse | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke<LoginCodeResponse>("vertice-login-code", { body });
  if (data?.error === "not_authorized") {
    data.error = "Seu email não está na lista de acesso. Contate o administrador.";
  }
  if (!error) return { data, error: null };
  if (error instanceof FunctionsHttpError) {
    const payload = (await error.context.json().catch(() => null)) as LoginCodeResponse | null;
    if (payload?.error) return { data: payload, error: null };
  }
  return { data: null, error: "Falha de comunicação com o servidor. Tente novamente." };
}

const VerticeLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) {
        supabase.rpc("is_vertice_authorized", { email: data.user.email }).then(({ data: ok }) => {
          if (ok) navigate("/empresas/vertice/portal", { replace: true });
        });
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  /** Envia o código pela edge function vertice-login-code (SMTP Hostinger). */
  const requestCode = async (cleanEmail: string): Promise<string | null> => {
    const { data, error } = await callLoginCode({ action: "request", email: cleanEmail });
    return data?.error ?? error;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({ title: "Email inválido", description: "Digite um email válido.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const errorMsg = await requestCode(cleanEmail);
    setLoading(false);
    if (errorMsg) {
      toast({ title: "Não foi possível enviar o código", description: errorMsg, variant: "destructive" });
      return;
    }

    setStep(2);
    setResendTimer(60);
    toast({ title: "Código enviado!", description: "Verifique seu email (e a caixa de spam) e digite o código." });
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      toast({ title: "Código inválido", description: "Digite os 6 dígitos do código.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await callLoginCode({
      action: "verify",
      email: email.trim().toLowerCase(),
      code: cleanCode,
    });
    if (!data?.token_hash) {
      setLoading(false);
      toast({
        title: "Código inválido",
        description: data?.error ?? error ?? "O código está incorreto ou expirou.",
        variant: "destructive",
      });
      return;
    }

    const { data: session, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: "magiclink",
    });
    setLoading(false);
    if (otpError || !session.session) {
      toast({ title: "Erro ao entrar", description: "Tente novamente.", variant: "destructive" });
      return;
    }

    navigate("/empresas/vertice/portal", { replace: true });
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    const errorMsg = await requestCode(email.trim().toLowerCase());
    setLoading(false);
    if (errorMsg) {
      toast({ title: "Erro ao reenviar", description: errorMsg, variant: "destructive" });
      return;
    }
    setResendTimer(60);
    toast({ title: "Código reenviado!" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-3xl text-foreground mb-2 text-center">Acesso Vértice</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {step === 1
            ? "Digite seu email cadastrado para receber o código de acesso."
            : "Digite o código de 6 dígitos enviado para seu email."}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar código"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <Label htmlFor="code">Código de acesso</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="pl-10 text-center text-2xl tracking-[0.5em]"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando..." : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0 || loading}
              className="block w-full text-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : "Reenviar código"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setCode(""); }}
              className="flex items-center justify-center gap-1 w-full text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Trocar email
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default VerticeLogin;
