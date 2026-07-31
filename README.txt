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

22. Vérification SSO TDB et Revue-PDV — 23 juillet 2026
    - Les bundles réellement servis par `tdb.tadgroupe.com` et
      `pdv.tadgroupe.com` contiennent le correctif de redirection automatique
      depuis la page de login vers `/api/auth/oidc/start` ; les deux applications
      sont donc alignées avec CASH-RECON.
    - `GET /api/auth/oidc/start` renvoie HTTP 302 vers Keycloak pour TDB et
      Revue-PDV. La configuration OIDC publique de Revue-PDV renvoie
      `oidcEnabled: true` ; le endpoint équivalent de TDB est protégé par la
      session et renvoie HTTP 401 sans cookie, sans empêcher le démarrage OIDC.
    - Aucun redéploiement supplémentaire n'est nécessaire pour ces deux
      applications. Pour le test navigateur, effectuer un rechargement forcé
      afin d'écarter un ancien bundle mis en cache.

23. Correctif Supervision CASH-RECON — 23 juillet 2026
    - La page restait sur `Chargement...` car elle exigeait un jeton local
      `localStorage` alors que le SSO utilise la session HttpOnly du cookie.
    - La condition a été corrigée pour se baser sur l'utilisateur authentifié,
      puis le frontend CASH-RECON a été reconstruit et redéployé avec succès.
    - Vérifications : bundle actif renouvelé, page publique HTTP 200 et
      conteneur `cash-recon-web` relancé correctement.
    - Le correctif est enregistré sur la branche distante
      `codex/oidc-nonce-cash-recon` (commit `ac420cc`). Le fichier généré
      `web/public/build-version.json` reste hors du commit.

24. Vérification session SSO TDB et Revue-PDV — 23 juillet 2026
    - TDB et Revue-PDV ne présentent pas le défaut CASH-RECON : leur code
      d'initialisation n'exige pas la présence d'un jeton local pour utiliser
      la session HttpOnly issuee par le callback OIDC.
    - Les bundles actuellement servis contiennent les appels avec cookies,
      et les deux applications répondent HTTP 200 sur la page principale.
    - `/api/auth/oidc/start` répond HTTP 302 vers Keycloak pour TDB et
      Revue-PDV. Aucun correctif ni redéploiement supplémentaire n'est requis.

25. Vérification HTTPS des trois applications — 23 juillet 2026
    - `https://tdb.tadgroupe.com`, `https://pdv.tadgroupe.com` et
      `https://cash.tadgroupe.com` répondent HTTP 200 sur la page principale.
    - Les trois routes HTTPS `/api/auth/oidc/start` répondent HTTP 302 vers
      Keycloak. Les certificats TLS sont valides jusqu'au 21 octobre 2026.
    - Réserve à traiter séparément : les URLs HTTP ne sont pas uniformément
      redirigées vers HTTPS (TDB et CASH-RECON renvoient 404, Revue-PDV répond
      encore en HTTP). Le portail et les callbacks OIDC utilisent exclusivement
      HTTPS ; aucun impact constaté sur le SSO actuel.

26. Retour vers le portail depuis les applications — 23 juillet 2026
    - Un bouton `Portail` a été ajouté dans le bandeau supérieur de TDB,
      Revue-PDV et CASH-RECON, avec retour vers `https://portail.tadgroupe.com/`.
    - Pour Revue-PDV, le bouton est présent dans les bandeaux administrateur
      et terrain afin de couvrir les deux interfaces.
    - Les trois frontends ont été reconstruits et redémarrés. Vérifications
      live : lien portail présent dans chaque bundle, page HTTPS HTTP 200 et
      conteneurs web opérationnels.
    - Changements versionnés sur les branches dédiées : TDB `a3c8564`,
      Revue-PDV `aeb1f30`, CASH-RECON `3723e0c`.

27. Correctif boucle de connexion Revue-PDV — 23 juillet 2026
    - Le frontend appelait `GET /api/auth/me` pour restaurer la session SSO,
      mais cette route manquait dans l'API et renvoyait HTTP 404, provoquant
      le retour répété vers l'écran de connexion.
    - La route protégée a été ajoutée avec le format de réponse attendu par le
      frontend. Sans cookie elle renvoie désormais HTTP 401, et l'OIDC reste
      activé avec HTTP 200 sur `/api/auth/oidc/config`.
    - L'API et le frontend Revue-PDV ont été reconstruits et redémarrés. Le
      meta-tag mobile moderne a aussi été ajouté pour supprimer l'avertissement
      navigateur non bloquant.
    - Correctif versionné sur `codex/oidc-nonce-revue-pdv`, commit `383e07c`.

28. Intégration OIDC de la VM MDM — 24 juillet 2026
    - La fusion a été confirmée sur `origin/main` avec le commit `8f86902`.
    - Connexion SSH réussie avec l'alias `mdm-tad`, utilisateur `debian`, vers
      la VM Debian 13.6 `cnps` correspondant à `mdm.tadgroupe.com`.
    - Audit : service `hmdm-app` basé sur `headwindmdm/hmdm:0.1.7`, panneau
      HMDM 5.38.1, PostgreSQL persistant et configuration sous
      `/opt/hmdm/config/ROOT.xml`. Aucun `.env` n'a été lu, affiché ou copié.
    - Avant intervention, `/rest/public/oidc/config` et
      `/rest/public/oidc/start` renvoyaient HTTP 404.
    - La source amont HMDM v5.38.1 a été compilée avec l'overlay OIDC du dépôt
      en conservant les protections natives HSTS/JWT de cette version.
    - La compilation Java 8 a échoué sur ActiveMQ en bytecode Java 11; la
      compilation Java 17 a réussi avec Maven, tests HMDM désactivés.
    - WAR déployé : `launcher.war`, SHA-256
      `4215f1df9f1847b13cb5da1dc1df4924b12ce3b8b1d667077ef0ad377e87d2cc`.
    - Client Keycloak confidentiel `tad-mdm` créé/mis à jour dans le realm
      `tad-groupe`, avec callback exact
      `https://mdm.tadgroupe.com/rest/public/oidc/callback` et origine web
      limitée à `https://mdm.tadgroupe.com`. Le secret n'est pas dans Git ni
      dans ce journal.
    - Sauvegarde avant déploiement créée sous
      `/opt/hmdm/work/oidc-backups/20260724T084940Z`, permissions restreintes,
      avec `ROOT.xml` et les WAR courants. Aucun volume ni base n'a été supprimé.
    - Le WAR custom a été placé dans le cache HMDM, copié dans le conteneur,
      puis `hmdm-app` a été redémarré.
    - Vérifications live réussies : accueil HTTP 200; `/rest/public/oidc/config`
      HTTP 200 avec `enabled=true`; `/rest/public/oidc/start` HTTP 303 vers
      Keycloak avec `client_id=tad-mdm`; callback invalide HTTP 400; les trois
      fichiers UI OIDC sont servis en HTTP 200.
    - Le parcours navigateur complet reste à effectuer avec un compte de test
      Keycloak non personnel dont l'e-mail existe déjà dans HMDM. Aucun compte
      réel n'a été créé par cette reprise.

Rollback MDM OIDC
-----------------

En cas de régression, arrêter uniquement `hmdm-app`, restaurer `ROOT.xml` et le
WAR depuis `/opt/hmdm/work/oidc-backups/20260724T084940Z`, recopier le WAR dans
le conteneur, puis redémarrer. Vérifier l'accueil HTTP 200 et consigner le
    résultat. Désactiver ensuite le client Keycloak `tad-mdm` si nécessaire, sans
    exposer son secret.

29. Séparation des domaines MDM et correction auth/options — 24 juillet 2026
    - Clarification confirmée : `mdm.tadgroupe.com` est le domaine SSO via le
      portail; `mdm.tid.atf.onl` est une porte d'accès locale indépendante.
    - Le callback OIDC reste volontairement configuré sur
      `https://mdm.tadgroupe.com/rest/public/oidc/callback`.
    - Le backend OIDC vérifie désormais le hostname : sur `mdm.tadgroupe.com`,
      il renvoie `enabled=true` et autorise `/rest/public/oidc/start`; sur
      `mdm.tid.atf.onl`, il renvoie `enabled=false` et `/start` renvoie 404.
    - Le frontend force le mode local sur tout hostname différent de
      `mdm.tadgroupe.com`; `?local=1` reste accepté comme secours.
    - Le HTTP 500 de `/rest/public/auth/options` venait de la négociation de
      contenu XML par défaut. L'endpoint est maintenant annoté explicitement
      `application/json`, et renvoie HTTP 200 sur les deux domaines.
    - Nouveau WAR déployé : SHA-256
      `bdbede721b8f741ef4607d217a517af8db8aa88b54647d8e288f8d069bf33498`.
    - Sauvegarde avant ce correctif :
      `/opt/hmdm/work/oidc-backups/20260724T091106Z` (WAR et `ROOT.xml`,
      permissions restreintes). Aucun volume ni base n'a été supprimé.
    - Vérifications live : les deux accueils HTTP 200; ATF `config=false` et
      `start=404`; TAD `config=true` et `start=303`; `auth/options=200` en
      requête sans en-tête Accept; conteneur `hmdm-app` actif.

30. Correctif boucle post-callback OIDC — 24 juillet 2026
    - Le diagnostic de la boucle a montré que le callback créait correctement
      la session HTTP serveur, mais pas le cookie de profil `user` attendu par
      l'application Angular pour considérer l'utilisateur connecté.
    - Le callback pose désormais un cookie de session `user` contenant
      uniquement `UserView` (profil HMDM sans mot de passe ni token), avec les
      attributs `Secure` et `HttpOnly=false` nécessaires à Angular. Le token
      OIDC reste côté serveur et n'est pas placé dans le cookie.
    - Nouveau WAR déployé : SHA-256
      `a57364227b8356fbbcd749324bdd2d8eb8fda4658adf0d22533efae680eda6b8`.
    - Sauvegarde avant redémarrage : dossier le plus récent sous
      `/opt/hmdm/work/oidc-backups/` avec `ROOT.xml.before-session-fix` et
      `ROOT.war.before-session-fix`, permissions restreintes.
    - Vérifications live après redémarrage : TAD `config=true`, `start=303`,
      accueil HTTP 200; ATF `config=false`, `start=404`, accueil HTTP 200;
      `auth/options=200` sur les deux domaines; conteneur `hmdm-app` actif.
    - Un parcours navigateur complet avec un compte de test non personnel
      reste recommandé pour confirmer le callback réel et la déconnexion.

31. Correctif cookie OIDC invalide et rotation du jeton utilisateur — 24 juillet 2026
    - Le compte fourni `c.navarre@atf.onl` a été retrouvé dans HMDM; le rejet
      ne venait donc pas d'une absence de compte.
    - Les logs Tomcat ont montré que le cookie `user` était rejeté car le JSON
      brut contenait des guillemets, et qu'il exposait le champ `authToken`.
    - Le callback encode désormais la valeur du cookie et retire `authToken`;
      le cookie ne contient que le profil nécessaire à Angular. Aucun token
      OIDC n'est envoyé au navigateur.
    - Le jeton HMDM précédemment exposé dans un cookie invalide a été renouvelé
      pour le compte concerné; sa nouvelle valeur n'a pas été affichée ni
      journalisée.
    - Nouveau WAR déployé : SHA-256
      `487d9faeb220d745553711045c187b53dfd68dd3ee582f51bce1ec2a34687232`.
    - Sauvegarde avant redémarrage : dossier le plus récent sous
      `/opt/hmdm/work/oidc-backups/` avec `ROOT.xml.before-cookie-fix` et
      `ROOT.war.before-cookie-fix`.
    - Vérifications live : TAD `config=true`, `options=200`, accueil 200;
      ATF `config=false`, `options=200`, accueil 200; `hmdm-app` actif.

32. Installation Recrutement Telco & OM sur la VM MDM — 25 juillet 2026
    - La VM MDM est joignable via l'alias SSH `mdm-tad` et correspond à
      l'hôte `cnps`.
    - Le répertoire réel d'installation est
      `/home/debian/RECRUT_OM` (et non `Recut_OM`).
    - L'application est déployée depuis la branche `agent/step-0`, commit
      `bf9453e` (`docs: define MDM deployment procedure`). Le dépôt distant
      est propre au moment du contrôle.
    - Le fichier `.env` réel est présent avec les permissions `0600`; son
      contenu n'a pas été lu, affiché, copié ni consigné.
    - La configuration Compose est valide. Les services `web`, `api`,
      `worker` et `db` sont démarrés depuis environ trois heures.
    - `recrut-om-web-1`, `recrut-om-api-1` et `recrut-om-db-1` sont sains;
      `recrut-om-worker-1` est actif sans healthcheck dédié. Aucun redémarrage
      ni erreur récente n'a été détecté.
    - Les contrôles HTTP locaux sont réussis : `/api/health` et `/api/ready`
      renvoient HTTP 200; la page web renvoie HTTP 200.
    - Le web écoute uniquement sur `127.0.0.1:8090`; aucun accès public,
      DNS ou reverse-proxy n'est encore configuré pour cette application.
    - Le volume PostgreSQL `recrut-om_telco-db-data` existe. Aucun volume,
      base ou fichier n'a été supprimé ou modifié pendant ce contrôle.

Reste à faire pour Recrutement Telco & OM
------------------------------------------

- Configurer le reverse-proxy et le nom DNS public après validation du
  domaine retenu.
- Créer et configurer le client Keycloak `tad-recrut-om`, puis valider le
  parcours SSO avec un compte de test non personnel.
- Implémenter et tester les traitements métier OCI/Telegram, actuellement
  absents du squelette de phase 0.
- Exécuter les tests fonctionnels complets, définir la sauvegarde de la base
  et formaliser le rollback.

Consigne permanente de reprise Codex
-------------------------------------

