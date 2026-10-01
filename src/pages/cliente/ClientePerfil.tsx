import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClienteAuth } from "@/hooks/useClienteAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, CalendarClock } from "lucide-react";

const ClientePerfil = () => {
  const { profile, checking, setProfile } = useClienteAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setNome(profile.full_name ?? ""); setPhone(profile.phone ?? ""); setBirth(profile.birth_date ?? "");
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking || !profile) return null;

  const notify = () => window.dispatchEvent(new Event("cliente-profile-updated"));

  const handleAvatar = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast({ title: "Arquivo grande", description: "Máximo 5MB.", variant: "destructive" });
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.user_id}/cliente-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setUploading(false); return toast({ title: "Erro no envio da foto", variant: "destructive" }); }
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    await supabase.from("cliente_profiles").update({ avatar_url: url }).eq("user_id", profile.user_id);
    setUploading(false);
    setProfile({ ...profile, avatar_url: url }); notify();
    toast({ title: "Foto atualizada!" });
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const upd = { full_name: nome.trim() || null, phone: phone.trim() || null, birth_date: birth || null };
    const { error } = await supabase.from("cliente_profiles").update(upd).eq("user_id", profile.user_id);
    if (!error) await supabase.functions.invoke("cliente-area", { body: { action: "sincronizar", nome: upd.full_name ?? "", telefone: upd.phone ?? "" } }).catch(() => undefined);
    setSaving(false);
    if (error) return toast({ title: "Erro ao salvar", variant: "destructive" });
    setProfile({ ...profile, ...upd }); notify();
    toast({ title: "Perfil atualizado!", description: "Seus dados também foram atualizados no salão." });
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="container max-w-2xl py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar ao site
        </Link>
        <h1 className="font-display text-4xl text-foreground mb-8">Meu perfil</h1>

        <div className="flex items-center gap-5 mb-8">
          <Avatar className="h-24 w-24">
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{(profile.full_name ?? profile.email)[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Camera className="h-4 w-4" /> {uploading ? "Enviando..." : "Trocar foto"}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
          </div>
        </div>

        <form onSubmit={salvar} className="space-y-5 bg-card border border-border rounded-2xl p-6">
          <div><Label>E-mail</Label><Input value={profile.email} disabled /></div>
          <div><Label htmlFor="nome">Nome completo</Label><Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div><Label htmlFor="tel">Telefone com DDD</Label><Input id="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><Label htmlFor="nasc">Data de nascimento</Label><Input id="nasc" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </form>

        <Link to="/minha-conta/agendamentos" className="mt-6 flex items-center gap-3 border border-border rounded-2xl p-5 bg-card hover:border-primary transition">
          <CalendarClock className="h-6 w-6 text-primary" />
          <span className="text-foreground">Ver meus agendamentos</span>
        </Link>
      </section>
    </main>
  );
};

export default ClientePerfil;
