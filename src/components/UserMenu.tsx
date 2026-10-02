import { Link } from "react-router-dom";
import { CalendarClock, CalendarPlus, LogIn, LogOut, UserRound } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClienteProfile, clienteLogout } from "@/hooks/useClienteAuth";

const iniciais = (n?: string | null, e?: string) =>
  (n ?? e ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export const UserMenu = ({ className = "" }: { className?: string }) => {
  const { profile, loading } = useClienteProfile();
  if (loading) return null;

  if (!profile) {
    return (
      <Link
        to="/minha-conta/entrar"
        className={cn("inline-flex items-center gap-1.5 rounded-full border border-primary px-5 py-2 font-body text-xs font-semibold uppercase tracking-wider text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary", className)}
      >
        <LogIn className="h-3.5 w-3.5" /> Entrar
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-2 ring-primary/60 transition hover:ring-primary" aria-label="Minha conta">
        <Avatar className="h-9 w-9">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">{iniciais(profile.full_name, profile.email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{profile.full_name ?? "Minha conta"}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/minha-conta/perfil"><UserRound className="h-4 w-4 mr-2" />Meu perfil</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/minha-conta/agendamentos"><CalendarClock className="h-4 w-4 mr-2" />Meus agendamentos</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/agendamento"><CalendarPlus className="h-4 w-4 mr-2" />Agendar horário</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void clienteLogout()} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