Toute action concernant Recrutement Telco & OM, la VM MDM ou le portail doit
être consignée dans ce fichier `README.txt` avant la fin de la session. Chaque
entrée doit indiquer la date, l'objectif, la VM et le répertoire concernés,
les commandes ou contrôles effectués sans secret, les résultats, les fichiers
ou services modifiés, les risques, le rollback et les points restant à faire.
Après chaque reconnexion ou coupure Codex, relire ce journal, vérifier
`git status --short --branch` et reprendre au dernier point documenté. Ne
jamais consigner de secret, mot de passe, token, clé privée, contenu de `.env`
réel ou donnée personnelle. Pour permettre la reprise après une déconnexion de
Codex ou de SSH, consigner également le texte intégral de chaque prompt
utilisateur, dans l'ordre de réception, avec la réponse ou l'action associée,
en masquant tout secret ou donnée personnelle éventuelle. Si le prompt est
long, le conserver dans une entrée dédiée du journal plutôt que le résumer.

Règle d’accès permanente TDB — La VM TDB est la même VM que Revue-PDV et
CASH-RECON : `135.125.132.51`, alias SSH `Revue-PDV`, utilisateur `debian`,
répertoire TDB `/home/debian/TDB-TID`. Toute installation npm, synchronisation,
mise à jour ou déploiement TDB doit être exécuté directement sur cette VM via
cet accès ; ne pas traiter un clone local comme environnement de production.
Si l’alias SSH échoue, vérifier la résolution ou la configuration de l’alias
avant de conclure que la VM est inaccessible.

33. Préparation publication `recrut-oci.tadgroupe.com` — 25 juillet 2026
    - Objectif : préparer la publication du socle Recrutement Telco & OM.
    - VM/répertoire : VM MDM `cnps`, `/home/debian/RECRUT_OM` ; aucune
      configuration de production n'a été modifiée.
    - Le DNS `recrut-oci.tadgroupe.com` résout vers `91.134.255.77`.
    - Le service web local écoute sur `127.0.0.1:8090`; `/api/health` local
      renvoie HTTP 200. Le domaine public répondait auparavant sur le vhost
      Nginx par défaut et `/api/health` public renvoyait HTTP 404.
    - Le modèle versionné
      `integrations/telco-automation/deploy/nginx-recrut-oci.conf` publie
      uniquement `127.0.0.1:8090`, force HTTPS et ajoute des en-têtes de
      sécurité. La procédure est documentée dans
      `integrations/telco-automation/docs/DEPLOYMENT.md`.
    - `docker compose --env-file .env.example config --quiet` a réussi.
      Les tests Compose n'ont pas pu démarrer, l'accès au socket Docker étant
      indisponible dans l'environnement Codex; `pytest` n'est pas installé
      localement. Aucune installation n'a été effectuée.
    - Risques : publication avant fusion dans `main`, certificat ACME absent,
      et OIDC non implémenté dans le squelette phase 0.
    - Rollback : restaurer le vhost Nginx sauvegardé, vérifier `nginx -t` puis
      recharger Nginx; ne supprimer aucun certificat, volume ou base.
    - Reste à faire : revue/fusion de la branche, installation du vhost,
      émission ACME, contrôles HTTPS, puis phase applicative OIDC et client
      Keycloak `tad-recrut-om`.

34. Publication HTTPS Recrutement OCI — 25 juillet 2026
    - Objectif : déployer la version fusionnée et publier
      `recrut-oci.tadgroupe.com`.
    - VM/répertoire : VM MDM `cnps`, `/home/debian/RECRUT_OM`.
    - Les PR Telco et portail ont été fusionnées dans `main`. L’archive du
      commit fusionné `4bf0b11826c14f0f82d61e35aa65779192a27430` a été
      appliquée sur la VM sans lire ni transférer le `.env` réel.
    - Sauvegardes créées :
      `/home/debian/RECRUT_OM.rollback-20260725182137.tar.gz` et
      `/home/debian/nginx-recrut-oci-20260725182235.tar.gz`.
    - Les images Compose ont été reconstruites; `api`, `web`, `worker` et
      `db` sont actifs et sains. Les endpoints locaux `/api/health` et
      `/api/ready` renvoient HTTP 200.
    - Le vhost Nginx a été installé, le certificat ACME émis et Nginx
      rechargé. Le certificat `recrut-oci.tadgroupe.com` expire le
      23 octobre 2026; le timer Certbot est actif.
    - Contrôles publics réussis : HTTP 301 vers HTTPS, HTTPS `/api/health`
      HTTP 200 avec `{"status":"ok","service":"telco-api"}`, et
      en-têtes `X-Content-Type-Options`, `X-Frame-Options`,
      `Referrer-Policy` et `Permissions-Policy` présents.
    - Risques restants : OIDC/Keycloak n’est pas implémenté dans la phase 0;
      aucun parcours SSO ne doit encore être exigé.
    - Rollback : restaurer le vhost depuis la sauvegarde, exécuter
      `nginx -t`, recharger Nginx; pour l’application, restaurer l’archive
      `/home/debian/RECRUT_OM.rollback-20260725182137.tar.gz` sans supprimer
      le volume PostgreSQL ni le certificat.
    - Reste à faire : implémenter et valider la phase applicative OIDC/
      Keycloak et les traitements métier OCI/Telegram.

35. Phase 1 validation OIDC Telco — 25 juillet 2026
    - Objectif : ajouter la validation serveur des Bearer tokens Keycloak
      sans déployer cette phase en production.
    - Dépôt/branche : dépôt `RECRUT-OM`, branche `agent/oidc-phase-1`, PR #2.
    - L’API découvre l’issuer et les JWKS depuis `OIDC_ISSUER`, accepte
      uniquement RS256 et vérifie signature, issuer, audience, `iat`, `exp`
      et `sub`. `/profile` est protégé; `/health` et `/ready` restent publics.
    - Les rôles realm `realm_access.roles` peuvent être filtrés par
      `OIDC_REQUIRED_ROLES`. Aucun secret ni contenu du `.env` réel n’a été
      lu ou consigné.
    - Contrôles : configuration Compose réussie, 5 tests API réussis, builds
      API/web/worker réussis et `git diff --check` réussi.
    - Risques/limites : le parcours navigateur Authorization Code + PKCE et
      la création effective du client Keycloak restent à réaliser; la PR ne
      doit pas être déployée avant revue et fusion.
    - Rollback : ne pas déployer la PR; si elle est déployée ultérieurement,
      restaurer l’archive applicative précédente sans supprimer le volume
      PostgreSQL ni les certificats.

36. Phase 2 SSO navigateur Telco — 25 juillet 2026
    - Objectif : ajouter le flux navigateur Authorization Code + PKCE au
      frontend Telco, sans déploiement production.
    - Dépôt/branche : dépôt `RECRUT-OM`, branche `agent/oidc-phase-1`, PR #3.
    - Le frontend utilise la découverte OIDC HTTPS, vérifie `state` et
      `nonce`, échange le code sans secret client, appelle `/api/profile` et
      propose le logout fournisseur. Le Bearer token reste uniquement en
      mémoire JavaScript; les données de transaction sont temporaires dans
      `sessionStorage`.
    - Les paramètres publics `WEB_OIDC_ISSUER`, `WEB_OIDC_CLIENT_ID`,
      `WEB_OIDC_REDIRECT_URI` et `WEB_OIDC_SCOPE` sont documentés. Aucun
      secret client ni contenu du `.env` réel n’a été lu ou consigné.
    - Contrôles : configuration Compose réussie, build frontend Vite réussi
      et `git diff --check` réussi.
    - Risques/limites : le client Keycloak public, ses redirect URI exactes et
      le test SSO avec un compte non personnel restent à configurer; la PR ne
      doit pas être déployée avant revue, fusion et recette.
    - Rollback : ne pas déployer la PR; sinon restaurer l’image applicative
      précédente et conserver les volumes et certificats existants.

37. Registre permanent des accès et applications — 26 juillet 2026
    - Cette section fait foi pour reprendre les opérations sans redemander les
      hôtes déjà connus. Elle ne contient aucun mot de passe, token ou clé.
    - VM Portail : `54.37.11.202`. Dépôt : `/srv/tad/portail`; stack pilotée
      depuis ce répertoire avec `sudo docker compose`.
    - VM MDM / Recrutement OCI : `91.134.255.77`, alias SSH `mdm-tad`, dépôt
      `/home/debian/RECRUT_OM`; services Compose : `api`, `web`, `db`, `worker`.
    - VM Revue-PDV / CASH-RECON / TDB : `135.125.132.51`, alias SSH
      `Revue-PDV`, dépôt TDB : `/home/debian/TDB-TID`.
    - TDB public : `https://tdb.tadgroupe.com`; santé :
      `https://tdb.tadgroupe.com/api/health`.
    - Keycloak : VM Portail, chemin `/auth`, realm `tad-groupe`. Client de
      service TDB : `tad-oci-tdb-ingestion`; rôle : `TDB_INGEST`. Le secret
      est installé uniquement sur la VM MDM dans
      `/home/debian/tad-oci-tdb-ingestion.secret`, avec permissions restreintes.
      Ne jamais afficher, copier dans Git ou inscrire son contenu ici.
    - L’API TDB expose `POST /api/integrations/performances`, protégé par le
      jeton Keycloak du client de service. OCI publie ses agrégats anonymisés
      de Juin 2026 automatiquement depuis le résumé; une indisponibilité du
      TDB ne bloque pas l’interface OCI.
    - Branche TDB : `codex/oci-tdb-ingestion`, commit `9b038c5`. Tests backend,
      validations Compose et builds TDB/OCI réussis.
    - Reprise : vérifier `git status --short --branch`, utiliser les alias
      `mdm-tad` et `Revue-PDV`, puis contrôler `sudo docker compose ps` et les
      endpoints `/health`. Ne jamais chercher les secrets dans un `.env` réel.

38. Synchronisation TDB multi-applications — 26 juillet 2026
    - Un collecteur central est installé sur la VM TDB/Revue-PDV/CASH-RECON
      (`135.125.132.51`) dans `/home/debian/tdb_sync.py`.
    - Il lit uniquement les agrégats nécessaires dans les bases MariaDB des
      conteneurs `pdv-prod-db` et `cash-recon-db`, sans lire les données
      individuelles ni exposer les identifiants de base.
    - Il obtient un jeton Keycloak `client_credentials` avec le client de
      service `tad-oci-tdb-ingestion`, puis publie les KPI vers
      `POST https://tdb.tadgroupe.com/api/integrations/performances`.
    - Revue-PDV publie : PDV référencés/actifs, visites du jour, tournées
      approuvées et tournées en attente.
    - CASH-RECON publie : collecte totale, E-Recharge, Orange Money, besoin
      cash, zones traitées/équilibrées et écarts détectés.
    - Fréquence : toutes les heures, avec un premier passage 2 minutes après
      le démarrage de la VM et rattrapage après interruption.
    - Un verrou `flock` empêche deux synchronisations simultanées. Le service
      est `tdb-sync.service` et le timer `tdb-sync.timer`.
    - Chaque KPI conserve désormais les détails de collecte : source, champ,
      agrégation, unité, période, date observée, valeur brute, horodatage et
      requête SQL ; ces détails sont transmis dans le commentaire de la ligne.
    - Vérification : `systemctl status tdb-sync.timer` puis
      `sudo journalctl -u tdb-sync.service -n 30 --no-pager`.
    - Le dernier test a publié 12 KPI : 5 Revue-PDV et 7 CASH-RECON pour
      `2026-07`. Aucun secret n’est documenté dans ce fichier.

40. Restauration fidèle de la météo issue du classeur compteur — 26 juillet 2026
    - Objectif : remplacer la synthèse calculée générique par la météo
      d’origine issue de la feuille `Tableau de bord` du fichier
      `Tableau_de_Bord_Meteo_T2_2026_AVRIL_compteurs.xlsx`.
    - Les seules données intégrées sont les 28 compteurs de cette feuille :
      paires mensuelles/trimestrielles, seuils N1 et statuts. Les feuilles
      nominatives du classeur n’ont pas été transférées.
    - Dépôt/branche : TDB, `codex/restore-original-meteo-counters`, PR #12,
      fusionnée dans `main` au commit `0643378`.
    - Contrôles : 2 tests backend, build frontend et `git diff --check`
      réussis. Avertissement de taille du bundle frontend non bloquant.
    - Déploiement : stack TDB reconstruite avec Docker Compose; `/api/health`
      HTTP 200, page HTTPS publique HTTP 200, frontend et backend actifs.
    - Vérification du bundle actif : titre `TABLEAU DE BORD — COMPTEURS`,
      moyenne `44,9 %`, `1 / 28`, `17` alertes et compteur trimestriel présents.
    - Rollback : reconstruire le commit `c3d92c9` précédent, sans supprimer
      les volumes ni les données persistantes.

41. Nettoyage des tuiles applicatives et icônes VM — 26 juillet 2026
    - Prompt utilisateur : supprimer la notion « Niveau 1 » des tuiles du
      portail et reprendre les vraies icônes des applications depuis les VM.
    - Cause : `integrationLevel` est un champ technique du catalogue; toutes
      les entrées statiques sont actuellement au niveau 1 car elles ouvrent
      des applications externes. Ce champ n'est plus affiché aux utilisateurs.
    - Branche de travail : `codex/remove-integration-level-icons`.
    - Icônes récupérées par SSH, sans lire de fichier `.env` : CASH-RECON et
      TDB depuis `135.125.132.51`; Revue-PDV depuis `135.125.132.51`; GPARC,
      MDM et Recrutement depuis `91.134.255.77`.
    - ATF, SIRH et GED restent sur leurs assets existants faute de logo
      applicatif identifiable dans les répertoires inspectés; aucune image
      générique n'a été substituée.
    - Modification : suppression du badge « Niveau N » et mise à jour des
      chemins PNG/SVG dans `apps/portal/lib/application-icons.ts`.
    - Contrôles : lint et tests réussis (7 tests). Typecheck et build bloqués
      par des erreurs TypeScript préexistantes dans l'administration et
      `catalog-db.ts`, sans erreur signalée dans les fichiers modifiés.

