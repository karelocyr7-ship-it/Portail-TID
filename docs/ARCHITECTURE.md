# Architecture cible

La V1 est un monolithe modulaire : l’interface Next.js, les routes API et le
module d’administration vivent dans une application portail unique.

Caddy publiera uniquement 80/443, puis routera le portail, `/api` et `/auth`.
PostgreSQL restera privé sur les réseaux Docker de données. n8n et Uptime Kuma
resteront non publics.

Les applications métiers seront d’abord des liens externes (niveau 1). Les
niveaux OIDC et API seront ajoutés progressivement, sans stocker de credentials
personnels d’anciennes applications.

Le portail utilise le flux OIDC Authorization Code de Keycloak. Le retour
vérifie côté serveur le `state`, le `nonce`, la signature JWKS, l’issuer,
l’audience et l’expiration de l’ID token. Les claims vérifiés alimentent le
filtrage du catalogue ; les rôles de démonstration restent disponibles
uniquement avec `NODE_ENV=development` pour les tests locaux. Les tokens OIDC
ne sont pas conservés dans le navigateur.

## Compatibilité Android

L’interface web reste responsive et partage avec Android les mêmes tokens
visuels, le logo TAD et les rôles métier. L’application Android future devra
utiliser le flux OIDC Authorization Code avec PKCE et un client public dédié ;
elle ne devra jamais embarquer le secret du client web ni réutiliser le cookie
de session HTTP du portail.

Les API `/api` devront évoluer vers une validation de jetons Bearer séparée de
la session web, tout en réutilisant les mêmes claims `realm_access.roles` et
les mêmes règles de filtrage serveur. Les liens d’applications devront rester
compatibles avec l’ouverture externe contrôlée depuis Android.
