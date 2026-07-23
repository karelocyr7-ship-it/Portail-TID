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

8. Phase 5 — Keycloak/OIDC — 22 juillet 2026
   - Realm `tad-groupe` créé et activé avec le thème `keycloak.v2`.
   - Client confidentiel `tad-portal` configuré avec Authorization Code,
     redirection HTTPS limitée au portail et secret conservé dans `.env`.
   - Les neuf rôles métier et neuf groupes correspondants sont créés.
   - L’accès administrateur Keycloak a été récupéré puis sécurisé avec la
     valeur actuelle de `.env`; le compte de récupération temporaire a été
     supprimé après usage.
   - Découverte OIDC vérifiée via HTTPS; aucun compte utilisateur réel créé.

Prochaine action
----------------

Brancher les claims OIDC au portail et remplacer les rôles de développement
par les rôles Keycloak côté serveur, dans la phase applicative d’intégration.

9. Recette fonctionnelle OIDC — 22 juillet 2026
   - Le portail a été reconstruit avec l’intégration OIDC et le service `portal`
     redémarré sans toucher aux bases ni aux volumes.
   - Les six services Docker sont actifs; PostgreSQL, Keycloak, n8n, Uptime
     Kuma et le portail sont sains.
   - `/health` répond en HTTPS avec HTTP 200.
   - La découverte OIDC Keycloak répond en HTTP 200.
   - `/api/auth/login` redirige vers Keycloak avec un callback HTTPS et un état
     anti-CSRF conservé dans un cookie HttpOnly.
   - Un callback invalide est rejeté en HTTP 400 et l’API sans session renvoie
     un catalogue vide.
   - La VM n’expose publiquement que les ports 80 et 443; les ports internes
     des services ne sont pas publiés.
   - La connexion complète et le filtrage avec un utilisateur nécessitent un
     compte Keycloak de test dédié; aucun compte réel n’a été créé.

10. Phase 8 — sauvegarde et restauration — 22 juillet 2026
    - Les scripts `scripts/backup.sh` et `scripts/restore.sh` sont désormais
      opérationnels; ils n’affichent ni ne lisent le fichier `.env` réel.
    - Une archive chiffrable avec dumps PostgreSQL de `portal`, `keycloak` et
      `n8n`, données n8n/Uptime Kuma, configuration sans `.env`, manifeste et
      sommes SHA-256 a été créée sous `/srv/tad/backups` avec permissions 0600.
    - Le contrôle d’intégrité a réussi.
    - Une restauration isolée des trois bases a réussi dans des bases
      temporaires, ensuite supprimées par le script; aucune base de production
      n’a été écrasée.
    - La destination externe et la rotation 7 quotidiennes, 4 hebdomadaires
      et 6 mensuelles restent à valider avant automatisation.

11. Phase 9 — monitoring et interface de connexion — 22 juillet 2026
    - L’interface affiche désormais un bouton permanent `Se connecter` pour
      les visiteurs et `Se déconnecter` pour les sessions Keycloak.
    - Le bandeau d’accueil propose également l’accès direct à Keycloak.
    - Le portail a été reconstruit et redémarré; le conteneur est sain.
    - Le script `scripts/healthcheck.sh` contrôle les conteneurs, ressources,
      espace disque, endpoint public, certificat HTTPS et sauvegardes récentes.
    - Contrôles réussis : UI publique, redirection OIDC, healthcheck et
      certificat valide jusqu’au 20 octobre 2026.
    - Un conteneur Docker externe à la stack, `trusting_volhard`, a été observé
      mais n’a pas été modifié.

12. Correctif post-login — 22 juillet 2026
    - Une redirection après connexion pouvait utiliser l’adresse interne
      `0.0.0.0:3000` du conteneur Next.js.
    - Les routes callback et logout utilisent désormais exclusivement
      `PORTAL_PUBLIC_URL`; les redirections publiques ont été vérifiées.

13. Phase 10 — n8n et agents Codex — préparation — 22 juillet 2026
    - n8n est sain sur son réseau privé et son endpoint interne `/healthz`
      répond correctement; aucun port n8n n’est publié sur Internet.
    - Les scripts agents et les unités/timers systemd ont été préparés avec un
      seul agent, sans secrets, sudo, base de production ni socket Docker.
    - Les contrôles de syntaxe, le smoke test local et `systemd-analyze verify`
      sont réussis.
    - Aucune unité systemd n’a été copiée ou activée; l’installation système
      reste soumise à validation explicite.