42. Correction du build et audit Git des VM — 26 juillet 2026
    - Prompt utilisateur : « corrige les erreurs : Le build reste bloqué par
      des erreurs TypeScript préexistantes dans l’administration du portail.
      verifie que les depots git sont bien à jour sur chaque vm et
      applications ».
    - Cause du build : les liens locaux `node_modules` utilisaient Prisma
      6.19.0 alors que `pnpm-lock.yaml` verrouille Prisma 7.9.0. Les types
      Prisma devenaient `any`, provoquant les erreurs implicites de
      l’administration. Réalignement avec `pnpm install --frozen-lockfile`
      puis `prisma generate`; aucune modification du lockfile.
    - Contrôles portail : typecheck, lint, 7 tests et build Next.js réussis.
    - Audit VM `135.125.132.51` : CASH-RECON a 1 modification locale et son
      fetch GitHub est bloqué par une clé SSH configurée vers un chemin
      inaccessible; Revue-PDV est à 0 avance/retard sur sa branche distante
      mais possède 46 éléments locaux; TDB possède 6 éléments locaux et sa
      branche `codex/modernize-dashboard-kpi` n'a pas de branche distante.
    - Audit VM `91.134.255.77` : le clone Android Traccar est synchronisé et
      propre; son clone Flutter est en retard de 99 commits et modifié
      localement; Recrutement possède 20 éléments locaux et son remote HTTPS
      demande une authentification non disponible. Les dépôts sans remote
      exploitable n'ont pas été déclarés à jour par approximation.
    - Aucun pull, reset, suppression, écrasement de fichier ou lecture de
      secret n'a été effectué.

43. Vérification des montants KPI et des alimentations applicatives — 26 juillet 2026
    - Prompt utilisateur : « sur le portail je ne vois pas les montants dans
      le details des kpi, pas de data CAsh-Recon ni de Gparc,.. verifie tout
      ça ».
    - Le portail principal (`/`) ne contient actuellement que le catalogue
      des applications; les KPI et leur modal sont dans TDB.
    - Vérification de la base TDB en lecture seule : CASH-RECON contient 7
      lignes `excel_import`, réalisées mensuelles cumulées `505232586`, mise
      à jour le `2026-07-26 17:54:44`; Revue-PDV contient 5 lignes et
      Recrutement OCI 10 lignes. Les montants sont présents dans les champs
      `monthly_realized` et sont rendus par le bundle publié dans la synthèse
      et le détail des catégories.
    - Limitation actuelle : les imports automatiques publient des objectifs
      nuls (`monthlyTarget: null`), donc les taux et objectifs sont affichés
      comme non renseignés; les montants réalisés restent disponibles.
    - GPARC n'apparaît ni dans les indicateurs TDB ni dans le collecteur
      `/home/debian/tdb_sync.py`; aucun service GPARC actif n'a été trouvé sur
      les VM inspectées. Aucune donnée GPARC ne peut donc être affichée sans
      définir sa source et son connecteur.
    - Vérification publique : `https://tdb.tadgroupe.com/api/health` répond
      HTTP 200; le bundle actif contient bien les libellés Objectif, Réalisé,
      Écart et le détail des KPI.

44. Correction d'affichage des dernières données dans les onglets TDB — 26 juillet 2026
    - Prompt utilisateur : « recutement OCI à des data issues des fichiers
      injecter et je ne vois rien dans Cash-recon resout le problème chaque
      onglet doit afficher les dernières data à disposition ».
    - PR TDB #13 fusionnée dans `main` au commit `7903df9`.
    - Les onglets applicatifs affichent désormais un bloc `Données reçues`
      avec total réalisé, objectif, source, date de mise à jour et les 12
      dernières lignes disponibles; les objectifs absents ne masquent plus
      les montants réalisés.
    - Le rafraîchissement horaire et le choix automatique de la dernière
      période disponible sont conservés.
    - Déploiement frontend effectué via un worktree de livraison temporaire,
      sans recréer ni supprimer le volume TDB; frontend et backend sont actifs.
    - Vérifications : API health HTTP 200 et bundle public contenant le bloc
      `Données reçues`, `Réalisé` et `Objectif`.
    - Les fichiers Recrutement OCI ne sont toujours pas présents dans le
      stockage de la VM source; l'onglet affiche donc la dernière publication
      disponible tant que le dépôt effectif des fichiers n'est pas réalisé.

45. Restauration des KPI métiers dans la météo TDB — 26 juillet 2026
    - Prompt utilisateur : « sur TDB je ne retrouve plus les kpi metiers sur
      TDB dans la meteo ».
    - PR TDB #15 fusionnée dans `main` au commit `63724d8`.
    - La page Météo interroge désormais l'API TDB et affiche les catégories
      métier avec réalisé, objectif, écart, nombre de KPI et dernière mise à
      jour, sans supprimer les compteurs météo du classeur.
    - Rafraîchissement automatique horaire activé pour cette synthèse.
    - Déploiement frontend effectué; bundle public `index-YgPNVT1F.js`, API
      health HTTP 200, frontend et backend actifs.
    - Base confirmée après déploiement : CASH-RECON 7 lignes, Recrutement OCI
      10 lignes, Revue-PDV 5 lignes.

46. Préparation intégration GParc — 27 juillet 2026
    - Prompt utilisateur : « maintenant tu va integrer GParc sur la vm
      51.91.102.44 dans /home/debian/gparc-prod commence par me donner les
      commandes pour que tu puisse y acceder en ssh ».
    - Précision utilisateur : « sur quel vm je rentre les commande et ou je
      trouve la clef ssh ?? ».
    - Autorisation utilisateur : « fait le pour moi ».
    - Nouvelle consigne utilisateur : « avant liste moi en quoi consiste
      l'integration de GParc ».
    - Consigne de reprise : « n'oublie d'enrichir le fichier README.txt afin
      de ne pas pendre le fil du contexte ou tu te sera arreter en cas de
      coupure reseaux ».
    - VM cible : `51.91.102.44`, hôte identifié `gparc`, utilisateur `debian`,
      répertoire `/home/debian/gparc-prod` présent.
    - Accès SSH depuis la VM portail `vps-f97dd485` validé avec la clé locale
      `id_ed25519_tad_vm`; aucun secret ni contenu de clé privée n'a été lu,
      affiché ou consigné.
    - Aucun fichier, service, dépôt ou base de GParc n'a encore été modifié.
    - Périmètre prévu : préparation Git, installation/configuration de l'agent
      non privilégié, audit de l'application, catalogue portail, client OIDC
      Keycloak, rôles, éventuelle alimentation KPI, déploiement, tests et
      rollback documenté.
    - L'installation système de Git ou de l'agent, la création d'unités
      systemd, l'ajout d'un client Keycloak et tout déploiement nécessitent
      une validation explicite avant exécution si une modification système ou
      une action risquée est requise.
    - Prochaine action : auditer sans modification `/home/debian/gparc-prod`,
      vérifier Git, l'état du dépôt, les services, les ports, les healthchecks,
      la procédure de déploiement et la présence éventuelle de `.env` sans
      jamais lire ni afficher un `.env` réel.
    - Rollback : aucune action applicative réalisée à ce stade; les contrôles
      d'audit sont en lecture seule.

47. Règle Git GParc — 27 juillet 2026
    - Prompt utilisateur : « attention d'utiliser le git de la vm gparc et
      pas du portail ».
    - Toute opération Git relative à GParc doit être exécutée sur la VM
      `51.91.102.44` (`gparc`), dans `/home/debian/gparc-prod`.
    - Le dépôt `/srv/tad/portail` ne doit servir qu'aux modifications du
      portail et à leur journalisation documentaire; ne pas y cloner, tirer,
      committer ou pousser le dépôt GParc.
    - Avant toute opération Git GParc : vérifier localement sur la VM cible
      `git status --short --branch`, le remote et la branche active, sans lire
      de `.env` réel.
    - Aucun dépôt GParc n'a encore été modifié par cette reprise.

48. Audit initial GParc — 27 juillet 2026
    - Prompt utilisateur : « tu peux maintenant demarrer l'intégration ».
    - Audit exécuté en lecture seule sur `gparc` dans
      `/home/debian/gparc-prod`; aucun `.env` réel n'a été lu ou affiché.
    - GParc est actif sous Docker Compose : `api`, `db`, `nginx` et `web`
      (avec Certbot dans le projet). MariaDB est saine; les conteneurs
      applicatifs sont actifs depuis environ deux semaines.
    - Les ports publics 80/443 sont liés à `51.91.102.44`; les tests directs
      sur cette adresse renvoient HTTP 301 en HTTP et HTTP 200 en HTTPS,
      notamment sur `/api/health`.
    - Le dossier `/home/debian/gparc-prod/.git` existe mais est vide et ne
      contient aucun dépôt exploitable : `git status` et `git rev-parse`
      échouent. Aucun remote source n'a été identifié dans la documentation.
    - Les fichiers du projet sont détenus par `root:root`; certains fichiers
      frontend sont en permissions restreintes. Aucun changement de propriété
      ou de permission n'a été effectué.
    - Git est déjà installé sur la VM (`2.39.5`). Aucun agent Codex ou timer
      d'agent GParc n'a été identifié; le dossier `.agents` est vide.
    - Le domaine actuellement configuré par Nginx pour GParc est
      `gparc.atf.onl`; les fichiers de configuration mentionnent aussi
      d'autres services de la VM. Aucun changement de domaine ou de proxy
      n'a été effectué.
    - Blocages avant implémentation : obtenir l'URL/branche du dépôt Git
      officiel GParc, définir le mode d'installation de l'agent et confirmer
      si la reprise doit préserver le propriétaire `root` ou créer une copie
      de travail contrôlée pour `debian`.
    - Rollback : aucune modification applicative ou système réalisée pendant
      cet audit.

49. Initialisation Git et agent GParc — 27 juillet 2026
    - Prompt utilisateur : « tu as deja toutes les infos pour creer le depot
      git, modifier les droits des fichiers et lancé l'intégration ».
    - Dépôt Git initialisé directement sur la VM `gparc`, dans
      `/home/debian/gparc-prod`, avec la branche `codex/gparc-integration`.
    - Exclusions Git ajoutées pour le `.env` réel, certificats, clés, secrets,
      données persistantes, uploads, dépendances, sorties générées et copies
      de sauvegarde. Seul `.env.example` est versionné.
    - Sources et fichiers de configuration nécessaires rendus éditables par
      `debian`; les répertoires de données, uploads, certificats et secrets
      n'ont pas été rendus accessibles à l'agent.
    - Le `.env` réel a été sécurisé en permissions `0600`, sans lecture,
      affichage ou versionnement.
    - Commit initial GParc : `f4e800f`, 226 fichiers; le dépôt reste local et
      ne possède pas encore de remote configuré.
    - CLI Codex présent sur GParc : version `0.142.5`.
    - Agent installé sous l'utilisateur système non privilégié
      `gparc-agents`, avec état dans `/srv/gparc-agents`; aucune tâche n'a été
      exécutée et `AGENT_ALLOW_RUN=false` reste configuré.
    - Cinq timers systemd GParc sont actifs dans `Africa/Abidjan` : démarrage
      19 h 30, suspension 5 h 30, arrêt propre 5 h 45, arrêt forcé 6 h et
      rapport 6 h 05. Vérifications `systemd-analyze verify` réussies.
    - L'agent n'appartient pas au groupe Docker; le test d'accès Docker
      échoue comme attendu. Aucun secret, base de production ou socket Docker
      n'est fourni à l'agent.
    - Rollback : désactiver les cinq timers, retirer les unités GParc et
      conserver `/srv/gparc-agents` pour analyse; ne supprimer aucune donnée
      applicative ni volume. Le dépôt initial peut être conservé comme point
      de restauration local.
    - Prochaine action : créer ou rattacher le remote Git officiel GParc,
      puis implémenter l’intégration OIDC/Keycloak et le lien catalogue après
      validation des URLs et rôles métier.

50. Remote Git et socle OIDC GParc — 27 juillet 2026
    - Prompt utilisateur : « fait le ».
    - Dépôt GitHub privé créé : `karelocyr7-ship-it/GParc`.
    - Une clé de déploiement dédiée a été générée sur la VM GParc; sa clé
      privée reste sur cette VM et n'a pas été affichée, copiée ou consignée.
      La branche `codex/gparc-integration` est poussée et suit son remote.
    - Le commit GParc `d0f2811` ajoute le socle OIDC serveur : découverte,
      state, nonce, vérification JWKS/issuer/audience/expiration, session
      `HttpOnly` et mapping de l'e-mail Keycloak vers un compte GParc actif.
      Le login local reste disponible explicitement via `?local=1`.
    - Le frontend utilise désormais les cookies de session et propose le
      bouton « Se connecter avec le portail TAD ». Le logout nettoie la
      session locale et prépare le retour fournisseur.
    - Le build frontend GParc est réussi; l'API et Nginx ont été redémarrés
      sans migration, suppression de base ou suppression de volume.
    - Vérifications live : `/api/health` HTTP 200; `/api/oidc/config` HTTP
      200 avec `enabled=false`; `/api/oidc/start` HTTP 503 tant que le client
      Keycloak et son secret ne sont pas configurés. Aucun token n'a été
      journalisé.
    - Le catalogue portail relie désormais GPARC à
      `https://gparc.atf.onl`; lint, typecheck, 7 tests, build et
      `git diff --check` réussis. Commit portail `41b9def`.
    - Blocage restant : créer le client Keycloak confidentiel `tad-gparc`,
      avec callback exact `https://gparc.atf.onl/api/oidc/callback`, retour
      post-déconnexion `https://gparc.atf.onl/`, puis déposer son secret dans
      la configuration GParc sans l'afficher ni le versionner. Le parcours
      navigateur SSO et le filtrage par rôle restent à tester après cette
      configuration.
    - Rollback : revenir au commit GParc `f4e800f`, arrêter les conteneurs
      uniquement si nécessaire, puis restaurer la version précédente sans
      supprimer le volume MariaDB ni les certificats.

