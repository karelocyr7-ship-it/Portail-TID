# Architecture cible

La V1 est un monolithe modulaire : l’interface Next.js, les routes API et le
module d’administration vivent dans une application portail unique.

Caddy publiera uniquement 80/443, puis routera le portail, `/api` et `/auth`.
PostgreSQL restera privé sur les réseaux Docker de données. n8n et Uptime Kuma
resteront non publics.

Les applications métiers seront d’abord des liens externes (niveau 1). Les
niveaux OIDC et API seront ajoutés progressivement, sans stocker de credentials
personnels d’anciennes applications.
