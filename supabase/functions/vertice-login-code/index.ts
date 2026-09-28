import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD")!;
const SMTP_HOST = "smtp.hostinger.com";
const SMTP_PORT = 465;
const SMTP_USER = "contato@nghair.com.br";
const SMTP_FROM = "NGHair <contato@nghair.com.br>";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const RESEND_INTERVAL_MS = 60 * 1000; // 1 código por minuto por email
const MAX_ATTEMPTS = 5;

async function sendSmtpEmail(to: string, subject: string, html: string, text: string) {
  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: SMTP_USER, password: SMTP_PASSWORD },
    },
  });
  try {
    await client.send({ from: SMTP_FROM, to, subject, content: text, html });
  } finally {
    await client.close();
  }
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function genCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const n = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) >>> 0;
  return String(n % 1_000_000).padStart(6, "0");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const emailHtml = (code: string) => `
  <div style="font-family:Arial,sans-serif;padding:20px 25px;color:#000">
    <h1 style="font-size:22px;margin:0 0 20px">Seu código de acesso Vértice</h1>
    <p style="font-size:14px;color:#55575d;line-height:1.5;margin:0 0 25px">
      Use o código abaixo para entrar no portal Vértice da NGHair. Ele expira em 10 minutos.
    </p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:0 0 25px">${code}</p>
    <p style="font-size:12px;color:#999;margin:30px 0 0">
      Se você não solicitou este código, ignore este email.
    </p>
  </div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { action, email: rawEmail, code: rawCode } = await req.json();
    const email = String(rawEmail ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Email inválido." });
    }

    const { data: authorized, error: authErr } = await admin.rpc("is_vertice_authorized", { email });
    if (authErr) {
      console.error("is_vertice_authorized failed", authErr);
      return json({ error: "Erro ao validar email." }, 500);
    }
    if (!authorized) {
      return json({ error: "not_authorized" });
    }

    if (action === "request") {
      const { data: last } = await admin
        .from("vertice_login_codes")
        .select("created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last && Date.now() - new Date(last.created_at).getTime() < RESEND_INTERVAL_MS) {
        return json({ error: "Aguarde um minuto antes de pedir um novo código." });
      }

      const code = genCode();
      const { error: insErr } = await admin.from("vertice_login_codes").insert({
        email,
        code_hash: await sha256Hex(code),
        expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      });
      if (insErr) {
        console.error("insert code failed", insErr);
        return json({ error: "Erro ao gerar código." }, 500);
      }

      try {
        await sendSmtpEmail(
          email,
          "Seu código de acesso Vértice - NGHair",
          emailHtml(code),
          `Seu código de acesso ao portal Vértice: ${code}\nEle expira em 10 minutos.\nSe você não solicitou, ignore este email.`,
        );
      } catch (e) {
        console.error("smtp send failed", e);
        return json({ error: "Não foi possível enviar o email. Tente novamente." }, 500);
      }

      return json({ ok: true });
    }

    if (action === "verify") {
      const code = String(rawCode ?? "").trim();
      if (!/^\d{6}$/.test(code)) return json({ error: "Código inválido ou expirado." });

      const { data: row } = await admin
        .from("vertice_login_codes")
        .select("id, code_hash, expires_at, attempts, used_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!row || row.used_at || new Date(row.expires_at) < new Date() || row.attempts >= MAX_ATTEMPTS) {
        return json({ error: "Código inválido ou expirado." });
      }

      if ((await sha256Hex(code)) !== row.code_hash) {
        await admin.from("vertice_login_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
        return json({ error: "Código inválido ou expirado." });
      }

      await admin.from("vertice_login_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);

      // Garante que o usuário exista (email já confirmado) e gera um token de
      // magic link sem enviar email; o cliente troca esse token por uma sessão.
      const { error: createErr } = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (createErr && !/already|registered|exists/i.test(createErr.message)) {
        console.error("createUser failed", createErr);
        return json({ error: "Erro ao criar acesso." }, 500);
      }

      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (linkErr || !link?.properties?.hashed_token) {
        console.error("generateLink failed", linkErr);
        return json({ error: "Erro ao iniciar sessão." }, 500);
      }

      return json({ ok: true, token_hash: link.properties.hashed_token });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Erro interno" }, 500);
  }
});