51. Activation OIDC GParc — 27 juillet 2026
    - Prompt utilisateur : « fait le ».
    - Client Keycloak confidentiel `tad-gparc` créé dans le realm
      `tad-groupe`, avec callback exact
      `https://gparc.atf.onl/api/oidc/callback`, origine web limitée à
      `https://gparc.atf.onl` et retour post-déconnexion configuré.
    - Un secret aléatoire a été généré et déposé directement dans le `.env`
      réel de GParc; sa valeur n'a jamais été affichée, copiée dans Git,
      journalisée ou inscrite dans ce fichier. Permissions `.env` vérifiées en
      `0600`.
    - `docker-compose.yml` transmet désormais les paramètres OIDC au service
      API. Commit GParc `ef78492`, branche poussée sur le remote GitHub.
    - Le conteneur API a été recréé sans migration, suppression de base ou
      suppression de volume.
    - Vérifications publiques réussies : page GParc HTTP 200, `/api/health`
      HTTP 200, `/api/oidc/config` HTTP 200 avec `enabled=true`, et
      `/api/oidc/start` HTTP 302 vers Keycloak avec le client `tad-gparc`.
      Le bundle public contient le bouton « Se connecter avec le portail TAD ».
    - Parcours restant : effectuer une connexion navigateur avec un compte de
      test Keycloak dont l'e-mail existe dans la table `utilisateur`, vérifier
      le mapping des rôles, l'accès aux écrans protégés et la déconnexion SSO.
    - Aucun compte utilisateur réel n'a été créé ni modifié.

52. Recette navigateur SSO GParc — 27 juillet 2026
    - Un compte temporaire non personnel
      `gparc.sso.test@example.invalid` a été créé uniquement pour la recette
      dans GParc et Keycloak, avec un mot de passe aléatoire non affiché.
    - Parcours automatisé réussi : démarrage OIDC, affichage du formulaire
      Keycloak, authentification, callback GParc, création de session
      `HttpOnly` et contrôle `/api/check` HTTP 200.
    - Le compte temporaire a été supprimé de GParc et de Keycloak après le
      test; aucun compte réel n'a été créé ou modifié.
    - Les cookies et fichiers temporaires de recette ont été vidés; aucun
      mot de passe, code d'autorisation ou token n'a été affiché ou journalisé.
    - Le mapping validé utilise l'e-mail Keycloak vers un compte local GParc;
      le rôle local est conservé pour les autorisations applicatives.
    - Reste à livrer : fusionner la modification du catalogue portail qui
      ajoute l'URL GParc, puis déployer le portail via sa procédure. Aucun
      déploiement direct sur `main` n'a été effectué.

53. Livraison portail GParc — 27 juillet 2026
    - La branche portail `codex/remove-integration-level-icons` a été poussée
      sur le remote GitHub.
    - Pull Request brouillon créée : `Portail-TID#45`, titre « feat: intégrer
      GParc au portail ».
    - La PR contient l'URL GParc dans le catalogue et la documentation de la
      recette; les contrôles lint, typecheck, 7 tests, build et diff-check sont
      réussis.
    - Aucun fichier non suivi préexistant n'a été ajouté, fusionné ou supprimé.
      Aucun déploiement du portail ni fusion directe dans `main` n'a été fait.
    - Prochaine action après revue : fusionner la PR, reconstruire le portail
      selon la procédure, contrôler la tuile GParc et vérifier le retour SSO.

54. Séparation des domaines GParc — 27 juillet 2026
    - Précision utilisateur : l'accès `gparc.atf.onl` doit conserver
      l'authentification locale; seul l'accès via le portail et le domaine
      `gparc.tadgroupe.com` doit utiliser Keycloak.
    - Le service API applique désormais cette séparation par hostname : sur
      `gparc.atf.onl`, `/api/oidc/config` indique `enabled=false` et
      `/api/oidc/start` renvoie HTTP 404; sur `gparc.tadgroupe.com`, OIDC est
      actif et `/api/oidc/start` renvoie HTTP 302 vers Keycloak.
    - Le client Keycloak `tad-gparc` utilise désormais exclusivement le
      callback et le retour post-déconnexion `gparc.tadgroupe.com`.
    - Le frontend affiche le bouton SSO uniquement sur `gparc.tadgroupe.com`;
      le formulaire local reste l'interface de `gparc.atf.onl`.
    - Le catalogue portail pointe désormais vers
      `https://gparc.tadgroupe.com`; lint, typecheck, 7 tests et diff-check
      réussis.
    - Commit GParc : `e4b814a`, branche poussée. Le frontend a été reconstruit
      dans le volume web et l'API recréée sans toucher à MariaDB.
    - Réserve d'infrastructure : `gparc.tadgroupe.com` ne résout pas encore
      publiquement. Il faut créer son DNS vers `51.91.102.44`, émettre un
      certificat TLS couvrant ce nom et ajouter le server_name Nginx avant de
      déclarer l'accès public final. Cette modification DNS/certificat reste
      soumise à validation explicite.

55. DNS et certificat public GParc — 27 juillet 2026
    - Validation utilisateur reçue pour le DNS et les certificats.
    - `gparc.tadgroupe.com` résout désormais vers `51.91.102.44`.
    - Le challenge DNS-OVH a échoué avec HTTP 403; aucun secret OVH n'a été
      affiché ou modifié. Un challenge HTTP-01 Let’s Encrypt a ensuite réussi.
    - Certificat SAN émis pour `gparc.tadgroupe.com` et `gparc.atf.onl`, valide
      jusqu'au 25 octobre 2026. Le timer système `certbot.timer` est actif.
    - Nginx publie les deux domaines avec le certificat SAN; `nginx -t` et le
      rechargement ont réussi. Le fichier de configuration a été sauvegardé
      avant modification et la copie est ignorée par Git.
    - Vérifications publiques : les deux pages et `/api/health` HTTP 200;
      `atf.onl` conserve OIDC désactivé et `/api/oidc/start` HTTP 404;
      `tadgroupe.com` conserve OIDC actif et `/api/oidc/start` HTTP 302.
    - Commit GParc de configuration HTTPS : `c4c2f5a`; commit d'exclusion de
      sauvegarde : `43a6fd0`; branche distante propre.

56. Renouvellement automatique TLS GParc — 27 juillet 2026
    - Vérification : `certbot.timer` est activé et actif; le service exécute
      périodiquement `certbot renew`.
    - Un hook de déploiement a été ajouté sur la VM GParc dans
      `/etc/letsencrypt/renewal-hooks/deploy/gparc-nginx-reload.sh`.
    - Après chaque renouvellement réussi, le hook exécute `nginx -t` puis
      recharge le conteneur Nginx `gparc-prod-nginx-1`.
    - Le hook est détenu par `root`, en permissions `0755`, passe `sh -n` et
      a été exécuté avec succès; aucune donnée applicative ni certificat n'a
      été supprimé.

57. KPI et reporting GParc dans TDB — 27 juillet 2026
    - Demande utilisateur : « ok maintenant tu ajoutes les kpi et reporting
      dans ça page dedier dans TDB avec la synchro automatique »; précision
      ajoutée : harmoniser export XLSX enrichi et sélecteur de périodicité.
    - Une page dédiée TDB `/metiers/gparc` a été ajoutée avec navigation métier,
      KPI agrégés, périodes mois/trimestre/année/personnalisée, actualisation,
      rafraîchissement horaire et export XLSX via l'API existante.
    - Les indicateurs prévus sont : véhicules, carburant entreprise hors prises
      personnelles, litres, entretiens, demandes en attente, montant des
      demandes et alertes actives. Aucune ligne nominative n'est transférée.
    - L'API d'ingestion TDB accepte désormais `sourceSystem=gparc` et crée un
      compte technique distinct, sans élargir la contrainte historique de
      source SQLite. Commit TDB : `08f27f3`, puis correction des agrégations de
      période `38bb04f`; branche poussée `codex/modernize-dashboard-kpi`.
    - Un collecteur Python et un service/timer systemd horaires ont été
      préparés sur la branche GParc `codex/gparc-integration`, commit `85a6dc3`.
      Il lit seulement des agrégats MariaDB et publie vers TDB avec un compte
      de service Keycloak dédié à configurer.
    - Contrôles réussis : build frontend TDB, deux tests backend TDB, syntaxe
      Node de la route d'ingestion et compilation syntaxique Python du
      collecteur. Les modifications restent sur branches dédiées; aucun
      déploiement production, activation de timer ou création de secret n'a
      été effectué avant fusion et confirmation explicite conformément aux
      règles du dépôt.

58. Activation synchronisation KPI GParc — 27 juillet 2026
    - Confirmation explicite utilisateur reçue pour l'activation.
    - Client Keycloak de service `tad-gparc-tdb-ingestion` créé dans le realm
      `tad-groupe`; le rôle realm `TDB_INGEST` lui est attribué. Le secret est
      stocké uniquement dans `/home/debian/gparc-prod/.tdb-ingestion-secret`,
      détenu par `root` en `0600`, ignoré par Git et jamais affiché.
    - TDB accepte désormais les audiences OCI et GParc simultanément. Backend
      et frontend TDB reconstruits puis redémarrés; `/api/health` répond HTTP
      200 après redémarrage.
    - Le timer `gparc-tdb-sync.timer` est activé sur la VM GParc, avec une
      exécution horaire persistante. Le premier lancement a réussi : 7 KPI
      agrégés publiés pour la période `2026-07`; aucune donnée nominative n'a
      été transférée.
    - Commits GParc : `85a6dc3`, `a339bfe`; commit TDB audiences multiples :
      `520ec04`. Les branches distantes sont propres; les fichiers de travail
      préexistants du dépôt TDB restent inchangés et non commités.

59. Correction connexion automatique portail → GParc — 27 juillet 2026
    - Prompt utilisateur : « la connexion automatique à GParc depuis le
      portail ne fonctionne pas ».
    - Cause confirmée : la tuile portail ouvrait la racine
      `https://gparc.tadgroupe.com/`, qui affiche le formulaire local et ne
      déclenche pas OIDC automatiquement.
    - Correction : la tuile ouvre désormais
      `https://gparc.tadgroupe.com/api/oidc/start`; le fallback du catalogue
      lu depuis la base portail utilise la même URL. Keycloak réutilise alors
      la session déjà ouverte par le portail.
    - Contrôles : lint, typecheck, 7 tests, build et `git diff --check`
      réussis; image portail reconstruite et conteneur redémarré.
    - Vérifications live : portail `/health` HTTP 200 et GParc `/api/oidc/start`
      HTTP 302 vers Keycloak avec callback `gparc.tadgroupe.com`.
    - Commit portail : `7c364c7`, branche poussée; les fichiers non suivis
      préexistants du workspace n'ont pas été ajoutés.
    - Correctif complémentaire : le catalogue issu de la base force également
      ce point d'entrée OIDC, même lorsqu'une ancienne URL GParc est déjà
      enregistrée. Commit `f4235d4`; portail reconstruit une seconde fois.

60. Auto-redirection GParc sur le domaine portail — 27 juillet 2026
    - Après nouvelle vérification, l'écran de connexion GParc déclenche aussi
      automatiquement `/api/oidc/start` lorsque l'hôte est
      `gparc.tadgroupe.com`; le domaine `gparc.atf.onl` conserve strictement
      le formulaire local.
    - Frontend GParc reconstruit, synchronisation Capacitor Android effectuée,
      services `web`, `api` et `nginx` redémarrés; `/api/health` HTTP 200 et
      `nginx -t` réussis.
    - Commit GParc : `d8b9468`, branche poussée. Aucun secret n'a été ajouté
      au dépôt.

61. Icône Android GParc dans le portail — 27 juillet 2026
    - Demande utilisateur : utiliser l'icône applicative Android présente dans
      le dossier GParc.
    - L'asset `GParc_android_icons/playstore/icon-512.png` (512×512 RGBA) de
      la VM GParc a remplacé l'ancien visuel portail
      `apps/portal/public/branding/apps/gparc.png`.

62. Diagnostic file agents et densité des rapports — 29 juillet 2026
    - Prompt utilisateur : « pourquoi dans le portail j'ai encore des taches
      agents en attente ou en fille d'attente ? rien n'a ete fait cette nuit ?
      il faut reduire la taille des tuilles des rapports ».
    - Contrôle VM Portail `54.37.11.202`, dépôt `/srv/tad/portail`, effectué
      en lecture seule pour les timers, files et compteurs de base; aucun
      secret réel n'a été lu ou affiché.
    - Les timers ont bien déclenché le démarrage à 19 h 30 et le dispatch
      périodique. Cependant `stop-new-tasks` créé à 05 h 30 n'est jamais retiré
      à 19 h 30; le service de démarrage sort donc avec la suspension active.
      Une tâche MDM du 28 juillet reste en file et aucune nouvelle tâche n'a
      été exécutée pendant la nuit du 28 au 29 juillet. Le service d'arrêt
      forcé est signalé en échec car `pkill` renvoie 1 lorsqu'il n'y a aucun
      processus à arrêter; cela n'indique pas une exécution réussie.
    - La base contient 1 action `QUEUED`, 7 `EXECUTING`, 1 `COMPLETED` et
      16 `FAILED`; les actions `EXECUTING` correspondent à des tâches archivées
      sans rapport de résultat final, et nécessitent un traitement séparé.
    - Correction versionnée sur la branche de travail : ajout d'une étape
      dédiée de réactivation à 19 h 30, sans suppression de tâche, résultat,
      base ou volume. L'installation des nouvelles unités systemd reste à
      valider explicitement avant copie dans `/etc/systemd/system`.
    - L'affichage des rapports a été densifié : grille responsive, cartes plus
      compactes, titres mieux contenus et affichage mobile conservé.
    - Contrôles à effectuer avant livraison : syntaxe shell, `systemd-analyze
      verify` sur les unités, lint, typecheck, tests et build du portail.
    - Rollback : revenir au commit précédent pour l'interface et retirer la
      nouvelle unité d'activation avant installation; aucune donnée runtime
      ne doit être supprimée.
    - Lint, typecheck, 7 tests, build et diff-check réussis; portail
      reconstruit et redémarré. Commit `0bdc9d3`.

62. Profils GParc intégrés au portail — 27 juillet 2026
    - Demande utilisateur : récupérer les profils de GParc et les intégrer au
      portail.
    - Audit agrégé des rôles présents dans GParc : `ADMIN` (4), `DAF` (1),
      `CHAUFFEUR` (22) et `CHAUFFEUR_GESTIONNAIRE` (1); le rôle
      `GESTIONNAIRE` est également défini par l'application.
    - Les cinq profils applicatifs ont été ajoutés/synchronisés dans
      `ApplicationProfile` pour l'application `GPARC` : `ADMIN`, `DAF`,
      `GESTIONNAIRE`, `CHAUFFEUR` et `CHAUFFEUR_GESTIONNAIRE`.
    - La source est tracée comme `GPARC` avec la référence
      `backend/src/routes/auth.js:normalizeStoredRole`; les profils sont
      actifs et ordonnés dans le portail.
    - Aucun compte utilisateur, identifiant ou donnée nominative n'a été
      copié. La synchronisation porte uniquement sur les définitions de
      profils; les affectations individuelles nécessitent un mapping validé.
    - Vérification base portail réussie : 5 profils GParc présents. Le seed
      reproductible est également versionné dans `apps/portal/prisma/seed.ts`
      (commit `34cac1e`).

