export async function GET(request: Request) {
  const keycloakRevoked =
    new URL(request.url).searchParams.get("state") === "global-revoked";
  const statusText = keycloakRevoked
    ? "La session du portail est fermée et Keycloak a confirmé la révocation des sessions de cet utilisateur. La fermeture des sessions locales dépend aussi de la prise en charge de la déconnexion propagée par chaque application."
    : "La session du portail est fermée, mais la révocation globale Keycloak n’a pas pu être confirmée. Les applications peuvent conserver leur session locale jusqu’à leur expiration ou leur déconnexion.";
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Déconnexion | Portail TID</title><link rel="stylesheet" href="/logout.css"></head><body><main><p class="eyebrow">Portail TID</p><h1>Déconnexion demandée.</h1><p>${statusText}</p><a href="/api/auth/login">Se connecter</a></main></body></html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}