14. Phase 10 — activation systemd — 22 juillet 2026
    - Validation explicite reçue pour installer les unités dans
      `/etc/systemd/system` et activer les cinq timers.
    - Les timers de démarrage, suspension, arrêt propre, arrêt forcé et rapport
      sont actifs dans `Africa/Abidjan`.
    - Le smoke test sous l’utilisateur `tad-agents` ne trouve aucune tâche et
      n’a lancé aucun agent.
    - Les cinq services agents sont inactifs hors exécution planifiée; la stack
      Docker du portail reste saine.

15. Phase 11 — GitHub — préparation — 22 juillet 2026
    - Les workflows Quality, Security et Build exécutent désormais les
      contrôles pnpm, le formatage, l’audit, la détection de secrets et le build
      Docker sans publication.
    - La concurrence GitHub annule les anciens builds de la même branche.
    - Les modèles et labels sont documentés.
    - Aucun remote GitHub n'est configuré et `gh` n'est pas installé; aucune
      création de dépôt, publication ou protection distante n'a été effectuée.

16. Phase 12 — recette complète — 22 juillet 2026
    - La stack, HTTPS, OIDC, les routes publiques, l'exposition réseau, la
      persistance PostgreSQL, la sauvegarde/restauration isolée, les agents et
      l'espace disque ont été contrôlés avec succès.
    - `pnpm format:check`, lint, typecheck, tests (4) et build sont réussis;
      `make` reste indisponible sur la VM.
    - `pnpm audit --prod` signale une vulnérabilité haute dans `sharp` et une
      modérée dans `postcss`; elles sont documentées dans
      `docs/RECETTE_PHASE_12.md`.
    - La validation du filtrage par rôle avec un compte Keycloak de test et la
      configuration distante GitHub restent à faire avant la livraison finale.

Prochaine phase
---------------

Phase 13 : livraison et rapport final, après décision sur les alertes de
dépendances et validation d'un compte de test non personnel.

17. Reprise GitHub — 22 juillet 2026
    - Le dépôt GitHub existe : `karelocyr7-ship-it/Portail-TID`.
    - L'authentification `gh` est active sur le compte
      `karelocyr7-ship-it`; aucun token n'est écrit dans le dépôt.
    - Le remote local est configuré en SSH :
      `git@github.com:karelocyr7-ship-it/Portail-TID.git`.
    - Les changements locaux liés au socle, à la documentation, à la CI, à
      l'infrastructure PostgreSQL et au logo ont été commités dans
      `d9d08d5` (`chore: publier le socle du portail`). Le rapport de recette
      est dans le commit précédent `c0b2e0c`.
    - Aucun fichier `.env` réel n'a été ajouté ou publié.
    - Le premier push SSH a échoué car aucune clé SSH utilisable n'est
      configurée sur la VM. Le remote HTTPS a ensuite été essayé.
    - Le push HTTPS a été refusé par GitHub car le jeton OAuth ne possède pas
      le scope `workflow`, nécessaire pour publier `.github/workflows/*.yml`.
    - Une actualisation de scope a été lancée avec `gh auth refresh -h
      github.com -s workflow`. GitHub a fourni le code temporaire
      `F688-E30B`; l'URL à utiliser est
      `https://github.com/login/device`. La validation dans le navigateur est
      encore attendue. Le code est temporaire et ne doit pas être réutilisé.
    - La branche locale est `codex/phase-1-repository-init`; elle n'a pas
      encore été poussée et aucune Pull Request n'a été créée.

Reprise demain — commandes
--------------------------

Après validation du code GitHub dans le navigateur, vérifier puis exécuter :

```sh
cd /srv/tad/portail
gh auth status
gh auth setup-git
git remote set-url origin https://github.com/karelocyr7-ship-it/Portail-TID.git
git push -u origin codex/phase-1-repository-init
```

Le dépôt GitHub étant vide, créer ensuite la branche de base `main` à partir
du commit initial sans pousser directement sur `main` :

```sh
git rev-parse main
gh api repos/karelocyr7-ship-it/Portail-TID/git/refs \
  -f ref=refs/heads/main -f sha="$(git rev-parse main)"
gh repo edit karelocyr7-ship-it/Portail-TID --default-branch main
```