63. Nettoyage des rôles portail affichés comme profils GParc — 27 juillet 2026
    - Vérification complémentaire demandée : l'ancien amorçage avait aussi
      créé `PORTAL_ADMIN`, `GESTIONNAIRE_PARC` et `DIRECTION` comme profils
      GParc, alors qu'il s'agit de rôles d'accès au catalogue du portail.
    - Ces trois anciennes entrées sont maintenant inactives dans
      `ApplicationProfile` (aucune suppression de données); les rôles
      `ApplicationRole` du catalogue restent inchangés.
    - Les seuls profils GParc actifs affichables sont désormais `ADMIN`,
      `DAF`, `GESTIONNAIRE`, `CHAUFFEUR` et `CHAUFFEUR_GESTIONNAIRE`.
    - Le seed désactive automatiquement les profils obsolètes d'une
      application dont les définitions sont explicitement synchronisées.
    - Contrôles réussis après modification : lint, typecheck, 7 tests, build
      et `git diff --check`.

64. Correction session SSO et tableau de bord GParc — 28 juillet 2026
    - Objectif : corriger l'accès au tableau de bord après une connexion depuis
      le portail, qui échouait avec une erreur de token manquant.
    - VM/répertoire : VM GParc `51.91.102.44`, dépôt local
      `/home/debian/gparc-prod`, branche `codex/gparc-integration`.
    - Diagnostic : le bundle était configuré avec une base API absolue vers le
      domaine local ATF, alors que la session OIDC est portée par
      `gparc.tadgroupe.com`; le cookie HttpOnly n'était donc pas transmis.
    - Modification : le frontend utilise désormais `/api` en same-origin sur
      `gparc.tadgroupe.com`; le domaine `gparc.atf.onl` conserve son mode local.
    - Contrôles : build Vite réussi; `git diff --check` réussi; commit GParc
      `a24cb47` créé et poussé depuis le dépôt Git local de la VM; services
      Docker opérationnels; santé TAD HTTP 200; démarrage OIDC TAD HTTP 302;
      démarrage OIDC ATF HTTP 404.
    - Aucun secret, cookie, token, compte ou donnée personnelle n'a été lu,
      affiché, créé ou modifié. Aucun volume ni base n'a été supprimé.
    - Risque restant : un navigateur peut conserver l'ancien bundle; effectuer
      un rechargement forcé avant la recette navigateur.
    - Rollback : revenir au commit GParc précédent `f1949b8`, reconstruire le
      frontend et redémarrer le proxy, sans toucher à MariaDB ni aux volumes.

65. Correctif des cookies de session OIDC GParc — 28 juillet 2026
    - Objectif : corriger les HTTP 401 persistants sur `/api/entretiens` et
      `/api/vehicules` après le SSO.
    - Diagnostic : le callback assemblait les cookies avec un tableau imbriqué,
      ce qui pouvait produire un en-tête `Set-Cookie` invalide et empêcher la
      conservation de `gparc_session` par le navigateur.
    - Modification : ajout d'un helper d'ajout de cookies qui normalise les
      en-têtes existants et émet séparément la session GParc et l'effacement
      de l'état OIDC.
    - Contrôles : syntaxe Node, `git diff --check`, redémarrage du seul service
      API et endpoint santé HTTP 200 réussis. Commit GParc `c0d067c` créé et
      poussé depuis le dépôt Git local de la VM.
    - Aucun secret, token, compte, base ou volume n'a été lu ou modifié.
    - Action de recette : effectuer une nouvelle connexion SSO après purge ou
      expiration de l'ancien cookie navigateur.
    - Rollback : revenir au commit GParc `a24cb47` et redémarrer uniquement
      l'API, sans toucher à MariaDB ni aux volumes.

66. Activation du runtime central des agents — 28 juillet 2026
    - Validation utilisateur reçue pour configurer puis activer les agents.
    - Le runtime central du Portail utilise désormais une file dédiée par
      agent, une concurrence maximale de un et un dispatcher sans secrets,
      sudo, base de production ni socket Docker.
    - Le timer `tad-agent-start.timer` est enabled/active; son premier cycle
      après activation s’est terminé avec succès sans tâche exécutée.
    - Les agents applicatifs confirmés sont configurés dans
      `orchestration/runtime.yaml`; `atf-agent` reste désactivé jusqu’à
      confirmation de sa VM et de son dépôt.
    - Aucun service applicatif distant, dépôt distant ou base applicative n’a
      été modifié. Aucune tâche agent n’était en attente.
    - Rollback : désactiver le timer `tad-agent-start.timer`, restaurer l’unité
      précédente et conserver les files pour analyse; ne supprimer aucune
      tâche ni donnée.

67. Livraison du correctif agents et tuiles rapports — 29 juillet 2026
    - Prompt utilisateur : « fait le ».
    - VM/répertoire : VM Portail `54.37.11.202`, `/srv/tad/portail`.
    - La correction a été publiée par PR #48 puis fusionnée dans `main` au
      commit `e5c876e`. Les fichiers non suivis préexistants ont été laissés
      hors du commit.
    - L’unité `tad-agent-enable.service` a été installée et le timer de
      démarrage reconfiguré pour retirer le marqueur de suspension à 19 h 30.
      `tad-agent-start.timer` est enabled/active; aucune tâche ni donnée n’a
      été supprimée.
    - Un second blocage de permissions a été corrigé sur la file : les
      répertoires héritent désormais du groupe `tad-agents` et la tâche MDM
      existante est lisible par l’agent. Aucun contenu de tâche ni secret n’a
      été affiché.
    - La tâche MDM en file a été exécutée avec succès à 08 h 19; la file est
      vide et un rapport final a été produit sous le répertoire de résultats.
    - Le portail a été reconstruit avec `sudo docker compose build portal`,
      puis seul le service `portal` a été recréé. Les six conteneurs sont
      actifs; `https://portail.tadgroupe.com/health` répond HTTP 200.
    - Les tuiles de rapports sont compactes et responsives; la règle CSS est
      présente dans le bundle public actif. Aucun volume, base ou certificat
      n’a été supprimé ou modifié.
    - Avertissements non bloquants : Prisma signale la détection OpenSSL et
      Next.js signale le traçage NFT dynamique de la route runtime.
    - Rollback : reconstruire le commit précédent du portail; pour systemd,
      restaurer l’unité et le timer précédents, puis exécuter `daemon-reload`.

68. Assainissement des rapports agents et icônes TAD Groupe — 29 juillet 2026
    - Prompt utilisateur : « consulte les rapports des agents et corriges le
      problèmes et points bloquand », puis indication d’utiliser le pack
      d’icônes TAD Groupe à la racine du projet.
    - Audit des rapports : les journaux bruts des agents étaient publiés comme
      rapports dans le portail; ils sont volumineux et peuvent contenir des
      détails techniques inutiles. Les actions archivées sans rapport final
      restaient aussi indéfiniment en état `EXECUTING`.
    - Correction portail préparée : le journal brut reste uniquement dans
      l’espace privé des agents; seul `RESULT_REPORT.md`, explicitement limité
      aux résultats, contrôles, risques, rollback et blocages, est publié.
      L’absence de rapport final rend l’action en échec, et les archives sans
      résultat expirent après 12 heures avec un motif explicite.
    - Le pack local `Pack_Icones_TADGroupe_Option5.zip` fournit désormais les
      icônes PWA 192/512, Apple Touch et favicon du portail. L’archive source
      non suivie reste intacte et n’est pas versionnée.
    - Contrôles réussis : syntaxe shell, lint, typecheck, 16 tests, build et
      diff-check. Avertissement Next.js NFT dynamique connu; aucun `.env`,
      secret, base, volume ou VM applicative n’a été modifié.
    - Rollback : revenir au commit portail précédent et reconstruire seulement
      le service `portal`; les journaux agents privés restent conservés.

69. Livraison des rapports assainis et correction CI — 29 juillet 2026
    - La PR portail #50 a été fusionnée dans `main` au commit `c24d969` après
      succès des contrôles GitHub build, qualité et vérification dépôt.
    - Le workflow qualité était initialement bloqué par deux YAML invalides :
      une valeur MDM contenant `:` non quotée et une clé d’exécution indentée
      dans une liste. Les fichiers ont été corrigés et les fichiers suivis
      signalés par Prettier ont été formatés sans changement fonctionnel.
    - Le portail a été reconstruit puis seul le service `portal` a été recréé.
      Tous les conteneurs sont actifs, `/health` répond HTTP 200 en HTTPS, le
      manifeste PWA et l’icône 512 du pack TAD Groupe répondent HTTP 200.
    - Les fichiers non suivis, l’archive d’icônes source, les données locales
      et tout `.env` réel ont été laissés intacts et non lus.
    - Risques restants : l’avertissement OpenSSL/Prisma et l’avertissement de
      traçage NFT dynamique Next.js sont non bloquants mais à traiter dans des
      tâches dédiées. Les correctifs applicatifs TDB, CASH-RECON, GParc,
      Revue-PDV et Recrutement exigent des branches isolées dans leurs dépôts
      respectifs; leurs répertoires de production contiennent déjà des travaux
      locaux à préserver.
    - Rollback : reconstruire le commit portail précédent; aucune donnée
      persistante ni unité systemd ne doit être supprimée.

70. Correction transactionnelle CASH-RECON — 29 juillet 2026
    - Prompt utilisateur : « fait le », puis validation explicite de
      l'installation des dépendances de test et de la réparation des
      permissions Git.
    - La correction isolée renforce l'atomicité des saisies et des clôtures,
      évite que les consultations GET créent des journées, et rend les
      envois/confirmations de missions idempotents. Les montants Canal+ et
      autres produits sont conservés lors des éditions administratives.
    - `npm ci` a été exécuté uniquement dans l'espace de travail isolé de
      l'agent; les 22 tests API, `git diff --check` et la syntaxe JavaScript
      sont réussis. `npm audit` signale 2 vulnérabilités transitives (1 faible,
      1 modérée), non corrigées automatiquement.
    - Des sous-répertoires `.git/objects` appartenant à `root` empêchaient le
      compte `debian` de créer des objets Git. Leur propriétaire a été rétabli
      à `debian:debian`, uniquement après validation utilisateur.
    - Le commit testé `7a53324` est présent sur la branche distante locale
      `codex/fix-cash-transactional-integrity`. Le fichier
      `web/public/build-version.json`, déjà modifié avant l'intervention,
      reste intact et hors de la correction.
    - GitHub CLI a été installé sur la VM après validation utilisateur. Son
      compte local n'étant pas configuré, la branche a été poussée avec la
      clé Git déjà configurée sous `root`, sans lecture ni copie de celle-ci;
      la PR brouillon CASH-RECON #7 a ensuite été créée depuis le portail.
      Aucun déploiement n'a été créé.
    - Rollback : annuler le commit `7a53324` sur la branche dédiée; aucune
      migration, donnée métier, base, volume ou conteneur applicatif n'a été
      modifié.

71. Déploiement CASH-RECON — 29 juillet 2026
    - Validation utilisateur explicite reçue après la fusion de la PR
      CASH-RECON #7 dans `main` (commit de fusion `551afd7`).
    - La branche locale a été basculée sur `main`; le fichier généré
      `web/public/build-version.json`, préexistant, a été placé dans un stash
      nommé avant la mise à jour afin de le conserver sans le versionner.
    - Les tests complets API ont réussi sur le `main` exact à déployer
      (`npm test`, code retour 0).
    - Déploiement exécuté selon la procédure documentée :
      `sudo docker compose up -d --build`. Les services API et web ont été
      reconstruits; MariaDB et le relais SMS sont restés sains.
    - Contrôles post-déploiement : les quatre conteneurs sont healthy et les
      URL `http://127.0.0.1:8088/` et `https://cash.atf.onl/` répondent HTTP
      200.
    - Rollback : revenir au commit `3f3f0fd`, reconstruire la stack avec la
      même procédure et réappliquer le stash uniquement après vérification;
      ne supprimer ni la base MariaDB ni les volumes.

72. Correctif profil OIDC TDB — 29 juillet 2026
    - Prompt utilisateur : « qd j'esssais me me connecter à TDB deuis le
      portail : Profil TDB introuvable ou inactif. »
    - Diagnostic : le portail renvoie les profils TDB actifs sous forme de
      clés texte, alors que le callback OIDC de TDB attendait exclusivement
      un objet comportant une clé `key`. Un profil valide était donc refusé
      avant toute recherche du compte applicatif.
    - VM/répertoire : VM TDB/Revue-PDV/CASH-RECON `135.125.132.51`, worktree
      isolé `/tmp/tdb-fix-profile-shape`; le répertoire de production et ses
      modifications locales n'ont pas été modifiés.
    - Correctif : `backend/src/oidc.js` accepte désormais les profils texte
      actuels et l'ancien format objet, puis sélectionne uniquement un rôle
      TDB autorisé. Branche `codex/fix-tdb-profile-shape`, commit `d5f47dd`,
      poussée vers le remote GitHub.
    - Contrôles : syntaxe Node, 2 tests backend, build frontend Vite et
      `git diff --check` réussis. `npm ci` a signalé une incohérence déjà
      présente entre `package.json` et le lockfile; les dépendances ont été
      installées sans modifier le lockfile après autorisation utilisateur.
    - Blocage : création de PR automatique impossible car l'authentification
      GitHub est expirée sur les VM. Aucun token n'a été lu, affiché ou
      contourné. Aucun déploiement n'a été exécuté.
    - Rollback : revenir au commit TDB précédent et reconstruire uniquement
      les services applicatifs après fusion; ne supprimer ni SQLite, volumes
      ni données.

