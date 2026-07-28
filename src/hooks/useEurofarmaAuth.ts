import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guard de autenticação do portal Eurofarma.
 * Valida a sessão no servidor (getUser) — getSession sozinho aceita
 * tokens locais expirados/revogados e liberava o acesso sem login.
 */
export function useEurofarmaAuth() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const reject = async () => {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      if (!active) return;
      setUserId(null);
      setChecking(false);
      navigate("/empresas/eurofarma", { replace: true });
    };

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        await reject();
        return;
      }
      setUserId(data.user.id);
      setChecking(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === "SIGNED_OUT") void reject();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return { userId, checking };
}

export async function eurofarmaSignOut() {
  await supabase.auth.signOut().catch(() => undefined);
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
}
