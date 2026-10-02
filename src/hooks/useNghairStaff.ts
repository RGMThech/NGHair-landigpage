import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClienteProfile } from "@/hooks/useClienteAuth";
import { isNghairEmail } from "@/lib/esmaltes";

/** Guard: só e-mails @nghair.com.br logados pela Área do Cliente. */
export function useNghairStaff() {
  const navigate = useNavigate();
  const { profile, loading } = useClienteProfile();
  const ok = !!profile && isNghairEmail(profile.email);
  useEffect(() => {
    if (loading) return;
    if (!profile) navigate("/minha-conta/entrar", { replace: true });
    else if (!ok) navigate("/", { replace: true });
  }, [loading, profile, ok, navigate]);
  return { checking: loading || !ok, profile };
}