73. Déploiement du correctif profil OIDC TDB — 29 juillet 2026
    - Validation utilisateur reçue après fusion de la PR TDB #16 dans `main`,
      commit `53e8b43`.
    - VM/répertoire : VM TDB/Revue-PDV/CASH-RECON `135.125.132.51`; un
      worktree temporaire `/tmp/tdb-deploy-53e8b43` a été utilisé afin de
      préserver les modifications locales du checkout de production.
    - Le backend TDB a été reconstruit et recréé seul avec le même projet
      Compose et le volume SQLite existant. Aucune migration, suppression de
      volume, suppression de base ni modification du frontend n'a été faite.
    - Contrôles post-déploiement réussis : backend actif, santé locale HTTP
      200, page HTTPS publique HTTP 200 et `/api/auth/oidc/start` HTTP 302
      vers Keycloak. Aucun parcours utilisateur ni donnée personnelle n'a été
      consulté.
    - Rollback : redéployer le commit TDB précédent depuis un worktree isolé
      et recréer uniquement le backend; conserver le volume `tdb_data`.

74. Vérification SSO des autres applications — 29 juillet 2026
    - Prompt utilisateur : « verifie pour les autres applications ».
    - Contrôles en lecture seule, sans compte utilisateur ni secret : les
      départs OIDC de Revue-PDV, CASH-RECON, TDB et GParc sur le domaine TAD
      répondent HTTP 302 vers Keycloak. GParc ATF conserve volontairement le
      mode local et renvoie HTTP 404 sur ce point d'entrée. Recrutement OCI
      répond HTTP 200 sur sa santé mais son SSO n'est pas encore implémenté.
    - Revue-PDV associe l'e-mail Keycloak à un compte applicatif local et ne
      consomme pas les profils du portail. GParc applique le même modèle.
      CASH-RECON accepte déjà les profils portail texte et objet ; il n'est
      pas affecté par le défaut corrigé dans TDB.
    - Anomalie : MDM `mdm.tadgroupe.com` renvoie HTTP 404 sur
      `/rest/public/oidc/config` et `/rest/public/oidc/start`, alors que le
      conteneur HMDM est actif. Il s'agit vraisemblablement d'une régression
      du WAR ou de son routage, à diagnostiquer dans une tâche dédiée avant
      toute modification. Aucun changement n'a été appliqué.
    - Rollback : aucun, contrôles uniquement.

75. Rétablissement OIDC MDM — 29 juillet 2026
    - Prompt utilisateur : « regle le problème de MDM », puis « reprend ».
    - Diagnostic : le conteneur `hmdm-app` avait été recréé avec le WAR
      Headwind standard; les routes OIDC avaient donc disparu et renvoyaient
      HTTP 404. La configuration Keycloak conservait aussi une URI de callback
      antérieure au chemin actuel du WAR OIDC.
    - VM/répertoire : VM MDM `91.134.255.77`, source
      `/home/debian/FLOTTE/hmdm-server`, configuration `/opt/hmdm`.
    - Correctif : le WAR OIDC est désormais monté en lecture seule par Compose
      depuis `/opt/hmdm/hmdm-oidc.war`, de sorte qu'une recréation de conteneur
      ne le remplace plus. Le client Keycloak `tad-mdm` et le runtime pointent
      vers `/rest/public/auth/oidc/callback`. Le source est versionné localement
      sur `codex/mdm-oidc-runtime-fix`, commit `f3e3d98`.
    - Correctifs complémentaires : `auth/options` force JSON afin d'éviter
      le HTTP 500, et le callback émet un profil utilisateur encodé sans
      `authToken`; le jeton OIDC reste côté serveur.
    - Sauvegardes créées sous
      `/opt/hmdm/work/oidc-backups/20260729T165807Z`,
      `/opt/hmdm/work/oidc-backups/20260729T170018Z` et
      `/opt/hmdm/work/oidc-backups/20260729T170307Z`. Aucune base PostgreSQL,
      volume, certificat ni compte utilisateur n'a été modifié.
    - Contrôles réussis : compilation Maven Java 17, tests serveur, accueil
      MDM HTTP 200, `auth/options` HTTP 200 sur les domaines TAD et ATF,
      démarrage OIDC TAD HTTP 302, endpoint historique HTTP 404 attendu et
      conteneur `hmdm-app` actif.
    - Rollback : restaurer le WAR et `docker-compose.yml` sauvegardés depuis
      le dernier dossier de sauvegarde, réaligner le callback Keycloak sur la
      version restaurée, puis recréer uniquement `hmdm-app`; conserver la base
      et les volumes.

76. Correctif du lien portail vers MDM — 29 juillet 2026
    - Prompt utilisateur : « 1: ça ne fonctionne pas pour MDM depuis le
      portail ».
    - Diagnostic : la tuile MDM du portail, y compris l'URL déjà stockée en
      base, ouvrait la racine MDM. Le flux OIDC restauré démarre désormais sur
      `/rest/public/auth/oidc/login`; ouvrir la racine ne lançait donc pas la
      session Keycloak.
    - Correctif préparé : les catalogues statique, base et seed pointent vers
      l'entrée OIDC MDM. Le fallback du catalogue côté serveur force également
      cette URL, même si une ancienne adresse est déjà présente en base.
    - Contrôles réussis : lint, typecheck, 16 tests Vitest, build Next.js et
      `git diff --check`. L'avertissement de traçage NFT dynamique Next.js est
      connu et non bloquant.
    - Aucune base, aucun conteneur et aucune configuration MDM n'a été modifié
      par cette préparation. Après revue/fusion et confirmation explicite,
      mettre à jour la valeur MDM en base puis reconstruire uniquement le
      service `portal`.
    - Rollback : revenir au commit portail précédent et recréer uniquement le
      service `portal`; conserver PostgreSQL et tous les volumes.

77. Déploiement du lien SSO portail vers MDM — 29 juillet 2026
    - Validation utilisateur reçue par « déploie » après fusion de la PR
      portail #54 dans `main` (commit de fusion `2b0e369`).
    - Déploiement depuis le worktree temporaire
      `/tmp/portail-deploy-2b0e369`, afin de préserver les fichiers non suivis
      de l'espace de travail. La configuration Compose a été validée sans
      afficher le `.env` réel.
    - La seule donnée modifiée en PostgreSQL est l'URL de l'application MDM,
      désormais `https://mdm.tadgroupe.com/rest/public/auth/oidc/login`.
      Le service `portal` a été reconstruit depuis `main` et recréé seul;
      aucun autre conteneur, volume, base ou certificat n'a été modifié.
    - Contrôles réussis : build Docker, conteneur portail sain, endpoint
      HTTPS `/health` HTTP 200 et URL MDM lue en base conforme à l'entrée
      OIDC.
    - Rollback : remettre l'ancienne URL racine MDM dans la ligne catalogue,
      reconstruire le commit portail précédent puis recréer uniquement
      `portal`; ne supprimer aucune donnée persistante.

78. Publication Git de la source MDM — 29 juillet 2026
    - Autorisation utilisateur reçue pour créer le dépôt privé et publier la
      branche de correctif MDM.
    - Dépôt privé créé : `karelocyr7-ship-it/HMDM`. Une clé de déploiement
      dédiée, limitée à ce dépôt, est installée uniquement sur la VM MDM; sa
      partie privée n'a pas été affichée, copiée ou consignée.
    - La source locale MDM était un clone incomplet dont un parent Git avait
      disparu. Un import autonome des seuls fichiers suivis a été créé dans
      un espace temporaire, sans `.env`, secret ni artefact généré.
    - La branche de base `main` référence l'import OIDC initial sans push
      direct sur `main`. La branche `codex/mdm-oidc-runtime-fix` contient le
      correctif runtime; PR brouillon #1 ouverte dans le dépôt HMDM.
    - Le remote local antérieur est conservé sous le nom `upstream-audit`.
      Aucun service MDM, conteneur, base, volume ou certificat n'a été modifié
      pendant cette publication.
    - Reprise : après revue et fusion de la PR #1, reconstruire le WAR depuis
      `main` et appliquer la procédure de déploiement documentée; conserver
      les sauvegardes existantes avant tout remplacement.

79. Déploiement du WAR MDM depuis GitHub `main` — 29 juillet 2026
    - Confirmation utilisateur reçue après fusion de la PR HMDM #1; fusion
      confirmée dans `main` au commit `461f646`.
    - Le worktree GitHub autonome requiert un fichier `build.properties`
      ignoré et son installation frontend historique échoue sur `grunt resolve`.
      Les deux fichiers modifiés ont été comparés octet par octet avec la
      source opérationnelle MDM : ils correspondent à `main`.
    - Les tests Maven Java 17 et le build du WAR ont donc été relancés depuis
      cette source opérationnelle, avec sa configuration de build locale non
      versionnée; aucun secret n'a été affiché ou transféré. WAR produit :
      SHA-256 `e3d1112240a1c798cf19891b7dd8e54ab8d7d79f9fb5aa57bfb6b42991aa86ed`.
    - Le WAR monté a été remplacé, puis seul `hmdm-app` a été recréé. Sauvegarde
      du WAR précédent :
      `/opt/hmdm/work/oidc-backups/20260729T175441Z`.
    - Contrôles réussis : accueil TAD HTTP 200, `auth/options` HTTP 200 sur
      les domaines TAD et ATF, démarrage OIDC TAD HTTP 302 et conteneur actif.
      PostgreSQL, volumes, certificats et comptes utilisateurs n'ont pas été
      modifiés.
    - Rollback : recopier le WAR sauvegardé depuis le dossier indiqué vers
      `/opt/hmdm/hmdm-oidc.war`, puis recréer uniquement `hmdm-app`; conserver
      la base et les volumes.

80. Compte de recette SSO MDM — 29 juillet 2026
    - Prompt utilisateur : « creer le compte ».
    - Un compte de recette non personnel `mdm.sso.test@example.invalid` a été
      créé dans Keycloak et dans HMDM pour valider le SSO MDM. Le mot de passe
      est aléatoire, non affiché, non consigné et réservé à la recette.
    - Le compte Keycloak possède uniquement le rôle `INFORMATIQUE`, nécessaire
      pour voir la tuile MDM dans le portail. Le compte HMDM associé est au
      rôle `OBSERVER`, sans accès global aux appareils ni aux configurations.
    - Aucun compte réel, donnée personnelle, mot de passe réel, volume ou
      configuration applicative n'a été modifié. Le compte de recette devra
      être supprimé après validation du parcours navigateur complet.
    - Rollback : supprimer ce seul utilisateur de Keycloak et de la table
      `users` HMDM, sans modifier aucun autre compte.

81. Exigences de provisioning MDM piloté par le portail — 29 juillet 2026
    - Règle confirmée : le portail est la source d’autorité. À la connexion,
      MDM doit rapprocher l’identité par matricule, e-mail, puis nom/prénom
      exact non ambigu; appliquer le profil MDM du portail en priorité sur le
      profil local; et créer le compte local lorsqu’aucun rapprochement fiable
      n’existe.
    - Une désactivation ou un changement de profil dans le portail doit aussi
      être propagé automatiquement à MDM, y compris pour les comptes déjà
      créés. L’endpoint portail existant de consultation des profils vérifie
      déjà le jeton d’application, mais le connecteur MDM et le canal de
      synchronisation continue restent à implémenter et à soumettre en PR.
    - La recette a confirmé que l’authentification Keycloak est acceptée après
      complétion du profil non personnel. Le compte de recette et tous les
      fichiers temporaires ont ensuite été supprimés de Keycloak, HMDM et de
      la VM. Aucun compte réel ni donnée métier n’a été modifié.
    - Aucun déploiement n’a été effectué pour ces exigences; rollback : non
      applicable tant qu’aucune modification applicative n’est fusionnée.

82. Autorité centralisée du portail — 29 juillet 2026
    - Correction utilisateur : le portail est la source d’autorité unique pour
      toutes les applications du portail, présentes et futures, et non pour
      MDM seulement.
    - Le contrat d’intégration commun doit couvrir l’identité de référence,
      l’état actif/inactif, les profils applicatifs et leur propagation. Une
      application ne doit conserver qu’une projection locale technique et ne
      doit pas être l’autorité de ses droits.
    - Les connecteurs existants devront être mis en conformité progressivement;
      MDM est le premier chantier identifié. Toute nouvelle application devra
      implémenter ce contrat avant son activation dans le catalogue.

83. Socle d’autorité applicative du portail — 29 juillet 2026
    - Autorisation utilisateur reçue pour implémenter, fusionner et déployer
      le socle commun. PR #55 fusionnée dans `main` au commit `842e4b0`.
    - Le contrat `docs/APPLICATION_AUTHORITY_CONTRACT.md` définit l’identité,
      le statut, les profils, le rapprochement non ambigu et les obligations
      de synchronisation pour toutes les applications actuelles et futures.
    - L’endpoint portail `POST /api/authorization/profiles` retourne désormais
      l’identité de rapprochement, le statut actif, la décision
      `authorized`, les profils et une révision. Le client OIDC MDM est inclus
      dans la configuration par défaut des clients applicatifs reconnus.
    - Contrôles réussis avant fusion : lint, typecheck, 16 tests Vitest, build
      Next.js et contrôle de diff. Déploiement effectué depuis le commit de
      fusion : seule l’image et le conteneur `portal` ont été recréés; santé
      HTTPS finale HTTP 200. Aucun volume, base, certificat ou secret n’a été
      modifié.
    - Limite constatée : les sources accessibles couvrent MDM et Recrutement;
      les dépôts ou services TDB, GParc, Revue-PDV et CASH-RECON ne sont pas
      présents dans l’infrastructure inspectée. Ils ne peuvent pas être
      déclarés conformes ni déployés sans leurs dépôts/procédures propres.
    - Rollback : redéployer l’image portail construite depuis le commit `main`
      antérieur, puis recréer uniquement le conteneur `portal`; conserver les
      données persistantes.

