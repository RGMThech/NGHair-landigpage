import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVerticeAuth, verticeSignOut } from "@/hooks/useVerticeAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera } from "lucide-react";

type Profile = {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  accepted_terms: boolean;
};

const VerticeProfile = () => {
  const navigate = useNavigate();
  const { userId, checking } = useVerticeAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase
        .from("vertice_profiles")
        .select("user_id, email, full_name, phone, avatar_url, accepted_terms")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setAcceptedTerms((data as Profile).accepted_terms);
      }
    })();
  }, [navigate, userId]);

  const handleAvatar = async (file: File) => {
    if (!profile) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo grande", description: "Máximo 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.user_id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true, contentType: file.type,
    });
    if (upErr) {
      setUploading(false);
      toast({ title: "Erro no upload", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase
      .from("vertice_profiles")
      .update({ avatar_url: url })
      .eq("user_id", profile.user_id);
    setUploading(false);
    if (updErr) {
      toast({ title: "Erro", description: updErr.message, variant: "destructive" });
      return;
    }
    setProfile({ ...profile, avatar_url: url });
    toast({ title: "Foto atualizada" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!acceptedTerms) {
      toast({ title: "Aceite obrigatório", description: "Confirme o Termo de Consentimento (LGPD) para salvar.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("vertice_profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        accepted_terms: true,
      })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setProfile({ ...profile, accepted_terms: true });
    toast({ title: "Perfil atualizado" });
  };

  const handleDeleteProfile = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from("vertice_profiles")
      .delete()
      .eq("user_id", profile.user_id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    await verticeSignOut();
    toast({ title: "Perfil excluído", description: "Seus dados foram removidos." });
    navigate("/empresas/vertice");
  };

  if (checking || !userId) return null;
  if (!profile) return null;

  const initials = (profile.full_name ?? profile.email).slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between py-6">
          <Link to="/empresas/vertice/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Portal
          </Link>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Meu perfil</p>
        </div>
      </header>

      <section className="container max-w-3xl py-12">
        <div className="flex items-center gap-6 mb-10">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? profile.email} />}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-50"
              disabled={uploading}
              aria-label="Alterar foto"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])}
            />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">{profile.full_name || "Meu perfil"}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-5 bg-card border border-border rounded-2xl p-8">
          <div>
            <Label htmlFor="email">Email de acesso</Label>
            <Input id="email" value={profile.email} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado.</p>
          </div>
          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              value={profile.full_name ?? ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone celular</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone ?? ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(v) => setAcceptedTerms(v === true)}
              className="mt-0.5"
            />
            <Label htmlFor="terms" className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer">
              Confirmo o tratamento e compartilhamento dos meus dados conforme o{" "}
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
          <Button type="submit" disabled={saving || !acceptedTerms}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>

        <div className="mt-10 border border-destructive/30 rounded-2xl p-6 bg-destructive/5">
          <h2 className="font-display text-lg text-foreground mb-1">Excluir meu perfil</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Esta ação remove permanentemente seus dados do portal Vértice. Seu email continuará
            autorizado — para revogar o acesso, contate o administrador.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm("Tem certeza? Seus dados do perfil serão excluídos permanentemente.")) {
                void handleDeleteProfile();
              }
            }}
          >
            Excluir perfil
          </Button>
        </div>
      </section>
    </main>
  );
};

export default VerticeProfile;
