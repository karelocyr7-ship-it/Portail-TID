JOURNAL DE REPRISE — PORTAIL TAD GROUPE
========================================

Ce fichier est un checkpoint lisible après une déconnexion SSH. Il complète
README.md (documentation du projet) et ne contient aucun secret.

État général au 22 juillet 2026
--------------------------------

- Projet : Portail TAD Groupe (TID / TAD Groupe).
- Répertoire : /srv/tad/portail.
- Branche : codex/phase-1-repository-init.
- Dernier commit : 47472de — feat: creer le socle applicatif du portail.
- Phase courante : socle applicatif déjà créé; reprise/validation en attente
  de la prochaine consigne ou validation de phase.
- Fichier non suivi présent avant cette reprise : TAD LOGO.png. Il n'a pas été
  modifié, déplacé ou ajouté au commit.

Consignes persistantes
----------------------

- Lire README.md, docs/ARCHITECTURE.md et SECURITY.md avant toute modification.
- Vérifier git status --short --branch avant toute modification.
- Travailler sur une branche différente de main.
- Ne jamais lire, afficher, copier ou versionner un fichier .env réel.
- Ne jamais publier de secret, modifier directement la production, supprimer
  une base/volume/fichier sans validation, monter le socket Docker ou déployer
  automatiquement.
- Avant chaque phase : annoncer objectif, fichiers, commandes, risques et
  retour arrière.
- Après chaque phase : contrôler, documenter, committer et résumer en français.
- Demander une validation explicite avant toute installation système,
  modification SSH/DNS/pare-feu, migration irréversible ou opération risquée.

Journal des étapes réalisées
----------------------------

1. Reconnexion et état Git
   - Lecture des consignes du dépôt.
   - Commande : git status --short --branch
   - Résultat : branche codex/phase-1-repository-init; TAD LOGO.png non suivi.

2. Lecture de la documentation de référence
   - README.md, docs/ARCHITECTURE.md, SECURITY.md et docs/AGENTS_CODEX.md lus.
   - Aucun fichier .env réel n'a été lu.

3. Vérification du socle existant
   - Le dépôt contient déjà l'application Next.js/TypeScript, Prisma, les
     scripts, Compose et la documentation initiale.
   - Le dernier commit est 47472de.

4. Contrôles qualité du socle
   - make lint/typecheck/test/build : impossibles, car make n'est pas installé.
   - Équivalents pnpm exécutés directement :
     pnpm lint       : RÉUSSI
     pnpm typecheck  : RÉUSSI
     pnpm test       : RÉUSSI (1 fichier, 4 tests)
     pnpm build      : RÉUSSI
   - git diff --check : RÉUSSI.

Point de reprise
----------------

Avant toute nouvelle phase, relire ce journal, vérifier l'état Git et annoncer
la phase. La prochaine action fonctionnelle doit être décidée à partir de la
phase demandée par le responsable; aucune installation ni modification de la
VM n'est autorisée implicitement.

5. Reprise du prompt directeur — 22 juillet 2026
   - Les commits précédents couvrent l'audit initial, la préparation Linux,
     les ressources Docker et le socle applicatif.
   - Docker est installé et disponible : Engine 29.6.2, Compose 5.3.1.
   - `compose.yml` contient actuellement `services: {}` : aucun conteneur n'a
     été démarré par cette reprise.
   - Les réseaux et volumes Docker ont été seulement listés; aucune création,
     suppression ou modification n'a été effectuée.
   - L'application reste un socle de démonstration : les rôles de développement
     sont actifs uniquement en développement et Keycloak/OIDC n'est pas encore
     branché.
   - Les versions déjà documentées sont dans `docs/VERSIONS.md`. Les versions
     d'images restantes doivent être confirmées avant leur usage.
   - La configuration Compose complète a été préparée avec six services,
     images épinglées, limites, healthchecks et réseaux/volumes privés.
   - `docker compose --env-file .env.example config --quiet` : RÉUSSI.
   - La création des ressources Docker a été tentée sans privilèges puis avec
     une demande d'accès administrateur; les deux tentatives ont échoué avec
     `permission denied` sur `/var/run/docker.sock`.
   - Aucun conteneur, réseau ou volume n'a été créé et aucun secret réel n'a
     été généré ou lu.
   - Après correction de l'ACL par l'administrateur, l'accès Docker a été
     vérifié hors isolation Codex; les six réseaux et cinq volumes nommés sont
     présents.
   - Aucun conteneur n'est actuellement démarré.
   - `.env` réel est absent. Le démarrage reste volontairement suspendu pour
     éviter d'utiliser les valeurs fictives de `.env.example` comme secrets.

