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
      // 1) checagem local imediata: sem token, redireciona na hora
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;
      if (!sessionData.session) {
        await reject();
        return;
      }
      // libera a tela com o token local...
      setUserId(sessionData.session.user.id);
      setChecking(false);
      // ...e valida no servidor logo em seguida (token revogado/expirado cai fora)
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        await reject();
        return;
      }
      setUserId(data.user.id);
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
