import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, LogOut, GripVertical, Eye, EyeOff, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  active: boolean;
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    } else {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8 border rounded-2xl bg-card shadow-lg">
        <h1 className="font-display text-2xl font-medium text-center text-foreground">Admin</h1>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
};

const AdminPanel = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState("");
  const { toast } = useToast();
  const [eurofarmaUploading, setEurofarmaUploading] = useState(false);
  const [monthRef, setMonthRef] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [eurofarmaMonths, setEurofarmaMonths] = useState<{ month_ref: string; count: number }[]>([]);

  const fetchEurofarmaMonths = async () => {
    const { data } = await supabase.from("eurofarma_entries").select("month_ref");
    if (!data) return;
    const counts = data.reduce<Record<string, number>>((acc, r) => {
      acc[r.month_ref] = (acc[r.month_ref] || 0) + 1;
      return acc;
    }, {});
    setEurofarmaMonths(
      Object.entries(counts)
        .map(([month_ref, count]) => ({ month_ref, count }))
        .sort((a, b) => b.month_ref.localeCompare(a.month_ref)),
    );
  };

  const parseExcelDate = (v: unknown): string | null => {
    if (!v) return null;
    if (v instanceof Date) {
      return v.toISOString().slice(0, 10);
    }
    if (typeof v === "number") {
      const d = XLSX.SSF.parse_date_code(v);
      if (!d) return null;
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return null;
  };

  const parseTime = (v: unknown): string | null => {
    if (!v) return null;
    if (v instanceof Date) {
      return `${String(v.getHours()).padStart(2, "0")}:${String(v.getMinutes()).padStart(2, "0")}`;
    }
    if (typeof v === "number") {
      const totalMin = Math.round(v * 24 * 60);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return String(v).trim().slice(0, 5);
  };

  const handleEurofarmaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^\d{4}-\d{2}$/.test(monthRef)) {
      toast({ title: "Mês inválido", description: "Use formato AAAA-MM", variant: "destructive" });
      return;
    }
    setEurofarmaUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const sheet =
        wb.SheetNames.find((n) => /lancamentos/i.test(n)) ?? wb.SheetNames[0];
      const ws = wb.Sheets[sheet];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });

      // Find header row containing "Data" and "RE"
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 30); i++) {
        const row = rows[i].map((c) => String(c ?? "").trim().toLowerCase());
        if (row.includes("data") && row.includes("re")) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) throw new Error("Cabeçalho não encontrado");
      const headers = rows[headerIdx].map((c) => String(c ?? "").trim().toLowerCase());
      const idx = (name: string) => headers.indexOf(name.toLowerCase());
      const cols = {
        data: idx("data"),
        hora: idx("hora"),
        profissional: idx("profissional"),
        servico: idx("serviço") !== -1 ? idx("serviço") : idx("servico"),
        cliente: idx("cliente"),
        re: idx("re"),
        valor: idx("valor"),
        rubrica: idx("rubrica"),
      };

      const entries = [];
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.every((c) => c == null || c === "")) continue;
        const re = r[cols.re];
        if (re == null || String(re).trim() === "") continue;
        entries.push({
          month_ref: monthRef,
          data: parseExcelDate(r[cols.data]),
          hora: parseTime(r[cols.hora]),
          profissional: r[cols.profissional] ? String(r[cols.profissional]).trim() : null,
          servico: r[cols.servico] ? String(r[cols.servico]).trim() : null,
          cliente: r[cols.cliente] ? String(r[cols.cliente]).trim() : null,
          re: String(re).trim(),
          valor:
            r[cols.valor] != null && r[cols.valor] !== ""
              ? Number(String(r[cols.valor]).replace(",", "."))
              : null,
          rubrica: r[cols.rubrica] ? String(r[cols.rubrica]).trim() : null,
        });
      }

      // Replace existing month
      await supabase.from("eurofarma_entries").delete().eq("month_ref", monthRef);

      // Insert in chunks
      const chunk = 500;
      for (let i = 0; i < entries.length; i += chunk) {
        const { error } = await supabase
          .from("eurofarma_entries")
          .insert(entries.slice(i, i + chunk));
        if (error) throw error;
      }
      toast({ title: "Importação concluída", description: `${entries.length} lançamentos importados para ${monthRef}.` });
      fetchEurofarmaMonths();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro na importação", description: msg, variant: "destructive" });
    } finally {
      setEurofarmaUploading(false);
      e.target.value = "";
    }
  };

  const deleteEurofarmaMonth = async (month: string) => {
    if (!confirm(`Remover todos os lançamentos de ${month}?`)) return;
    await supabase.from("eurofarma_entries").delete().eq("month_ref", month);
    toast({ title: "Mês removido" });
    fetchEurofarmaMonths();
  };

  const fetchImages = async () => {
    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setImages(data);
  };

  useEffect(() => {
    fetchImages();
    fetchEurofarmaMonths();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("gallery")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);

    const maxOrder = images.length > 0 ? Math.max(...images.map((i) => i.display_order)) : 0;

    const { error: insertError } = await supabase.from("gallery_images").insert({
      image_url: urlData.publicUrl,
      alt_text: altText || "Foto do salão",
      display_order: maxOrder + 1,
    });

    if (insertError) {
      toast({ title: "Erro ao salvar", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Foto adicionada!" });
      setAltText("");
      fetchImages();
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (img: GalleryImage) => {
    // Extract filename from URL
    const parts = img.image_url.split("/");
    const fileName = parts[parts.length - 1];

    await supabase.storage.from("gallery").remove([fileName]);
    await supabase.from("gallery_images").delete().eq("id", img.id);
    toast({ title: "Foto removida" });
    fetchImages();
  };

  const toggleActive = async (img: GalleryImage) => {
    await supabase.from("gallery_images").update({ active: !img.active }).eq("id", img.id);
    fetchImages();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-medium text-foreground">Galeria de Fotos</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Upload area */}
        <div className="border-2 border-dashed border-border rounded-2xl p-6 mb-8 bg-card">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Descrição da foto (opcional)</Label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Ex: Corte moderno feminino"
              />
            </div>
            <div>
              <Label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {uploading ? "Enviando..." : "Adicionar Foto"}
              </Label>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className={`group relative rounded-2xl overflow-hidden border ${
                !img.active ? "opacity-50" : ""
              }`}
            >
              <img
                src={img.image_url}
                alt={img.alt_text}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => toggleActive(img)}
                  title={img.active ? "Ocultar" : "Mostrar"}
                >
                  {img.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(img)}
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate">
                {img.alt_text}
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            Nenhuma foto ainda. Adicione a primeira!
          </p>
        )}

        <div className="mt-16">
          <h2 className="font-display text-2xl font-medium text-foreground mb-4">
            Lançamentos Eurofarma
          </h2>
          <div className="border-2 border-dashed border-border rounded-2xl p-6 mb-6 bg-card">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2">
                <Label>Mês de referência (AAAA-MM)</Label>
                <Input
                  value={monthRef}
                  onChange={(e) => setMonthRef(e.target.value)}
                  placeholder="2026-04"
                  className="w-40"
                />
              </div>
              <div>
                <Label
                  htmlFor="euro-upload"
                  className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {eurofarmaUploading ? "Importando..." : "Importar planilha"}
                </Label>
                <input
                  id="euro-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleEurofarmaUpload}
                  disabled={eurofarmaUploading}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Reimportar o mesmo mês substitui os lançamentos anteriores.
            </p>
          </div>

          {eurofarmaMonths.length > 0 && (
            <div className="space-y-2">
              {eurofarmaMonths.map((m) => (
                <div
                  key={m.month_ref}
                  className="flex items-center justify-between border rounded-lg px-4 py-3 bg-card"
                >
                  <div>
                    <p className="font-medium">{m.month_ref}</p>
                    <p className="text-xs text-muted-foreground">{m.count} lançamentos</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEurofarmaMonth(m.month_ref)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === null) return null;
  if (!session) return <AdminLogin onLogin={() => setSession(true)} />;
  return <AdminPanel />;
};

export default Admin;