84. Correction de l’alimentation GParc dans TDB — 30 juillet 2026
    - Prompts utilisateur reçus : « pourquoi dans le TDB je ne vois toujours
      pas de data dans les TDB applicatifs ? » ; « je ne parle pas de RH je
      parle des onglet applicatif de TDB : GParc, Revue-PDV,.. » ; « c'est la
      meme vm que cash-recon tu à deja les clef ssh » ; « 1: l'ongle GParc est
      bien présent, verifie et fait le reste » ; « fait le et authentifie gh »
      ; « c'est validé ».
    - Diagnostic en lecture seule : l’onglet GParc et ses six KPI sont bien
      présents dans le code TDB. Le timer `gparc-tdb-sync.timer` était actif,
      mais la publication échouait en HTTP 401. Le jeton de service portait le
      rôle requis ; le backend TDB déployé n’acceptait que l’audience OCI et
      rejetait l’audience GParc.
    - La branche TDB `codex/modernize-dashboard-kpi`, déjà préparée, a été
      publiée et la PR #17 a été créée, puis fusionnée dans `main` au commit
      `596b44d` (`feat: intégrer les KPI GParc dans TDB`). GitHub CLI a été
      authentifié sur le compte autorisé sans afficher ni versionner de token.
    - Les tests backend (2), le build frontend et `git diff --check` ont réussi.
      Depuis un worktree temporaire du commit fusionné, seuls les conteneurs
      TDB `backend` et `frontend` ont été reconstruits et recréés. La santé
      publique TDB répond HTTP 200 ; les audiences OCI et GParc sont actives
      dans le runtime.
    - Une synchronisation GParc immédiate a ensuite réussi et publié 7 KPI
      agrégés pour la période `2026-07`. Aucune donnée nominative, secret,
      volume SQLite ou base n’a été supprimé ou affiché.
    - Risque restant : le navigateur peut conserver un ancien bundle ; forcer
      un rechargement si l’onglet reste visuellement vide. Rollback :
      reconstruire uniquement backend et frontend depuis le commit `main`
      précédent, puis conserver le volume SQLite et le timer GParc.

85. Correctif écran blanc de la Météo TDB — 30 juillet 2026
    - Le bundle de la nouvelle vue comparative levait l’erreur React #310 :
      `useMemo` était appelé après les retours conditionnels de chargement et
      d’erreur, ce qui changeait l’ordre des hooks entre deux rendus.
    - Le calcul des KPI a été rendu synchrone, sans hook conditionnel. Le
      correctif a été validé par un build frontend réussi (2 308 modules).
    - PR TDB #20 fusionnée dans `main` au commit `6b0a204`. L’image frontend a
      été construite depuis ce commit et seul le conteneur frontend TDB a été
      recréé.
    - Contrôles production réussis : frontend actif, API HTTPS HTTP 200 et
      bundle public `assets/index-BJtbDWJi.js`.
    - Aucun volume, base, secret ni donnée métier n’a été modifié. Rollback :
      reconstruire uniquement le frontend depuis le commit `main` précédent.

86. Refonte enrichie de la Météo directionnelle TDB — 30 juillet 2026
    - La présentation a été reconstruite en s’inspirant de la version
      sauvegardée, tout en conservant l’alimentation dynamique de l’API.
    - La vue affiche une synthèse compacte (R/O global, objectifs, réalisés,
      écarts et alertes), des cartes par domaine et un tableau comparatif
      regroupant dans chaque KPI la période courante, M-1 et N-1. Les données
      N-1 absentes restent explicitement marquées « À injecter ».
    - Un clic sur un KPI ouvre le détail complet de ses valeurs et de son
      historique. La mise en page est responsive et utilise une feuille de
      style isolée.
    - PR TDB #21 fusionnée dans `main` au commit `5542e48`. Le build Vite et
      le build Docker ont réussi ; seul le conteneur frontend TDB a été
      recréé depuis un worktree propre.
    - Contrôles production réussis : API HTTPS en bonne santé, assets
      JavaScript et CSS en HTTP 200, nouveau bundle public
      `assets/index-ecDyf0ih.js`, sans erreur Nginx au démarrage.
    - Aucun volume, base, secret ni donnée métier n’a été modifié. Rollback :
      reconstruire et redéployer uniquement le frontend depuis `6b0a204`.

87. Restauration de la synthèse Météo sauvegardée — 30 juillet 2026
    - À la demande de l’utilisateur, la refonte directionnelle précédente a
      été retirée et `MeteoPage.legacy.jsx`, conservée comme sauvegarde, est
      redevenue la vue Météo active.
    - La restauration remet les cartes « Synthèse par catégorie », les
      compteurs mensuels et trimestriels, les filtres de période et les
      fenêtres de détail de la version sauvegardée.
    - PR TDB #22 fusionnée dans `main` au commit `eb413ca`. Les builds Vite et
      Docker ont réussi ; seul le conteneur frontend a été recréé.
    - Contrôles production réussis : API HTTPS en bonne santé, bundle public
      `assets/index-Cpn0XQxK.js` en HTTP 200, libellés de la sauvegarde présents
      et aucune erreur Nginx détectée.
    - Aucun volume, base, secret ni donnée métier n’a été modifié. Rollback :
      redéployer uniquement le frontend depuis `5542e48`.

88. Restauration exacte de la Météo originale isolée — 30 juillet 2026
    - La sauvegarde `MeteoPage.legacy.jsx` réactivée précédemment contenait à
      tort le bloc ajouté ensuite pour les KPI applicatifs. L’historique Git a
      permis d’identifier `ac76f20` comme la dernière version originale issue
      uniquement du classeur Météo.
    - Le composant de `ac76f20` a été restauré octet pour octet : son hash Git
      `59dc52368f745bb3b452a1c19f06be6ad246e9c7` correspond exactement à
      l’original. Il ne contient aucune référence à Revue-PDV, CASH-RECON,
      GParc, aux KPI applicatifs ou à l’API `/dashboard`.
    - PR TDB #23 fusionnée dans `main` au commit `71df182`. Les builds Vite et
      Docker ont réussi ; seul le conteneur frontend a été recréé.
    - Contrôles production réussis : API HTTPS en bonne santé, bundle public
      `assets/index-DRdNKerA.js` en HTTP 200, libellés caractéristiques de la
      Météo originale présents et aucune erreur Nginx détectée.
    - Aucun volume, base, secret ni donnée métier n’a été modifié. Rollback :
      redéployer uniquement le frontend depuis `eb413ca`.

89. Alignement de la Synthèse Météo sur `Meteo_originale.jpeg` — 30 juillet 2026
    - La capture fournie a permis d’identifier la vue réellement attendue :
      cinq tuiles de synthèse, puis quatre grandes cartes avec barres de
      pourcentage (« Performance globale », « Secteur leader », « Meilleur
      KPI », « Point critique »), suivies des KPI par secteur.
    - La route Météo utilise désormais cette structure et masque le bloc
      « Dernières données » ajouté ultérieurement, afin de conserver l’ordre
      visuel de la capture.
    - Les calculs et cartes Météo sont strictement limités aux secteurs
      historiques Recharge, Canal & Franchises, DOBB, Orange Money et
      Acquisition. Revue-PDV, CASH-RECON et GParc restent dans leurs onglets
      applicatifs et n’influencent plus les pourcentages de la Météo.
    - PR TDB #24 fusionnée dans `main` au commit `99c098c`. Les builds Vite et
      Docker ont réussi ; seul le conteneur frontend a été recréé.
    - Contrôles production réussis : API HTTPS en bonne santé, bundle public
      `assets/index-B3BeivVK.js` en HTTP 200, quatre libellés des cartes
      présents et aucune erreur Nginx détectée.
    - Aucun volume, base, secret ni donnée métier n’a été modifié. Rollback :
      redéployer uniquement le frontend depuis `71df182`.

90. Import des données Météo T3 — 30 juillet 2026
    - Le classeur `Tableau de Bord Météo T3 2026 JUILLET.xlsx` a été analysé :
      les taux mensuels et trimestriels de référence sont portés par l’onglet
      `NOUVEAU TABLEAU`, tandis que les mois futurs du premier onglet sont
      encore à zéro. Aucun montant absent n’a été inventé.
    - Un importeur transactionnel avec dry-run, archivage, historique et audit
      a été ajouté. PR TDB #25 fusionnée dans `main` au commit `628d888`.
      Validation réussie sur une base SQLite temporaire, deux tests backend
      réussis, build frontend réussi et contrôle de diff propre.
    - Avant l’écriture, une sauvegarde SQLite cohérente a été créée dans le
      volume TDB :
      `/app/data/backups/tdb-perf-before-meteo-t3-20260730T105410Z.sqlite`
      (2 801 664 octets).
    - L’import de juillet 2026 a réussi : 15 KPI Météo, objectifs indexés base
      100, taux mensuels et trimestriels extraits du classeur, et performance
      mensuelle consolidée de 84,08 %.
    - Cinq références ont été créées : Packs au cash, Packs à crédit,
      ABO SAT à 120 %, M+1 à 100 % et M+1 à 120 %. L’historique d’import et
      l’audit de production sont présents ; l’API HTTPS reste en bonne santé
      et les logs backend ne signalent aucune erreur.
    - Les données Revue-PDV, CASH-RECON et GParc de la même période restent
      indépendantes et sont exclues des calculs de la Synthèse Météo.
    - Rollback : arrêter les écritures, restaurer la sauvegarde SQLite
      ci-dessus via l’API `better-sqlite3` puis redémarrer uniquement le
      backend ; aucun rollback frontend n’est requis.

91. Détail comparatif des KPI et filtres Météo alignés — 30 juillet 2026
    - Le détail de chaque KPI affiche désormais trois cartes : période
      actuelle, à date M-1 et à date N-1. Chaque période présente l’objectif,
      le réalisé, l’écart, le R/O et l’évolution du réalisé lorsqu’elle est
      calculable.
    - Les périodes absentes sont explicitement affichées « À injecter ». Pour
      juillet 2026, les valeurs T3 sont identifiées comme des indices base 100
      afin de ne pas les présenter comme des montants bruts inexistants.
    - PR TDB #26 fusionnée dans `main` au commit `3c103d6`. Build Vite et build
      Docker réussis ; seul le frontend a été recréé.
    - Les filtres de la Synthèse Météo sont maintenant sur la même ligne que
      « Performance de juillet 2026 » et son sous-titre en affichage desktop.
      Ils repassent sous le titre sous 980 px. Les onglets applicatifs gardent
      leur disposition.
    - PR TDB #27 fusionnée dans `main` au commit `7f0fec7`. Contrôles
      production réussis : API saine, bundle `assets/index-Co9QgrOx.js`, CSS
      `assets/index-DDGW74yc.css`, assets HTTP 200 et aucune erreur Nginx.
    - Aucun volume, secret ou donnée métier n’a été modifié par ces deux
      livraisons frontend. Rollback : redéployer uniquement le frontend depuis
      `628d888` pour retirer les deux évolutions, ou depuis `3c103d6` pour
      retirer seulement l’alignement des filtres.

92. Comparaisons intégrées dans chaque tuile KPI — 30 juillet 2026
    - Le bouton « Voir les montants et comparer » et la fenêtre comparative
      secondaire ont été supprimés.
    - Chaque tuile de détail KPI contient directement trois lignes compactes :
      « À date », « M-1 » et « Année-1 ». Chaque ligne présente l’objectif, le
      réalisé, l’écart et le R/O ; une période non encore alimentée reste
      explicitement marquée « À injecter ».
    - PR TDB #28 fusionnée dans `main` au commit `1066658`. Le build Vite et le
      build Docker ont réussi ; seul le conteneur frontend a été recréé.
    - Contrôles production réussis : API saine, bundle public
      `assets/index-8OpaMfKw.js`, CSS `assets/index-Coihj-zK.css`, assets HTTP
      200, libellés des trois périodes présents, ancien bouton absent et aucune
      erreur Nginx détectée.
    - Aucun volume, secret ou donnée métier n’a été modifié. Rollback :
      redéployer uniquement le frontend depuis `7f0fec7`.

93. Montants Objectif et Résultat des KPI Météo — 30 juillet 2026
    - L’importeur T3 récupère désormais les objectifs et résultats mensuels
      réels dans l’onglet `BASE`, au lieu d’enregistrer ces deux champs sous
      forme d’indices base 100. Un contrôle bloque l’import si le R/O recalculé
      depuis les montants diverge du taux de référence.
    - Les trois lignes « À date », « M-1 » et « Année-1 » affichent directement
      Objectif, Résultat, Écart et R/O. Les KPI monétaires E-Recharge, Cash-in,
      Cash-out et Chiffre d’affaires Orange Money sont libellés et formatés en
      FCFA ; les KPI de volume restent correctement indiqués en unités.
    - Le dry-run a validé les 15 KPI, l’import transactionnel a réussi sur une
      base SQLite isolée, les deux tests backend et le build Vite ont réussi.
      PR TDB #29 fusionnée dans `main` au commit `e240524`.
    - Avant l’écriture en production, une sauvegarde cohérente et intègre a été
      créée :
      `/app/data/backups/tdb-perf-before-kpi-cfa-20260730T113926Z.sqlite`
      (2 838 528 octets).
    - Les 15 KPI de juillet 2026 ont été réimportés depuis le classeur T3. Le
      contrôle post-import confirme notamment Cash-in à 30 551 843 721 FCFA
      d’objectif et 22 070 070 198 FCFA de résultat, ainsi que le chiffre
      d’affaires à 54 470 713 381 / 42 893 974 803 FCFA.
    - Contrôles production réussis : API saine, bundle public
      `assets/index-Cc8etCBL.js`, CSS `assets/index-Coihj-zK.css`, assets HTTP
      200 et aucune erreur frontend/backend.
    - Rollback : restaurer la sauvegarde SQLite ci-dessus puis redéployer
      uniquement le frontend depuis `1066658`.

94. Nature du ratio R/O dans les détails Météo — 30 juillet 2026
    - Le ratio des trois lignes comparatives précise désormais sa nature :
      « R/O Montants » pour les KPI monétaires et « R/O Unités » pour les KPI
      de volume.
    - PR TDB #30 fusionnée dans `main` au commit `7deee4b`. Les deux tests
      backend, le build Vite et le build Docker ont réussi.
    - Seul le frontend a été recréé ; aucune donnée métier ni base n’a été
      modifiée.
    - Contrôles production réussis : API saine, bundle public
      `assets/index-B2f741GK.js`, CSS `assets/index-Coihj-zK.css`, assets HTTP
      200, deux libellés présents et aucune erreur Nginx.
    - Rollback : redéployer uniquement le frontend depuis `e240524`.

