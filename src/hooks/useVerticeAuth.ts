import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/** Evita que o guard redirecione para o login enquanto o logout leva para o site. */
let signingOut = false;

/**
 * Guard de autenticação do portal Vértice.
 * Valida a sessão no servidor (getUser) e verifica se o email
 * está autorizado (lista vertice_authorized_emails ou admin).
 */
export function useVerticeAuth() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const reject = async () => {
      if (signingOut) return;
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      if (!active) return;
      setUserId(null);
      setChecking(false);
      navigate("/empresas/vertice", { replace: true });
    };

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;
      if (!sessionData.session) {
        await reject();
        return;
      }
      setUserId(sessionData.session.user.id);
      setChecking(false);

      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) {
        await reject();
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);

      // Verifica autorização Vértice
      const { data: authorized } = await supabase.rpc("is_vertice_authorized", {
        email: data.user.email,
      });
      if (!active) return;
      if (!authorized) {
        await reject();
        return;
      }

      // Verifica se é admin
      const { data: admin } = await supabase.rpc("is_vertice_admin", {
        _user_id: data.user.id,
      });
      if (!active) return;
      setIsAdmin(Boolean(admin));
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session || event === "SIGNED_OUT") void reject();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return { userId, userEmail, isAdmin, checking };
}

export async function verticeSignOut() {
  signingOut = true;
  await supabase.auth.signOut().catch(() => undefined);
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
}

/** Sai do portal e volta para a raiz do site institucional. */
export async function verticeLogout() {
  await verticeSignOut();
  window.location.replace("https://www.nghair.com.br");
}
