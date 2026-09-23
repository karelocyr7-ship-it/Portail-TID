# E-mails transactionnels OVH — Portail TAD Groupe

> **État : audit et plan préparatoire uniquement.** Aucun mot de passe, aucune
> dépendance, migration, file d’attente ou connexion authentifiée n’a été
> ajouté à ce stade. Aucun e-mail n’a été envoyé.

## Architecture auditée

Le dépôt est un monorepo pnpm (`pnpm@10.12.1`) avec une application Next.js
16.2.11/TypeScript dans `apps/portal`. Les routes API et l’administration
vivent dans cette application. Prisma 7.9.0 utilise PostgreSQL 16.10 via
Docker Compose (`compose.yml`). Zod 4.4.3 est déjà présent et sera utilisé
pour valider la configuration SMTP. Aucun client SMTP ni worker e-mail n’est
présent actuellement.

La branche de travail dédiée est `feature/smtp-ovh-notifications`.

## Résultat de la connectivité réseau

Le test non authentifié suivant a été exécuté depuis l’environnement du
portail, sans identifiant ni mot de passe :

```sh
openssl s_client \
  -starttls smtp \
  -connect smtp.mail.ovh.net:587 \
  -servername smtp.mail.ovh.net \
  -verify_return_error
```

Résultat observé : résolution DNS réussie, port 587 accessible, négociation
STARTTLS réussie en TLS 1.2, certificat validé (`Verification: OK`). Cette
vérification ne prouve pas encore l’authentification OVH ; celle-ci devra être
réalisée uniquement après fourniture contrôlée du secret et validation
explicite avant tout envoi réel.

Le port 25 ne doit jamais être utilisé. Aucun serveur SMTP local (Postfix,
Exim ou Sendmail) ne doit être installé.

## Configuration de production prévue

Le mot de passe sera fourni exclusivement dans le fichier externe suivant,
qui ne doit pas être créé avec une valeur fictive en production :

```text
/srv/tad/secrets/portal.env
```

Permissions attendues :

```sh
chmod 600 /srv/tad/secrets/portal.env
```

Noms de variables prévus (valeurs secrètes absentes du dépôt) :

```dotenv
SMTP_ENABLED=true
SMTP_HOST=smtp.mail.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=notification@tadgroupe.com
SMTP_PASSWORD=CHANGE_ME
SMTP_FROM_EMAIL=notification@tadgroupe.com
SMTP_FROM_NAME=Portail TAD Groupe
SMTP_REPLY_TO=
SMTP_CONNECTION_TIMEOUT_MS=10000
SMTP_GREETING_TIMEOUT_MS=10000
SMTP_SOCKET_TIMEOUT_MS=20000
SMTP_MAX_MESSAGES_PER_HOUR=120
SMTP_MAX_CONCURRENCY=1
SMTP_MAX_ATTEMPTS=5
SMTP_TEST_RECIPIENT=
```

Le fichier sera injecté uniquement par Compose avec `env_file` ; il ne sera
jamais copié dans Git, une image Docker, un artefact ou un journal. Les
commandes d’exploitation devront éviter tout affichage global de variables
d’environnement.

## Plan d’implémentation soumis à validation

### Fichiers à créer

- `apps/portal/lib/email/config.ts` — validation Zod sans divulgation de secret ;
- `apps/portal/lib/email/transporter.ts` — transporteur Nodemailer singleton,
  STARTTLS, certificat obligatoire et limites de connexion ;
- `apps/portal/lib/email/send-email.ts`, `types.ts`, `errors.ts` — API typée,
  validation des en-têtes/destinataires, texte + HTML et corrélation ;
- `apps/portal/lib/email/templates/*` — modèles sobres, accessibles et
  équivalents texte/HTML ;
- `apps/portal/lib/email/worker.ts` — worker séquentiel, reprise des verrous,
  backoff et arrêt propre ;
- `apps/portal/app/api/admin/email/*` et page d’administration protégée
  `PORTAL_ADMIN` ;
- `apps/portal/prisma/migrations/*_email_outbox/` — migration additive après
  validation explicite de son SQL ;
