import { requestPasswordReset } from "@/lib/password-reset";

export const runtime = "nodejs";

function page(message = ""): string {
  const escapedMessage = message
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Mot de passe oublié | Portail TID</title>
    <style>
      :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f5f8fc; color: #10254a; }
      main { width: min(420px, calc(100% - 32px)); padding: 32px; background: #fff; border: 1px solid #dce5f2; border-radius: 16px; box-shadow: 0 10px 28px rgba(6, 47, 112, .08); }
      h1 { margin: 0 0 12px; color: #062f70; font-size: 1.7rem; }
      p { color: #5e6c86; line-height: 1.5; }
      label { display: block; margin: 24px 0 8px; font-weight: 700; }
      input { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #b8c7dc; border-radius: 8px; font-size: 1rem; }
      button { width: 100%; margin-top: 18px; padding: 12px; border: 0; border-radius: 8px; background: #f58216; color: #fff; font-size: 1rem; font-weight: 700; cursor: pointer; }
      .message { margin: 18px 0 0; padding: 12px; border-radius: 8px; background: #edf6ee; color: #215d2a; }
      a { display: inline-block; margin-top: 22px; color: #123f87; }
    </style>
  </head>
  <body>
    <main>
      <h1>Mot de passe oublié</h1>
      <p>Saisissez votre matricule ou votre adresse e-mail. Si le compte existe, un lien de réinitialisation sera envoyé à l’adresse enregistrée.</p>
      ${escapedMessage ? `<p class="message">${escapedMessage}</p>` : ""}
      <form method="post">
        <label for="identifier">Matricule ou adresse e-mail</label>
        <input id="identifier" name="identifier" type="text" autocomplete="username" required maxlength="200">
        <button type="submit">Recevoir le lien</button>
      </form>
      <a href="/api/auth/login">Retour à la connexion</a>
    </main>
  </body>
</html>`;
}

export async function GET(): Promise<Response> {
  return new Response(page(), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const identifier = String(form.get("identifier") ?? "");
  let message =
    "Si un compte correspond, un lien de réinitialisation vient d’être envoyé à l’adresse enregistrée.";

  try {
    await requestPasswordReset(identifier);
  } catch (error) {
    console.error("password_reset_request_failed", error instanceof Error ? error.message : "unknown_error");
  }

  return new Response(page(message), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
