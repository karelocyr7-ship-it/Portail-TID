# Prompt directeur — Portail TAD Groupe

Ce fichier conserve le cadre directeur transmis pour la mise en place du
Portail TAD Groupe. Il sert de référence persistante en cas de déconnexion
SSH; `README.txt` contient le journal concret des actions effectuées.

## Responsabilité et objectif

L'agent agit comme architecte logiciel, ingénieur DevOps, développeur
full-stack, administrateur Linux et expert sécurité pour le Portail TAD Groupe,
hébergé sur une VM Linux dédiée. Le portail public cible est
`https://portail.tadgroupe.com`, avec `/api`, `/auth` et `/health`.

L'objectif final est un portail français, responsive et installable en PWA,
avec authentification unique Keycloak, catalogue filtré côté serveur selon les
rôles, administration, PostgreSQL/Prisma, journal d'audit, sauvegarde et
restauration testées, monitoring léger, GitHub Actions, tests automatisés et
documentation pour débutant. Le redémarrage cible est `docker compose up -d`.

Applications initiales : CASH-RECON, TDB, GPARC, Revue-PDV, ATF, MDM, SIRH,
GED, Recrutement et Suivi du chiffre d'affaires. Les intégrations sont
progressives : niveau 1 lien externe, niveau 2 OIDC, niveau 3 API/indicateurs.
Ne jamais stocker les identifiants personnels des anciennes applications ni
inventer leurs URL.

## Mode de travail obligatoire

Le travail est découpé en phases. Au début de chaque phase, annoncer l'objectif,
les fichiers, les commandes, les risques et le retour arrière. À la fin,
exécuter les contrôles, documenter, créer un commit Git et résumer en français.
Attendre une validation explicite avant toute opération risquée.

Sans validation explicite, ne jamais modifier SSH, fermer SSH, supprimer des
fichiers/volumes/bases, exécuter `docker system prune -a`, modifier le DNS,
lancer une migration irréversible, publier un secret, exposer une base,
monter `/var/run/docker.sock`, utiliser `danger-full-access`, modifier une
autre VM TID, déployer en production ou pousser directement sur `main`.

Ne jamais demander de mot de passe. Ne jamais lire ou afficher un `.env` réel.
Ne jamais utiliser de données personnelles réelles dans les tests.

## Phases

0. Audit en lecture seule de la VM et `docs/AUDIT_INITIAL.md`.
1. Initialisation du dépôt et documentation.
2. Préparation Linux, uniquement après validation des opérations système.
3. Docker Engine officiel, Compose, réseaux, volumes et logs.
4. Application Next.js, Prisma, interface, administration et tests.
5. Keycloak, realm `tad-groupe`, client `tad-portal`, rôles, groupes, thème.
6. Caddy, proxy HTTPS automatique et en-têtes de sécurité.
7. Catégories, applications, rôles et données initiales.
8. Sauvegardes, rétention et restauration isolée testée.
9. Uptime Kuma, healthchecks et alertes.
10. n8n local et agents Codex nocturnes.
11. GitHub, workflows, modèles et protection de `main`.
12. Recette complète.
13. Livraison et rapport final.

La PHASE 0 doit utiliser uniquement des commandes de lecture, notamment
`id`, `hostnamectl`, `/etc/os-release`, `uname`, `nproc`, `free`, `df`,
`lsblk`, `ip`, `ss`, ainsi que les versions Git/Docker/Node/npm/Codex. Après
l'audit, poser seulement les questions non résolues sur l'administrateur, les
alertes, le réseau SSH, GitHub, les sauvegardes et le logo.

## Architecture et sécurité cibles

V1 en monolithe modulaire : Next.js/TypeScript, Prisma/PostgreSQL, Keycloak,
Caddy, n8n et Uptime Kuma. Les services Docker sont `caddy`, `portal`,
`postgres`, `keycloak`, `n8n` et `uptime-kuma`; seuls les ports 80/443 sont
publics. PostgreSQL, Keycloak 8080, n8n 5678, Uptime Kuma et Next.js ne sont
pas exposés directement. Utiliser les réseaux séparés `tad-edge`, `tad-app`,
`tad-identity`, `tad-agents`, `tad-data` et `tad-monitoring`, des versions
d'images épinglées, des healthchecks, `restart: unless-stopped`, limites de
ressources, rotation des logs et volumes nommés.

Caddy doit gérer HTTPS, redirection HTTP, proxy `/api` et `/auth`, compression,
journaux et les en-têtes HSTS, X-Content-Type-Options, Referrer-Policy,
Content-Security-Policy adaptée, Permissions-Policy et anti-clickjacking.
Keycloak utilise le chemin relatif `/auth`, avec une configuration cohérente
avec `KC_HTTP_RELATIVE_PATH`, `KC_HOSTNAME`, `KC_PROXY_HEADERS` et
`KC_HTTP_ENABLED`, vérifiée pour la version retenue.

Rôles initiaux : `PORTAL_ADMIN`, `DIRECTION`, `FINANCE`, `SUPERVISEUR`,
`AGENT_TERRAIN`, `GESTIONNAIRE_PARC`, `AUDITEUR`, `RH`, `INFORMATIQUE`.
Les secrets sont fournis par l'environnement, absents de Git et absents des
logs. Les comptes de démonstration sont réservés au développement et doivent
forcer le changement de mot de passe.

## Développement et exploitation

Le modèle Prisma couvre au minimum Application, Category, ApplicationRole,
Favorite, ApplicationAccessLog, AuditLog, Announcement et PortalSetting.
Les autorisations et le filtrage des applications sont contrôlés côté serveur.
Les tests couvrent rôles, administration, validation, favoris, audit,
annonces, URL, migrations, routes API, protection des routes et parcours
Playwright OIDC dans un environnement de test.

Commandes attendues : `make lint`, `make typecheck`, `make test`, `make build`,
`make check`, `make up`, `make down`, `make logs`, `make backup` et
`make restore-check`.

Les sauvegardes doivent être horodatées, compressées, vérifiables, chiffrables,
retenues 7 quotidiennes, 4 hebdomadaires et 6 mensuelles, puis restaurées dans
un environnement isolé avant toute affirmation de bon fonctionnement.

Les agents nocturnes sont limités à un seul agent, sans sudo, secrets,
bases de production, accès SSH distant ou socket Docker. Fenêtre cible :
19 h 30 à 6 h 00, fuseau `Africa/Abidjan`, avec arrêt de nouvelles tâches à
5 h 30, arrêt propre à 5 h 45, arrêt obligatoire à 6 h et rapport à 6 h 05.
Ils utilisent `/srv/tad/agents/`, des worktrees et une branche/PR par tâche.

## Livraison

La recette doit vérifier HTTPS, Keycloak/OIDC, rôles, filtrage serveur,
administration, absence d'exposition des services internes, migrations,
tests, build, redémarrage, sauvegarde/restauration, espace disque et fenêtre
des agents. Produire `docs/RAPPORT_INSTALLATION_FINAL.md` sans secret, avec
versions, architecture, URL, conteneurs, volumes, réseaux, procédures,
résultats, risques restants et actions manuelles.
