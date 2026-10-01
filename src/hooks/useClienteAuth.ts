import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type ClienteProfile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  trinks_cliente_id: number | null;
};

/** Perfil da Área do Cliente (null se não logada ou se a conta não for de cliente). */
export function useClienteProfile() {
  const [profile, setProfile] = useState<ClienteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (uid: string | null) => {
      if (!uid) { if (active) { setProfile(null); setLoading(false); } return; }
      const { data } = await supabase.from("cliente_profiles").select("*").eq("user_id", uid).maybeSingle();
      if (active) { setProfile((data as ClienteProfile) ?? null); setLoading(false); }
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => load(s?.user.id ?? null), 0);
    });
    const onUpdate = () => supabase.auth.getSession().then(({ data }) => load(data.session?.user.id ?? null));
    window.addEventListener("cliente-profile-updated", onUpdate);
    return () => { active = false; sub.subscription.unsubscribe(); window.removeEventListener("cliente-profile-updated", onUpdate); };
  }, []);

  return { profile, loading, setProfile };
}

/** Guard: exige sessão válida e perfil de cliente; senão leva para o login. */
export function useClienteAuth() {
  const navigate = useNavigate();
  const { profile, loading, setProfile } = useClienteProfile();
  useEffect(() => {
    if (loading) return;
    if (!profile) { navigate("/minha-conta/entrar", { replace: true }); return; }
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) navigate("/minha-conta/entrar", { replace: true });
    });
  }, [loading, profile, navigate]);
  return { profile, checking: loading || !profile, setProfile };
}

export async function clienteLogout() {
  await supabase.auth.signOut().catch(() => undefined);
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  window.location.replace("/");
}
