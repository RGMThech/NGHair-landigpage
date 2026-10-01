import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, KeyRound, Mail, UserPlus } from "lucide-react";

const ERROS: Record<string, string> = {
  email_invalido: "Digite um e-mail válido.",
  nome_invalido: "Informe nome e sobrenome.",
  telefone_invalido: "Informe o telefone com DDD.",
  aguarde: "Aguarde um minuto antes de pedir um novo código.",
  envio_falhou: "Não foi possível enviar o e-mail. Tente novamente.",
  codigo_invalido: "O código está incorreto ou expirou.",
  criacao_nao_confirmada: "Não conseguimos confirmar seu cadastro. Tente novamente ou fale conosco pelo WhatsApp.",
  nao_encontrado: "Cadastro não localizado.",
};

async function call(body: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke("cliente-area", { body });
  if (error && !data) return { error: "Falha de comunicação com o servidor. Tente novamente." } as any;
  if (data?.error) return { ...data, error: ERROS[data.error] ?? "Algo deu errado. Tente novamente." };
  return data;
}

const ClienteLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "criar" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("cliente_profiles").select("id").eq("user_id", data.user.id).maybeSingle();
      if (p) navigate("/minha-conta/perfil", { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const clean = () => email.trim().toLowerCase();
  const erro = (msg: string) => toast({ title: "Atenção", description: msg, variant: "destructive" });

  const enviarCodigo = async () => {
    const r = await call({ action: "enviar", email: clean() });
    if (r?.error) { erro(r.error); return false; }
    setStep("codigo"); setTimer(60);
    toast({ title: "Código enviado!", description: "Verifique seu e-mail (e a caixa de spam)." });
    return true;
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean())) return erro("Digite um e-mail válido.");
    setLoading(true);
    const r = await call({ action: "verificar", email: clean() });
    if (r?.error) { setLoading(false); return erro(r.error); }
    if (!r?.encontrado) { setLoading(false); setStep("criar"); return; }
    await enviarCodigo();
    setLoading(false);
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await call({ action: "criar", email: clean(), nome: nome.trim(), telefone });
    if (r?.error) { setLoading(false); return erro(r.error); }
    toast({ title: "Cadastro criado!", description: "Agora enviamos um código para o seu e-mail." });
    await enviarCodigo();
    setLoading(false);
  };

  const handleCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await call({ action: "validar", email: clean(), code: code.trim() });
    if (!r?.token_hash) { setLoading(false); return erro(r?.error ?? "O código está incorreto ou expirou."); }
    const { error } = await supabase.auth.verifyOtp({ token_hash: r.token_hash, type: "magiclink" });
    setLoading(false);
    if (error) return erro("Erro ao entrar. Tente novamente.");
    navigate("/minha-conta/perfil", { replace: true });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="font-display text-3xl text-foreground mb-2 text-center">Área do Cliente</h1>

          {step === "email" && (
            <form onSubmit={handleEmail} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center mb-4">Digite seu e-mail para receber um código de acesso.</p>
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus className="pl-10" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Verificando..." : "Continuar"}</Button>
            </form>
          )}

          {step === "criar" && (
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="rounded-lg border border-accent bg-accent/10 p-3 text-sm text-foreground">
                <strong>Cadastro não localizado.</strong> Crie seu cadastro informando nome, telefone com DDD e e-mail.
              </div>
              <div><Label htmlFor="nome">Nome e sobrenome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus /></div>
              <div><Label htmlFor="tel">Telefone com DDD</Label>
                <Input id="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" required /></div>
              <div><Label htmlFor="email2">E-mail (obrigatório)</Label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>
                <UserPlus className="h-4 w-4" /> {loading ? "Criando..." : "Criar cadastro e receber código"}
              </Button>
              <button type="button" onClick={() => setStep("email")} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
                Tentar outro e-mail
              </button>
            </form>
          )}

          {step === "codigo" && (
            <form onSubmit={handleCodigo} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">Digite o código de 6 dígitos enviado para <strong>{clean()}</strong>.</p>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000" required autoFocus className="pl-10 text-center text-2xl tracking-[0.5em]" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Verificando..." : "Entrar"}</Button>
              <button type="button" disabled={timer > 0 || loading}
                onClick={async () => { setLoading(true); await enviarCodigo(); setLoading(false); }}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
                {timer > 0 ? `Reenviar em ${timer}s` : "Reenviar código"}
              </button>
              <button type="button" onClick={() => { setStep("email"); setCode(""); }} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
                Trocar e-mail
              </button>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground flex gap-3">
          <Building2 className="h-5 w-5 text-primary shrink-0" />
          <p>
            É colaborador(a) de uma empresa parceira? Entre pelo menu <strong>Empresas</strong>, na sua empresa:{" "}
            <Link to="/empresas/eurofarma" className="text-primary underline">Eurofarma</Link> ou{" "}
            <Link to="/empresas/vertice" className="text-primary underline">Vértice</Link>.
          </p>
        </div>
      </div>
    </main>
  );
};

export default ClienteLogin;