Enfin créer la Pull Request brouillon :

```sh
gh pr create --draft --base main \
  --head codex/phase-1-repository-init \
  --title "Phase 12 : recette complète" \
  --body-file /tmp/portail-pr.md
```

Le fichier `/tmp/portail-pr.md` devra résumer la recette et référencer
`docs/RECETTE_PHASE_12.md`. Vérifier les workflows et la protection de `main`
sur GitHub avant toute fusion. Ne jamais publier `.env`, de token ou de secret.

18. Reprise VM — agents, Git et compatibilité Keycloak — 23 juillet 2026
    - Reprise effectuée sur la VM `vps-f97dd485`, branche de travail
      `codex/deploy-main-20260723`; aucun fichier `.env` réel n'a été lu ou
      affiché.
    - Les cinq timers systemd des agents sont installés, activés et planifiés
      dans `Africa/Abidjan` : démarrage 19 h 30, arrêt des nouvelles tâches
      5 h 30, arrêt propre 5 h 45, arrêt forcé 6 h et rapport 6 h 05.
    - Les unités systemd et les scripts agents passent les contrôles de
      syntaxe. Les espaces `/srv/tad/agents` restent détenus par
      `tad-agents` en permissions 0750 ; aucun secret ni accès Docker n'est
      fourni aux agents.
    - Git 2.47.3 est disponible, le remote GitHub est joignable et
      l'authentification `gh` dispose des scopes nécessaires `repo` et
      `workflow`. La branche active n'est pas `main`.
    - Le portail, Keycloak et PostgreSQL sont sains. La découverte OIDC du
      realm `tad-groupe` publie un issuer HTTPS et des endpoints cohérents
      sous `/auth`; le flux `/api/auth/login` redirige vers Keycloak avec un
      état anti-CSRF HttpOnly. Aucun token n'a été journalisé.
    - Le client Keycloak `tad-portal` est confirmé confidentiel, avec le flux
      Authorization Code activé, les octrois directs désactivés, l'origine web
      limitée au portail, le callback exact
      `/api/auth/callback` et le retour post-déconnexion exact
      `/api/auth/logout/complete`.
    - Les trois applications du portail sont actives en base et joignables :
      TDB (`https://tdb.tadgroupe.com`), Revue-PDV
      (`https://pdv.tadgroupe.com`) et CASH-RECON
      (`https://cash.tadgroupe.com`). Le service portail a été reconstruit et
      redémarré sans modifier les bases ni les volumes.

Reste à faire après cette reprise
----------------------------------

- réaliser un parcours SSO complet avec un compte Keycloak de test dédié et
  non personnel, puis vérifier le filtrage des trois applications par rôle ;
- confirmer les rôles effectivement attribués à ce compte de test et le
  parcours de déconnexion SSO ; la configuration des URI du client
  `tad-portal` est désormais contrôlée ;
- traiter séparément l'avertissement OpenSSL/Prisma du build et les alertes
  d'audit de dépendances ;
- corriger les trois fichiers signalés par `pnpm format:check` dans une tâche
  dédiée (`apps/portal/app/admin/actions.ts`, `apps/portal/app/admin/page.tsx`
  et `apps/portal/public/logout.css`) ;
- préparer le rapport final et confirmer la stratégie de sauvegarde externe,
  la rotation et le rollback applicatif.

Reprise après coupure réseau Codex
----------------------------------

Depuis `/srv/tad/portail`, vérifier `git status --short --branch`,
`gh auth status`, `docker compose ps` et les cinq timers `tad-agent-*`.
Relire cette section et reprendre au premier point marqué « Reste à faire ».
Ne jamais recréer les secrets, supprimer les volumes ou relancer une migration
sans validation explicite.

19. Diagnostic SSO des trois applications — 23 juillet 2026
    - Le clic depuis le portail ouvre bien les trois applications, mais
      chacune affiche encore sa propre connexion locale.
    - Les bundles publics montrent des mécanismes distincts et indépendants :
      `tdb_perf_token` pour TDB, `pdv_token` pour Revue-PDV et
      `cashReconToken` pour CASH-RECON. Aucune des trois applications ne
      redirige actuellement vers le realm Keycloak `tad-groupe`.
    - Aucun dépôt ni backend TDB, Revue-PDV ou CASH-RECON n'est présent dans
      `/srv` sur cette VM ; seul le dépôt du portail est disponible. Le
      portail ne peut donc pas modifier leurs routes d'authentification,
      leurs APIs ou leurs bases utilisateurs depuis ce checkout.
    - Aucun mot de passe, jeton local ou cookie d'une application n'a été
      transmis par le portail. Un tel relais serait une faille de sécurité et
      ne fournirait pas un SSO valide.

