import { useState } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNghairStaff } from "@/hooks/useNghairStaff";
import { esmaltesTable, hojeISO } from "@/lib/esmaltes";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const toDate = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  if (v instanceof Date) return isNaN(+v) ? null : v.toISOString().slice(0, 10);
  if (typeof v === "number") { const d = XLSX.SSF.parse_date_code(v); return d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : null; }
  const m = String(v).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const m2 = String(v).trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (m2) return `${m2[2]}-${m2[1].padStart(2, "0")}-01`;
  return null;
};
const cap = (s: unknown) => { const t = String(s ?? "").trim(); return t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : null; };

const CargaDados = () => {
  const { checking } = useNghairStaff();
  const [busy, setBusy] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const importar = async (file: File) => {
    setBusy(true); setResultado(null);
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: null });
      const get = (r: Record<string, unknown>, ...keys: string[]) => {
        const k = Object.keys(r).find((c) => keys.some((x) => norm(c).startsWith(x)));
        return k ? r[k] : null;
      };
      const registros = rows.filter((r) => get(r, "etiqueta") != null).map((r) => ({
        etiqueta: Number(get(r, "etiqueta")) || null,
        marca: String(get(r, "marca") ?? "").trim() || null,
        serie: String(get(r, "serie") ?? "").trim() || null,
        cor: String(get(r, "cor") ?? "").trim() || null,
        validade: toDate(get(r, "validade")),
        data_cadastro: toDate(get(r, "data cadastro")) ?? hojeISO(),
        status: cap(get(r, "status")) ?? "Prateleira",
        motivo: cap(get(r, "motivo")),
        data_removido: toDate(get(r, "data removido")),
        unidade: norm(String(get(r, "unidade") ?? "")) === "brooklin" ? "Brooklin" : "Campo Belo",
      }));
      if (!registros.length) throw new Error("Nenhuma linha com a coluna Etiqueta encontrada.");
      const { error: delErr } = await esmaltesTable().delete().not("id", "is", null);
      if (delErr) throw delErr;
      for (let i = 0; i < registros.length; i += 500) {
        const { error } = await esmaltesTable().insert(registros.slice(i, i + 500));
        if (error) throw error;
      }
      setResultado(`${registros.length} esmaltes carregados com sucesso.`);
      toast({ title: "Carga concluída", description: `${registros.length} esmaltes.` });
    } catch (e) {
      toast({ title: "Erro na carga", description: (e as Error).message, variant: "destructive" });
    }
    setBusy(false);
  };

  if (checking) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 space-y-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" />Início</Link>
        <h1 className="font-display text-3xl text-foreground">Carga de Dados</h1>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Prateleira de Esmaltes</h2>
          <p className="text-sm text-muted-foreground">
            Envie a planilha (.xlsx) com as colunas Etiqueta, Marca, Série, Cor, Validade, Data Cadastro, Status, Motivo, Data Removido prateleira e Unidade.
            <strong className="text-foreground"> A carga substitui todos os esmaltes cadastrados.</strong>
          </p>
          <label className="inline-flex">
            <input type="file" accept=".xlsx,.xls" className="hidden" disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f && confirm("Substituir todos os esmaltes pelos da planilha?")) void importar(f); }} />
            <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground cursor-pointer">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Enviar planilha
            </span>
          </label>
          {resultado && <p className="text-sm text-primary">{resultado} <Link to="/nghair/esmaltes" className="underline">Ver prateleira</Link></p>}
        </div>
      </div>
    </div>
  );
};

export default CargaDados;
