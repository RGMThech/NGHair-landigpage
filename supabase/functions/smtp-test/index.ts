import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

Deno.serve(async (_req) => {
  const pwd = Deno.env.get("SMTP_PASSWORD") ?? "";
  const result: Record<string, unknown> = { passwordSet: pwd.length > 0, passwordLen: pwd.length };
  const client = new SMTPClient({
    connection: {
      hostname: "smtp.hostinger.com",
      port: 465,
      tls: true,
      auth: { username: "contato@nghair.com.br", password: pwd },
    },
  });
  try {
    await client.send({
      from: "NGHair <contato@nghair.com.br>",
      to: "mellrodrigo@gmail.com",
      subject: "Teste SMTP",
      content: "auto",
      html: "<p>Teste de envio SMTP via edge function.</p>",
    });
    result.ok = true;
  } catch (e) {
    result.ok = false;
    result.error = (e as Error).message;
    result.stack = (e as Error).stack;
  } finally {
    try { await client.close(); } catch (_) {}
  }
  return new Response(JSON.stringify(result, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});