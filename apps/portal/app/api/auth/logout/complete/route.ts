export async function GET() {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Déconnexion | Portail TID</title><link rel="stylesheet" href="/logout.css"></head><body><main><p class="eyebrow">Portail TID</p><h1>Vous êtes déconnecté.</h1><p>La session du portail et la session SSO ont été fermées.</p><a href="/api/auth/login">Se connecter</a></main></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}
