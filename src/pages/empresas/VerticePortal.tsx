import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVerticeAuth, verticeLogout } from "@/hooks/useVerticeAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut, Table as TableIcon, User, Gift, MapPin, Plus, Trash2, ShieldCheck, Receipt,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type AuthorizedEmail = {
  id: string;
  email: string;
  full_name: string | null;
  note: string | null;
  created_at: string;
};

const VerticePortal = () => {
  const navigate = useNavigate();
  const { userId, userEmail, isAdmin, checking } = useVerticeAuth();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Cria perfil se não existir
      const { data: existing } = await supabase
        .from("vertice_profiles")
        .select("id, full_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("vertice_profiles").insert({
          user_id: userId,
          email: userEmail ?? "",
        });
      } else {
        setFullName(existing.full_name ?? "");
        setAvatarUrl(existing.avatar_url ?? null);
      }

      if (isAdmin) {
        const { data: list } = await supabase
          .from("vertice_authorized_emails")
          .select("id, email, full_name, note, created_at")
          .order("created_at", { ascending: false });
        if (list) setAuthorizedEmails(list as AuthorizedEmail[]);
      }
    })();
  }, [navigate, userId, userEmail, isAdmin]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    setAddingEmail(true);
    const { data, error } = await supabase
      .from("vertice_authorized_emails")
      .insert({
        email: cleanEmail,
        full_name: newName.trim() || null,
        note: newNote.trim() || null,
        created_by: userId,
      })
      .select("id, email, full_name, note, created_at")
      .single();

    setAddingEmail(false);
    if (error) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message.includes("duplicate") ? "Email já cadastrado." : error.message,
        variant: "destructive",
      });
      return;
    }
    setAuthorizedEmails([data as AuthorizedEmail, ...authorizedEmails]);
    setNewEmail("");
    setNewName("");
    setNewNote("");
    toast({ title: "Email autorizado!", description: `${cleanEmail} já pode fazer login.` });
  };

  const handleRemoveEmail = async (id: string, email: string) => {
    const { error } = await supabase.from("vertice_authorized_emails").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    setAuthorizedEmails(authorizedEmails.filter((e) => e.id !== id));
    toast({ title: "Email removido", description: `${email} não tem mais acesso.` });
  };

  const logout = () => void verticeLogout();

  if (checking || !userId) return null;

  const initials = (fullName || userEmail || "V").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-5xl flex items-center justify-between py-6">
          <div>
            <Link to="/" className="font-display text-2xl text-foreground">NGHair</Link>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              Portal Vértice {fullName && `· ${fullName}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/empresas/vertice/perfil"
              className="flex items-center gap-3 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition-colors"
              aria-label="Meu perfil"
            >
              <Avatar className="h-12 w-12">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback>{initials}</AvatarFallback>
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
        <p className="text-muted-foreground mb-12">
          Parceria NGHair × Vértice. Escolha uma das opções abaixo.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/empresas/vertice/precos"
            className="group border border-border rounded-2xl p-8 bg-card hover:border-primary transition-all"
          >
            <TableIcon className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Tabela de preços</h2>
            <p className="text-sm text-muted-foreground">
              Consulte os serviços de cabelo, unhas e estética com seus respectivos valores.
            </p>
          </Link>

          <Link
            to="/empresas/vertice/promocoes"
            className="group border border-border rounded-2xl p-8 bg-card hover:border-primary transition-all"
          >
            <Gift className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Promoções</h2>
            <p className="text-sm text-muted-foreground">
              Acompanhe as promoções e ofertas exclusivas para colaboradores Vértice.
            </p>
          </Link>

          <Link
            to="/empresas/vertice/servicos"
            className="group border border-border rounded-2xl p-8 bg-card hover:border-primary transition-all"
          >
            <Receipt className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Serviços utilizados</h2>
            <p className="text-sm text-muted-foreground">
              Consulte mês a mês os serviços que você utilizou.
            </p>
          </Link>

          <Link
            to="/empresas/vertice/perfil"
            className="group border border-border rounded-2xl p-8 bg-card hover:border-primary transition-all"
          >
            <User className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-2">Meu perfil</h2>
            <p className="text-sm text-muted-foreground">
              Atualize foto, nome e telefone de contato.
            </p>
          </Link>

          <div className="border border-border rounded-2xl p-8 bg-card">
            <MapPin className="h-8 w-8 text-primary mb-4" />
            <h2 className="font-display text-2xl mb-3">Unidades NGHair</h2>
            <div className="flex flex-col gap-2">
              <Link to="/unidades/campo-belo" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                → Campo Belo
              </Link>
              <Link to="/unidades/brooklin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                → Brooklin
              </Link>
              <Link to="/agendamento" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                → Agendar serviço
              </Link>
            </div>
          </div>
        </div>

        {/* Admin: gestão de emails autorizados */}
        {isAdmin && (
          <div className="border border-border rounded-2xl p-8 bg-card">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl text-foreground">Gestão de acessos</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Cadastre os emails autorizados a fazer login no portal Vértice.
            </p>

            <form onSubmit={handleAddEmail} className="grid sm:grid-cols-3 gap-3 mb-6">
              <div>
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nome@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-name">Nome (opcional)</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nome do colaborador"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="new-note">Observação</Label>
                  <Input
                    id="new-note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Setor, cargo..."
                  />
                </div>
                <Button type="submit" disabled={addingEmail} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {authorizedEmails.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum email cadastrado. Admins sempre têm acesso.
                </p>
              )}
              {authorizedEmails.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.email}
                      {item.full_name && <span className="text-muted-foreground"> · {item.full_name}</span>}
                    </p>
                    {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveEmail(item.id, item.email)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default VerticePortal;
