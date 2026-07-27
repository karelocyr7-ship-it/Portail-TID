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