95. Alignement de l’axe du graphique sur 100 % — 30 juillet 2026
    - L’axe vertical du graphique « Performance globale par indicateur » utilise
      désormais des graduations fixes par pas de 25 %, avec une graduation
      explicite à 100 %.
    - La ligne pointillée est fixée sur cette graduation et porte le libellé
      « Objectif 100 % ». La borne supérieure reste dynamique afin d’afficher
      sans écrêtage les KPI qui dépassent l’objectif.
    - PR TDB #31 fusionnée dans `main` au commit `f33aa32`. Les deux tests
      backend, le build Vite et le build Docker ont réussi.
    - Seul le frontend a été recréé ; aucune donnée métier ni base n’a été
      modifiée.
    - Contrôles production réussis : API saine, bundle public
      `assets/index-K2PjIXK6.js`, CSS `assets/index-Coihj-zK.css`, assets HTTP
      200, libellé d’objectif présent et aucune erreur Nginx.
    - Rollback : redéployer uniquement le frontend depuis `7deee4b`.

96. Lisibilité des graduations verticales du graphique — 30 juillet 2026
    - La marge gauche négative du graphique « Performance globale par
      indicateur » a été remplacée par une marge positive de 8 px et un
      espacement de 6 px a été ajouté entre l’axe et ses libellés.
    - La zone de tracé est ainsi légèrement réduite afin que les graduations à
      trois chiffres, notamment 100 %, 125 % et 150 %, ne soient plus
      tronquées.
    - PR TDB #32 fusionnée dans `main` au commit `e5d1024`. Les deux tests
      backend, le build Vite et le build Docker ont réussi.
    - Seul le frontend a été recréé ; aucune donnée métier ni base n’a été
      modifiée.
    - Contrôles production réussis : API saine, bundle public
      `assets/index-CK0J1r_C.js`, CSS `assets/index-Coihj-zK.css`, assets HTTP
      200 et aucune erreur Nginx.
    - Rollback : redéployer uniquement le frontend depuis `f33aa32`.

97. Rétablissement du SSO Portail vers TDB sur mobile — 30 juillet 2026
    - Symptôme signalé en navigation privée sur smartphone : l’ouverture de
      TDB depuis le portail déclenchait le SSO automatiquement, puis affichait
      « Profil TDB introuvable ou inactif » avant toute action utile sur
      l’écran de connexion.
    - Diagnostic : le correctif de la PR TDB #16 était bien présent dans
      `main`, mais le backend de production utilisait encore une image
      construite avant ce correctif. Cette ancienne image attendait uniquement
      un profil objet `{ key }` et rejetait les clés texte actuellement
      renvoyées par le portail.
    - Le backend a été reconstruit depuis le `main` courant `e5d1024` puis
      recréé sans modification du volume SQLite. L’image active
      `sha256:e89e6d81c030433bdaf490e58443091c24131e8b42439f8157a73212cb0f9a86`
      contient bien la compatibilité profil texte / ancien format objet.
    - Le frontend a ensuite été recréé sans reconstruction afin que Nginx
      résolve la nouvelle adresse interne du backend ; le 502 transitoire
      observé juste après le remplacement du backend a ainsi été supprimé.
    - Contrôles réussis : deux tests backend, build Docker backend, santé HTTPS,
      configuration OIDC active, redirection Keycloak HTTP 302, cookie d’état
      `Secure; SameSite=Lax` et aucune erreur backend/frontend.
    - Aucun secret, volume ou donnée métier n’a été modifié. Rollback :
      réactiver l’ancienne image backend
      `sha256:ca5049f43c07c9e5e3b131f4be38d533a688a2ea088b32af96ddc58fdd01a386`,
      puis recréer le backend et le frontend.

98. Accès à l’administration Keycloak depuis le portail — 30 juillet 2026
    - Le bandeau « Actions disponibles » de `/admin` propose désormais un
      bouton « Administrer Keycloak », qui ouvre dans un nouvel onglet la
      console du realm `tad-groupe`.
    - Le bouton n’est rendu que dans la page déjà protégée côté serveur par le
      rôle `PORTAL_ADMIN`. Il ne délègue aucun privilège : Keycloak continue
      d’exiger ses propres droits d’administration.
    - L’affichage est responsive : les boutons Keycloak et retour au tableau
      de bord occupent proprement la largeur disponible sur smartphone.
    - PR Portail-TID #56 fusionnée dans `main` au commit `2ba16ff`.
      Validations réussies : Prettier, ESLint, TypeScript, 16 tests Vitest,
      build Next.js, `git diff --check` et les trois contrôles GitHub
      `quality`, `build` et `repository-check`.
    - L’image de production active est
      `sha256:868bc82d9869075d7b2414c20b893929ad76dda12b5af0d0b897f94ae12698ee`.
      Seul le service portail a été recréé ; PostgreSQL, Keycloak, Caddy et les
      volumes sont restés inchangés.
    - Contrôles production réussis : portail `healthy`, `/health` en HTTP 200,
      `/admin` protégé par redirection OIDC, console Keycloak en HTTP 200,
      libellé du bouton présent dans le conteneur et aucun log d’erreur.
    - Rollback : réactiver l’image portail précédente
      `sha256:d139f6577fe7c6252ac32cb2f0a8e0f617eaddc2db6deed76b3987300c038825`
      puis recréer uniquement le service portail.

99. Synchronisation automatique du `sub` Keycloak — 30 juillet 2026
    - Lorsqu’une fiche portail est préparée avant la création du compte
      Keycloak avec l’e-mail comme `sub` provisoire, le portail remplace
      désormais automatiquement ce placeholder par l’UUID signé lors de la
      première connexion réussie.
    - La réconciliation est limitée à une fiche unique dont l’e-mail et le
      placeholder correspondent exactement au nom d’utilisateur Keycloak, ou
      à un e-mail OIDC vérifié. Elle refuse les doublons, les conflits de
      `sub` et les fiches contenant déjà un véritable identifiant.
    - La mise à jour est transactionnelle et crée l’événement d’audit
      `PORTAL_USER_SUBJECT_RECONCILED`.
    - PR Portail-TID #57 fusionnée dans `main` au commit `a718fee`.
      Validations réussies : Prettier, ESLint, TypeScript, build Next.js,
      `git diff --check`, 21 tests Vitest dont 5 scénarios de réconciliation,
      et les trois contrôles GitHub `quality`, `build` et
      `repository-check`.
    - L’image de production active est
      `sha256:6f974d6e4254269ee3455baabe7bd81e37d33163fec1d65d57b35eee0333e720`.
      Seul le service portail a été recréé ; PostgreSQL, Keycloak, Caddy et les
      volumes sont restés inchangés.
    - Contrôles production réussis : portail `healthy`, `/health` en HTTP 200,
      `/admin` protégé par redirection OIDC, logique d’audit présente dans le
      conteneur et aucun log d’erreur.
    - Rollback : réactiver l’image portail précédente
      `sha256:868bc82d9869075d7b2414c20b893929ad76dda12b5af0d0b897f94ae12698ee`
      puis recréer uniquement le service portail. Les UUID déjà réconciliés
      restent valides et ne nécessitent aucune annulation.

100. Provisionnement TDB et changement de compte SSO — 30 juillet 2026
    - Cause du refus TDB après authentification : Keycloak, le portail et le
      profil TDB étaient valides, mais TDB exigeait encore qu’un administrateur
      crée manuellement un compte local actif portant le même e-mail.
    - TDB provisionne désormais ce compte à la première connexion SSO
      autorisée. Le compte est créé sans mot de passe local et reçoit
      exclusivement le rôle TDB renvoyé par le portail. Un compte local
      désactivé n’est jamais réactivé automatiquement.
    - Le provisionnement et la connexion sont journalisés séparément. Les
      connexions suivantes synchronisent le rôle du compte existant.
    - PR TDB #33 fusionnée dans `main` au commit `c12b133`. Cinq tests backend
      et le build frontend ont réussi. L’image backend active est
      `sha256:a70131cdcb5428863429dfd0dafa70ba54c1182d77b91e969a1021997a1fb8e8`.
      L’API et la page publique répondent correctement.
    - Le portail propose maintenant « Changer de compte ». Cette action
      supprime la session locale puis relance Keycloak avec `prompt=login`, ce
      qui permet de saisir une autre identité sans fenêtre de navigation
      privée. La barre utilisateur reste compacte sur smartphone.
    - PR Portail-TID #58 fusionnée dans `main` au commit `9b0d8a0`.
      Validations réussies : Prettier, ESLint, TypeScript, 21 tests Vitest,
      build Docker et contrôles GitHub `quality`, `build` et
      `repository-check`.
    - L’image portail active est
      `sha256:9053f79377d27a3c9072aecd3f9ab0ca0c9e7d1c4793a74140f4b7d34a4cd06b`.
      Le portail est `healthy`, `/health` répond en HTTP 200 et la nouvelle
      route redirige vers Keycloak avec `prompt=login`.
    - Aucun secret, mot de passe, volume ou donnée métier n’a été modifié.
      Rollback : réactiver l’image TDB
      `sha256:e89e6d81c030433bdaf490e58443091c24131e8b42439f8157a73212cb0f9a86`
      et/ou l’image portail
      `sha256:6f974d6e4254269ee3455baabe7bd81e37d33163fec1d65d57b35eee0333e720`,
      puis recréer uniquement les services concernés. Un compte TDB déjà
      provisionné peut rester présent sans permettre une connexion locale,
      puisqu’il ne possède pas de mot de passe.

101. KPI adaptés aux particularités applicatives TDB — 31 juillet 2026
    - Prompt utilisateur : « Dans TDB, pour les onglets applicatif les KPI ne
      sont pas adapté au particularitées applictives ; revoit les indicateurs
      de chaque applications et adapte à leur particularitées ».
    - Objectif : remplacer la lecture générique des onglets applicatifs par
      des indicateurs propres à Revue-PDV, CASH-RECON, Recrutement OCI et
      GParc, sans inventer d’objectif ou mélanger des unités incompatibles.
    - VM/répertoire : VM TDB/Revue-PDV/CASH-RECON `135.125.132.51`, dépôt
      `/home/debian/TDB-TID`; travail isolé dans
      `/tmp/tdb-app-kpis`, branche `codex/adapt-application-kpis`.
    - Audit agrégé en lecture seule de la base TDB : seuls les identifiants,
      libellés, périodes, valeurs et unités des KPI applicatifs ont été
      consultés. Aucun compte, secret, `.env` ou donnée nominative n’a été lu.
    - Revue-PDV présente désormais la couverture du réseau, les visites du
      jour, les tournées approuvées, le backlog et le taux d’approbation.
      CASH-RECON sépare collectes, mix Orange Money, besoin cash, équilibre
      des zones et écarts détectés.
    - Recrutement OCI sépare les flux Kits/OM/OMA, le traitement et les rejets
      de fichiers, les First Call et le montant OMA. GParc sépare parc,
      carburant, entretien, demandes d’achat et alertes, avec calcul du coût
      moyen du litre lorsqu’il est possible.
    - Les mesures de flux sont additionnées sur les périodes multiples; les
      mesures d’état, notamment taille du parc, backlog et alertes, conservent
      leur dernière valeur. Un ratio n’est affiché que si ses données et son
      dénominateur sont disponibles.
    - Contrôles réussis : 3 tests unitaires ciblés, 5 tests backend, build
      frontend Vite de 2 309 modules et `git diff --check`. L’avertissement
      historique de taille du bundle reste non bloquant. Aucune dépendance
      n’a été installée et aucun lockfile n’a été modifié.
    - Commit TDB `9c1c5f5`; branche poussée et PR brouillon TDB #34 créée.
      Aucun conteneur, volume, base ou service de production n’a été modifié.
    - Risque restant : les ratios métier doivent être confirmés en recette
      fonctionnelle par les responsables applicatifs. Après revue et fusion
      dans `main`, le déploiement du seul frontend TDB nécessite une
      confirmation explicite de l’utilisateur.
    - Rollback : reconstruire et recréer uniquement le frontend depuis le
      commit `main` précédent; conserver la base SQLite et le volume
      `tdb_data`.

102. Déploiement des KPI applicatifs TDB — 31 juillet 2026
    - Prompt utilisateur : « je confirme ».
    - La confirmation autorise la livraison préparée dans la PR TDB #34. La
      PR était déjà fusionnée dans `main` au commit
      `a23cbace290d94aa210e756c72493bee84e52d62`.
    - VM/répertoire : VM TDB/Revue-PDV/CASH-RECON `135.125.132.51`, dépôt
      `/home/debian/TDB-TID`; construction depuis le worktree propre
      `/tmp/tdb-deploy-a23cbac`, sans utiliser les modifications locales du
      checkout de production.
    - Le commit fusionné a été revalidé avant livraison : 3 tests unitaires
      des KPI applicatifs, 5 tests backend, build frontend Vite et
      `git diff --check` réussis. L’avertissement de taille du bundle reste
      connu et non bloquant.
    - L’image frontend précédente
      `sha256:d6299413b64dce3faede5a79f8b542fb55eccc7be716b8eba4f7292bb1d1a2a9`
      est conservée sous le tag
      `tdb-tid-frontend:rollback-pre-app-kpis-20260731`.
    - Nouvelle image frontend active :
      `sha256:855f701d75e6c9ee6da86b9decc06420578191e8d4dff63c93b0941e2e301b3f`.
      Seul le conteneur `frontend` a été recréé; le backend est resté actif
      sur son image et son démarrage antérieurs. La base SQLite, le volume
      `tdb_data`, les secrets et les données métier n’ont pas été modifiés.
    - Contrôles production réussis : frontend local HTTP 200, page publique
      `https://tdb.tadgroupe.com/` HTTP 200, API `/api/health` HTTP 200,
      libellés spécifiques Revue-PDV, CASH-RECON, Recrutement OCI et GParc
      présents dans le bundle actif, et aucun log d’erreur au démarrage.
    - Risque restant : la pertinence fonctionnelle des ratios doit être
      confirmée par les responsables applicatifs lors de leur utilisation.
    - Rollback : retaguer l’image
      `tdb-tid-frontend:rollback-pre-app-kpis-20260731` comme image frontend
      active, puis recréer uniquement `frontend`; ne toucher ni au backend,
      ni à la base SQLite, ni au volume `tdb_data`.
