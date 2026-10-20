# Portail TAD Groupe

Portail centralisé des applications métiers de TID / TAD Groupe.

## Accès cible

- Portail : <https://portail.tadgroupe.com>
- API : <https://portail.tadgroupe.com/api>
- Authentification : <https://portail.tadgroupe.com/auth>
- Santé publique minimale : <https://portail.tadgroupe.com/health>

## État du projet

Relais atomique de première connexion : portail et extension Keycloak 26.6.2
déployés le 18/10 après PR #106–107, contrôles et restauration vérifiée.
Le provisoire SIRH impose le choix d'un mot de passe personnel sans e-mail ;
les mots de passe personnels sont protégés contre les reprises concurrentes.
Chaîne synthétique réelle validée jusqu'à la reconnexion navigateur.
État SIRH, reprise RH, preuves et retour :
[rapport de livraison](docs/infrastructure/sirh-atomic-delivery-20261018.md).

Le socle V1 est opérationnel : monolithe modulaire Next.js/TypeScript avec
PostgreSQL, Prisma, Keycloak, Caddy et Docker Compose. Le flux OIDC du portail
utilise les rôles realm Keycloak pour filtrer le catalogue côté serveur.
Les URL des applications métiers restent configurables et ne sont pas
inventées dans le dépôt.

## Principes non négociables

- aucun secret ou identifiant personnel d’ancienne application dans le portail ;
- filtrage des applications côté serveur selon les rôles Keycloak ;
- aucune modification directe de `main` ;
- aucune exposition publique de PostgreSQL, Keycloak, n8n ou Uptime Kuma ;
- aucune suppression de volume ou de base sans validation explicite ;
- aucune donnée personnelle réelle dans les tests.

## Démarrage prévu

Lorsque la phase Docker sera terminée et validée :

```sh
docker compose up -d
```

Consulter [docs/INSTALLATION.md](docs/INSTALLATION.md) et
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) avant toute opération.
