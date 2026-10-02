import { supabase } from "@/integrations/supabase/client";

export type Esmalte = {
  id: string;
  etiqueta: number | null;
  marca: string | null;
  serie: string | null;
  cor: string | null;
  validade: string | null;
  data_cadastro: string;
  status: string;
  motivo: string | null;
  data_removido: string | null;
  unidade: string;
  fotos: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const esmaltesTable = () => (supabase as any).from("esmaltes");

export async function fetchEsmaltes(): Promise<Esmalte[]> {
  const all: Esmalte[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await esmaltesTable().select("*").order("etiqueta", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    all.push(...(data as Esmalte[]));
    if (!data || data.length < 1000) break;
  }
  return all;
}

export const hojeISO = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export const fmtData = (d?: string | null) => (d ? d.slice(0, 10).split("-").reverse().join("/") : "—");
export const fmtValidade = (d?: string | null) => (d ? `${d.slice(5, 7)}/${d.slice(0, 4)}` : "—");

/** vencido | vencendo (até 60 dias) | ok | sem */
export function situacaoValidade(validade: string | null): "vencido" | "vencendo" | "ok" | "sem" {
  if (!validade) return "sem";
  const hoje = hojeISO();
  if (validade < hoje) return "vencido";
  const lim = new Date(hoje); lim.setDate(lim.getDate() + 60);
  return validade <= lim.toISOString().slice(0, 10) ? "vencendo" : "ok";
}

export const UNIDADES = ["Campo Belo", "Brooklin"];
export const MOTIVOS = ["Vencido", "Acabou", "Ficou duro", "Amarelou", "Desaparecido", "Perdido", "Brinde para cliente", "Ninguem usa"];

export const isNghairEmail = (e?: string | null) => /@nghair\.com\.br$/i.test(e ?? "");
