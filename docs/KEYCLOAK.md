# Keycloak

## Configuration locale validée

- Realm : `tad-groupe`
- Thème : `keycloak.v2`
- Client : `tad-portal`, confidentiel, flux Authorization Code activé
- Redirection : `https://portail.tadgroupe.com/*`
- Découverte OIDC :
  `https://portail.tadgroupe.com/auth/realms/tad-groupe/.well-known/openid-configuration`
- Groupes métier : `PORTAL_ADMIN`, `DIRECTION`, `FINANCE`, `SUPERVISEUR`,
  `AGENT_TERRAIN`, `GESTIONNAIRE_PARC`, `AUDITEUR`, `RH`, `INFORMATIQUE`.

Le secret du client reste uniquement dans `.env`, protégé en `0600`; aucun
mot de passe ou secret ne doit figurer dans cet export ou dans Git. Les rôles
Les rôles et groupes sont utilisés par le portail pour filtrer le catalogue
côté serveur.

## Flux utilisé par le portail

Le portail démarre le flux Authorization Code via `/api/auth/login`. Le retour
Keycloak arrive sur `/api/auth/callback`, où l’état anti-CSRF, l’issuer,
l’audience et la signature RS256 de l’ID token sont vérifiés côté serveur.
Seuls les claims utiles (`sub`, nom, groupes et rôles realm) sont conservés dans
un cookie HttpOnly signé avec `SESSION_SECRET`. Les tokens OIDC ne sont jamais
renvoyés au navigateur ni écrits dans les logs.

La déconnexion locale utilise `/api/auth/logout`. Le client Keycloak doit
autoriser exactement `${PORTAL_PUBLIC_URL}/api/auth/callback` et le portail doit
être lancé derrière HTTPS.

Le scope client par défaut `roles` doit inclure le mapper realm roles dans
l’ID token et UserInfo (`realm_access.roles`). Sans ce réglage, le rôle
`PORTAL_ADMIN` peut être visible dans l’access token mais absent de la session
du portail, ce qui provoque un refus d’accès à l’administration. Après toute
modification de mapper, l’utilisateur doit se déconnecter puis se reconnecter.
