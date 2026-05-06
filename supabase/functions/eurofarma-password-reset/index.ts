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

async function sendSmtpEmail(to: string, subject: string, html: string) {
  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: SMTP_USER, password: SMTP_PASSWORD },
    },
  });
  try {
    await client.send({ from: SMTP_FROM, to, subject, content: "auto", html });
  } finally {
    await client.close();
  }
}

const reToEmail = (re: string) => `re-${re.trim().toLowerCase()}@eurofarma.local`;

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function genToken() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  // 6-digit numeric code
  const n = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) >>> 0;
  return String(n % 1_000_000).padStart(6, "0");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { action, re, personal_email, token, new_password } = await req.json();

    if (action === "request") {
      const cleanRe = String(re ?? "").trim();
      const email = String(personal_email ?? "").trim().toLowerCase();
      if (!cleanRe || !email) {
        return new Response(JSON.stringify({ error: "RE e email são obrigatórios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await admin
        .from("eurofarma_profiles")
        .select("user_id, personal_email, re")
        .eq("re", cleanRe)
        .maybeSingle();

      // Always respond OK to avoid leaking which RE/email exist
      const okResp = new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

      if (!profile || (profile.personal_email ?? "").toLowerCase() !== email) {
        return okResp;
      }

      const code = genToken();
      const tokenHash = await sha256Hex(code);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await admin.from("eurofarma_password_resets").insert({
        user_id: profile.user_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

      // Send via SMTP (Hostinger)
      try {
        await sendSmtpEmail(
          email,
          "Código para redefinir sua senha - NGHair",
          `<p>Olá,</p>
            <p>Use o código abaixo para redefinir sua senha no portal Eurofarma:</p>
            <h2 style="font-family:monospace;letter-spacing:4px">${code}</h2>
            <p>O código expira em 15 minutos.</p>
            <p>Se você não solicitou, ignore este email.</p>`,
        );
      } catch (e) {
        console.error("smtp send failed", e);
      }

      return okResp;
    }

    if (action === "confirm") {
      const cleanRe = String(re ?? "").trim();
      const code = String(token ?? "").trim();
      const newPwd = String(new_password ?? "");
      if (!cleanRe || !code || newPwd.length < 6) {
        return new Response(JSON.stringify({ error: "Dados inválidos" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await admin
        .from("eurofarma_profiles")
        .select("user_id")
        .eq("re", cleanRe)
        .maybeSingle();

      if (!profile) {
        return new Response(JSON.stringify({ error: "Código inválido ou expirado" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenHash = await sha256Hex(code);
      const { data: reset } = await admin
        .from("eurofarma_password_resets")
        .select("id, expires_at, used_at")
        .eq("user_id", profile.user_id)
        .eq("token_hash", tokenHash)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!reset || reset.used_at || new Date(reset.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Código inválido ou expirado" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updErr } = await admin.auth.admin.updateUserById(profile.user_id, {
        password: newPwd,
      });
      if (updErr) {
        console.error("updateUserById failed", updErr);
        const msg = /different from the old/i.test(updErr.message)
          ? "A nova senha precisa ser diferente da senha atual."
          : updErr.message;
        return new Response(JSON.stringify({ error: msg }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await admin.from("eurofarma_password_resets").update({ used_at: new Date().toISOString() }).eq("id", reset.id);
      await admin.from("eurofarma_profiles").update({ must_change_password: false }).eq("user_id", profile.user_id);

      return new Response(JSON.stringify({ ok: true, email: reToEmail(cleanRe) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});