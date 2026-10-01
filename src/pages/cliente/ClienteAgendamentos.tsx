import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarClock, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClienteAuth } from "@/hooks/useClienteAuth";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Ag = { id: number; unidadeNome: string; status: string; servico: string; profissional: string; dataHoraInicio: string };

const fmt = (iso: string) => {
  const [d, t] = iso.split("T");
  const [y, m, dd] = d.split("-").map(Number);
  return { dia: new Date(y, m - 1, dd).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }), hora: t?.slice(0, 5) ?? "" };
};

const ClienteAgendamentos = () => {
  const { profile, checking } = useClienteAuth();
  const [lista, setLista] = useState<Ag[] | null>(null);
  const [erro, setErro] = useState("");
  const [alvo, setAlvo] = useState<Ag | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const carregar = useCallback(async () => {
    setErro("");
    const { data, error } = await supabase.functions.invoke("cliente-area", { body: { action: "agendamentos" } });
    if (error || data?.error) {
      setErro(data?.error === "sem_cadastro_trinks" ? "Não encontramos seu cadastro no salão." : "Não foi possível consultar seus agendamentos agora.");
      setLista([]); return;
    }
    setLista(data.agendamentos ?? []);
  }, []);

  useEffect(() => { if (profile) void carregar(); }, [profile, carregar]);

  const cancelar = async () => {
    if (!alvo) return;
    setCancelando(true);
    const { data, error } = await supabase.functions.invoke("cliente-area", { body: { action: "cancelar", agendamentoId: alvo.id } });
    setCancelando(false);
    if (error || data?.error) return toast.error("Não foi possível cancelar. Tente novamente ou fale com o salão pelo WhatsApp.");
    toast.success("Agendamento cancelado.");
    setAlvo(null); void carregar();
  };

  if (checking) return null;

  return (
    <main className="min-h-screen bg-background">
      <section className="container max-w-4xl py-12">
        <Link to="/minha-conta/perfil" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Meu perfil
        </Link>
        <h1 className="font-display text-4xl text-foreground mb-2">Meus agendamentos</h1>
        <p className="text-muted-foreground mb-10">Seus próximos horários marcados, de hoje até dois meses à frente.</p>

        {lista === null ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</div>
        ) : erro ? (
          <p className="text-destructive">{erro}</p>
        ) : lista.length === 0 ? (
          <div className="border border-border rounded-2xl p-8 bg-card text-muted-foreground">
            Você não tem agendamentos nos próximos dois meses. <Link to="/agendamento" className="text-primary underline">Agendar agora</Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {lista.map((a) => {
              const { dia, hora } = fmt(a.dataHoraInicio);
              return (
                <li key={a.id} className="border border-border rounded-2xl p-5 bg-card flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex gap-4">
                    <CalendarClock className="h-6 w-6 text-primary shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-foreground capitalize">{dia} · {hora}</p>
                      <p className="text-sm text-foreground">{a.servico}</p>
                      <p className="text-xs text-muted-foreground">{a.profissional} · NGHair {a.unidadeNome}{a.status ? ` · ${a.status}` : ""}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setAlvo(a)}>
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AlertDialog open={!!alvo} onOpenChange={(o) => !o && !cancelando && setAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>{alvo && `${alvo.servico} — ${fmt(alvo.dataHoraInicio).dia} às ${fmt(alvo.dataHoraInicio).hora}.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Manter</AlertDialogCancel>
            <AlertDialogAction disabled={cancelando} onClick={(e) => { e.preventDefault(); void cancelar(); }}>
              {cancelando ? "Cancelando..." : "Sim, cancelar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default ClienteAgendamentos;