Reste à faire pour supprimer le second login
---------------------------------------------

- fournir les dépôts/backend et le responsable technique de chaque
  application ;
- enregistrer trois clients OIDC Keycloak dédiés, ou un client par application
  selon leur architecture, avec callback et logout propres ;
- remplacer leur authentification locale par Authorization Code côté serveur,
  valider les claims `realm_access.roles` et mapper les rôles existants ;
- décider et tester la correspondance des comptes locaux avec les identités
  Keycloak, sans importer de mots de passe ;
- déployer chaque application via sa procédure, puis tester : portail → TDB,
  portail → Revue-PDV, portail → CASH-RECON, déconnexion et refus par rôle.

Le portail est donc prêt côté Keycloak, mais le SSO complet reste bloqué par
l'absence du code et des backends des trois applications. Après une coupure
réseau, reprendre à ce diagnostic plutôt que modifier les liens ou transmettre
des identifiants.

20. Intégration SSO des applications distantes — 23 juillet 2026
    - Connexion SSH réussie vers `135.125.132.51` (`Revue-PDV`) avec la clé
      locale dédiée ; aucun fichier `.env` n'a été affiché ou copié vers le
      dépôt du portail.
    - Les dépôts TDB-TID, Revue-PDV-PROD et CASH-RECON ont reçu chacun une
      branche et une PR dédiées, puis les changements ont été fusionnés dans
      leurs branches `main` respectives.
    - Trois clients Keycloak confidentiels ont été créés dans `tad-groupe` :
      `tad-tdb`, `tad-revue-pdv` et `tad-cash-recon`. Les callback et retours
      post-déconnexion sont limités aux domaines correspondants.
    - Chaque backend échange désormais le code Authorization Code côté serveur,
      valide la signature JWKS, l'issuer, l'audience, le nonce et l'état CSRF,
      associe l'email Keycloak à un compte applicatif actif et crée une session
      HttpOnly. Les mots de passe locaux ne sont pas transmis par le portail.
    - Les frontends envoient les cookies de session, redirigent les visiteurs
      non authentifiés vers Keycloak et conservent le login local comme secours.
    - Les trois stacks ont été reconstruites et redémarrées sans suppression de
      base ou de volume. Les routes OIDC publiques renvoient HTTP 302 vers le
      même realm ; TDB, Revue-PDV et CASH-RECON renvoient HTTP 200.
    - Tests réussis : TDB 2 tests backend et build frontend ; Revue-PDV 6 tests
      API réussis, 6 ignorés faute de base de test, 3 tests frontend et build ;
      CASH-RECON 22 tests API et build frontend.

Reste à faire après l'intégration SSO
-------------------------------------

- réaliser un parcours navigateur complet avec un compte Keycloak de test non
  personnel dont l'email existe dans les trois bases, puis vérifier l'accès
  par rôle et la déconnexion globale ;
- vérifier les correspondances de rôles métier entre les trois applications,
  car le SSO authentifie l'identité mais conserve les autorisations locales ;
- traiter séparément les alertes npm d'audit et formaliser le rollback par
  reconstruction du commit `main` précédent.

21. Correctif CASH-RECON — 23 juillet 2026
    - Le diagnostic a montré que le bundle CASH-RECON redirigeait bien vers
      `/api/auth/me`, mais conservait volontairement l'écran `/login` lorsque
      la session était absente. Le flux OIDC ne pouvait donc pas démarrer
      depuis le clic du portail.
    - Le frontend redirige désormais automatiquement vers Keycloak lorsqu'il
      n'existe pas de session ; le formulaire local reste accessible
      explicitement avec `?local=1`.
    - Le bundle a été reconstruit avec un nouveau fingerprint et le service
      web CASH-RECON redémarré. L'endpoint OIDC renvoie toujours HTTP 302 vers
      le realm Keycloak.
    - En cas d'ancien bundle conservé par le navigateur ou la PWA, effectuer
      un rechargement forcé ou vider le cache du site avant de retester.
