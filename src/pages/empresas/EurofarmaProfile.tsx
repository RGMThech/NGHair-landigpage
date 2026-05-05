import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera } from "lucide-react";

type Profile = {
  user_id: string;
  re: string;
  full_name: string | null;
  personal_email: string | null;
  phone: string | null;
  birth_date: string | null;
  avatar_url: string | null;
};

const EurofarmaProfile = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/empresas/eurofarma");
        return;
      }
      const { data } = await supabase
        .from("eurofarma_profiles")
        .select("user_id, re, full_name, personal_email, phone, birth_date, avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    })();
  }, [navigate]);

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
      .from("eurofarma_profiles")
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
    setSaving(true);
    const { error } = await supabase
      .from("eurofarma_profiles")
      .update({
        full_name: profile.full_name,
        personal_email: profile.personal_email?.toLowerCase() || null,
        phone: profile.phone,
        birth_date: profile.birth_date,
      })
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Perfil atualizado" });
  };

  if (!profile) return null;

  const initials = (profile.full_name ?? profile.re).slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container max-w-3xl flex items-center justify-between py-6">
          <Link to="/empresas/eurofarma/portal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Portal
          </Link>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Meu perfil · RE {profile.re}</p>
        </div>
      </header>

      <section className="container max-w-3xl py-12">
        <div className="flex items-center gap-6 mb-10">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? profile.re} />}
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
            <p className="text-sm text-muted-foreground">Mantenha seus dados atualizados.</p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-5 bg-card border border-border rounded-2xl p-8">
          <div>
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              value={profile.full_name ?? ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="personal_email">Email pessoal</Label>
              <Input
                id="personal_email"
                type="email"
                value={profile.personal_email ?? ""}
                onChange={(e) => setProfile({ ...profile, personal_email: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Usado para recuperar sua senha.</p>
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
          </div>
          <div>
            <Label htmlFor="birth_date">Data de nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              value={profile.birth_date ?? ""}
              onChange={(e) => setProfile({ ...profile, birth_date: e.target.value })}
              className="max-w-xs"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </section>
    </main>
  );
};

export default EurofarmaProfile;