VALIDATION REQUISE
------------------

La prochaine étape proposée est de préparer puis valider l'infrastructure
Docker de la phase 3/5 : services PostgreSQL, portail, Keycloak, Caddy, n8n et
Uptime Kuma, avec réseaux/volumes privés, healthchecks et images versionnées.
La validation nécessaire avant exécution est l'autorisation de lancer une
commande de type `docker compose up -d`, qui créera des conteneurs et pourra
initialiser des volumes persistants. Aucun port SSH, DNS ou pare-feu ne sera
modifié; aucun volume existant ne sera supprimé.

Prochaine action bloquée
------------------------

Créer un `.env` réel avec des secrets aléatoires, permissions `0600`, et une
adresse e-mail d'administration pour ACME/Caddy. Le fichier ne devra jamais
être affiché, copié ou versionné. Ensuite seulement : `docker compose config
--quiet`, puis `docker compose up -d` et contrôle des healthchecks.

Rollback de ce journal
----------------------

Les ajouts documentaires sont suivis par Git et peuvent être retirés dans une
branche de travail avant commit. Ne pas supprimer de données ni réinitialiser
le dépôt sans validation explicite.

6. Validation de l'infrastructure Docker — 22 juillet 2026
   - Validation explicite reçue pour créer `.env` et démarrer la stack.
   - `.env` réel créé avec des secrets aléatoires, permissions `0600`; il n'est
     ni affiché ni suivi par Git.
   - Corrections de Compose : URL JDBC Keycloak, endpoint healthcheck Keycloak
     sous `/auth`, et transmission de `ACME_EMAIL` à Caddy.
   - Correction du Caddyfile : suppression d'une option `auto_https` invalide.
   - Les mots de passe des rôles PostgreSQL ont été synchronisés avec `.env`
     sans suppression de base ni de volume.
   - L'ancien fichier de configuration n8n a été déplacé en sauvegarde dans le
     volume existant; aucune donnée n8n n'a été supprimée.
   - Les six services sont actifs et sains; HTTPS et `/health` répondent
     correctement.
   - Validations : `docker compose config --quiet` et `git diff --check` :
     RÉUSSIES.

État de reprise suivant
-----------------------

L'infrastructure Docker de la phase 3/5 est démarrée et saine. Les étapes
restantes sont la validation fonctionnelle Keycloak/OIDC et la poursuite de
la phase applicative, selon la prochaine consigne du responsable.

7. Phase 4 — application et persistance — 22 juillet 2026
   - Migration Prisma initiale appliquée dans PostgreSQL via le réseau privé
     `tad-data`.
   - Catalogue de démonstration non sensible chargé dans les tables de
     catégories, applications et rôles.
   - Client Prisma 7 configuré avec l'adaptateur PostgreSQL officiel; le
     catalogue serveur lit désormais PostgreSQL et filtre selon les rôles.
   - Génération Prisma ajoutée à l'étape de build Docker du portail.
   - Contrôles réussis : lint, typecheck, 4 tests Vitest, build, healthcheck
     HTTPS et routes `/health` et `/api/applications`.
   - En production, `/api/applications` renvoie un catalogue vide tant que les
     claims Keycloak ne sont pas branchés; ce comportement est attendu pour la
     transition vers la phase 5.

Prochaine phase
---------------

Phase 5 : créer et configurer le realm Keycloak `tad-groupe`, le client
`tad-portal`, les rôles et les groupes, puis brancher les claims OIDC au
filtrage serveur. Aucun compte de démonstration réel ne devra être ajouté.