- tests unitaires du client, des templates, de l’outbox, du verrouillage et
  des autorisations ;
- scripts/commandes `smtp:verify`, `smtp:test`, inspection et gestion de file.

### Fichiers à modifier

- `apps/portal/prisma/schema.prisma` — modèle `EmailOutbox`, statuts, index et
  idempotence ;
- `compose.yml` — variables SMTP non secrètes du portail et service
  `mail-worker`, sans port publié ;
- `apps/portal/package.json` et le lockfile pnpm — ajout de Nodemailer avec
  version stable explicitement épinglée après contrôle de maintenance ;
- éventuellement `Makefile` (absent du dépôt audité) ou scripts pnpm pour les
  commandes d’exploitation ;
- documentation Keycloak, templates, dépannage et sécurité DNS lors de la
  phase d’implémentation.

### Dépendances

Zod est déjà installé et ne sera pas dupliqué. La seule dépendance runtime
prévue est Nodemailer, avec sa version stable compatible avec Node.js défini
par `apps/portal/Dockerfile`; les types TypeScript associés seront ajoutés si
la version retenue ne les fournit pas. Aucune installation n’a été faite
pendant cet audit.

### Base de données et fiabilité

Le modèle `EmailOutbox` sera ajouté de manière additive avec une clé
`idempotencyKey` unique, les statuts `PENDING`, `PROCESSING`, `SENT`, `RETRY`,
`FAILED`, `CANCELLED`, les champs de tentative/verrouillage et les index
nécessaires. Le worker prendra les messages avec une transaction PostgreSQL
et `FOR UPDATE SKIP LOCKED` (via requête Prisma adaptée), puis marquera
`SENT` uniquement après l’acceptation SMTP.

Avant toute migration, le SQL généré sera affiché et contrôlé pour confirmer
qu’il n’exécute aucune suppression ou modification destructive. La migration
sera réalisée uniquement après validation explicite.

### Sécurité et limites

- `secure: false`, `requireTLS: true`, `rejectUnauthorized: true`, TLS
  minimum 1.2, `name: portail.tadgroupe.com` ;
- une connexion et un message à la fois ; maximum 120 messages/heure et
  10/minute ;
- expéditeur imposé `notification@tadgroupe.com`, nom `Portail TAD Groupe` ;
- rejet de CR/LF dans sujet, adresses et en-têtes ; destinataires validés et
  masqués dans les logs ;
- aucune pièce jointe par défaut, aucun secret/token dans le payload ou le
  message ;
- test SMTP réservé à `PORTAL_ADMIN`, limité en fréquence et audité ;
- aucun accès au socket Docker, aux clés SSH ou aux secrets d’autres services.

### Retour arrière

Le retour arrière prévu est : arrêter le seul service `mail-worker`, désactiver
`SMTP_ENABLED`, puis revenir à l’image applicative précédente. La migration
étant additive, elle ne sera pas annulée automatiquement ; une éventuelle
suppression de schéma nécessitera une décision séparée et une sauvegarde
PostgreSQL vérifiée.

## Keycloak et délivrabilité

Une procédure séparée documentera la configuration SMTP du realm Keycloak sans
inscrire le mot de passe dans l’export JSON. Le secret sera lu depuis
`/srv/tad/secrets/portal.env` uniquement par l’opération d’administration.

La mise en œuvre devra aussi vérifier ou documenter SPF, DKIM et DMARC chez
OVH. Aucune zone DNS ne sera modifiée automatiquement. Une seule entrée SPF
devra être conservée.

## Étapes après validation

1. valider ce plan et fournir le secret par le mécanisme externe prévu ;
2. ajouter Nodemailer et les modules de configuration/tests ;
3. afficher puis valider la migration Prisma additive ;
4. implémenter l’outbox, le worker, l’administration et les templates ;
5. exécuter lint, typecheck, tests et build sans envoi réel ;
6. exécuter `npm run smtp:verify` (connexion, STARTTLS, authentification,
   fermeture, sans message) ;
7. demander une adresse de test et une validation explicite avant
   `smtp:test` ;
8. déployer via PR fusionnée, avec vérification du worker et possibilité de
   retour arrière.

