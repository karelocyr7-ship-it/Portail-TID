# GLPI : accès persistant et création automatique

## Comportement

`PortalUser.glpiAccess` est un booléen non nullable, par défaut `true`.
La migration initialise les anciennes fiches à `true`. Une valeur explicitement
`false` est conservée par les éditions ultérieures, y compris les formulaires
ne contenant pas le champ GLPI et les synchronisations RH.

Le formulaire utilise un marqueur de présence séparé : absence de marqueur =
conserver la valeur ; marqueur présent sans case cochée = enregistrer `false`.
La tuile et l’API d’autorisation respectent ce choix, même pour PORTAL_ADMIN.
La case reste affichée indépendamment de la présence d’un profil catalogue GLPI.

La sauvegarde admin, l’API d’identité SIRH et l’API de première activation SIRH
mettent la création GLPI en file dans la même transaction. La migration met
également en file toutes les anciennes fiches portant un matricule (y compris
les fiches inactives), ainsi que les fiches actives sans matricule. Le profil catalogue `ACCESS`
sert seulement de référence technique à la file, sans attribution de rôle.
Le worker relit l’accès, l’activité du compte et de l’application avant chaque
tentative. Tous les comptes avec matricule doivent exister dans GLPI. Si le
compte portail est inactif ou son accès GLPI décoché, l’identité manquante est
créée désactivée. Pour les comptes sans matricule, un accès décoché ne provoque
aucun appel GLPI. Le choix enregistré n’est jamais recoché par ce traitement.

Le connecteur REST v1 recherche le login et l’e-mail avec comparaison exacte,
enregistre le matricule dans `registration_number` à la création,
crée uniquement les comptes absents et refuse les rapprochements ambigus,
les e-mails ou matricules déjà associés à un autre login. Un compte existant localement
inactif est conservé tel quel ; si un accès actif est demandé, le connecteur
signale cet état à traiter par un administrateur GLPI au lieu de le réactiver.
Les nouvelles identités utilisent `Auth::EXTERNAL` sans mot de passe local.
GLPI applique lui-même ses règles/profil par défaut. Aucun rôle GLPI n’est
fourni ni modifié par le portail. Les comptes existants ne sont pas réactivés,
renommés ou fusionnés automatiquement.

Décocher retire la visibilité et l’autorisation côté portail. Cela ne supprime
ni ne désactive le compte local GLPI et ne révoque pas une session GLPI déjà
ouverte. Les droits, l’accès direct et les sessions propres à GLPI restent sous
le contrôle de son administrateur et de son intégration SSO.

## Configuration à prévoir lors de la livraison

Variables du worker décrites dans `.env.example` (ne jamais versionner leurs
valeurs réelles) :

- `GLPI_API_URL` : base HTTPS de l’API v1, terminée par `/apirest.php`.
- `GLPI_API_APP_TOKEN`, `GLPI_API_USER_TOKEN` : client API et compte de service
  autorisés à rechercher les utilisateurs/e-mails et créer une identité.
- `GLPI_LOGIN_ATTRIBUTE` : `email` ou `sageId`, obligatoirement identique au
  login recherché par le SSO GLPI. Pas de valeur implicite.

Aucun paramétrage GLPI de production n’est effectué par ce changement.
Sans configuration complète, la file reste `WAITING_CONFIG`, réessayée toutes
les cinq minutes. Les autres erreurs suivent les reprises bornées du worker
puis `FAILED`; une nouvelle sauvegarde remet le job GLPI en attente et remet
ses tentatives à zéro. Le worker n’enregistre pas les corps de réponse GLPI,
les en-têtes d’authentification ou les URL dans les erreurs du connecteur.

## Tests automatisés et recette isolée

Les tests unitaires couvrent le rendu du formulaire, les défauts neuf/ancien,
le décochage, les éditions sans champ GLPI, les points d’entrée RH, la création
sans rôle/mot de passe, l’idempotence, les conflits et la configuration absente.

La recette supplémentaire utilise de vrais PostgreSQL 16 et GLPI 11.0.11 /
MariaDB 11.4.13 dans des conteneurs séparés. Réseau Docker interne, aucun port
publié, aucun volume ou fichier d’environnement de production monté. Les
seuls comptes manipulés sont synthétiques (`example.invalid`). Les jetons
publics de fixture ne doivent jamais être utilisés hors de ce réseau de test.

Depuis `apps/portal`, avec les images déjà disponibles localement :

```sh
node scripts/start-glpi-isolated.mjs
node scripts/test-glpi-isolated.mjs
```

Les références des images GLPI/MariaDB peuvent être fournies via
`GLPI_FIXTURE_WEB_IMAGE` / `GLPI_FIXTURE_DB_IMAGE` pour utiliser les images
locales identifiées par digest. Le script refuse de télécharger une image.
Il ne remplace pas un conteneur/réseau existant portant le même nom.

Le runner crée une nouvelle base dédiée à chaque exécution, applique les
migrations précédentes, insère une ancienne fiche synthétique, puis applique
la migration GLPI. Il teste la sauvegarde réelle et le rechargement via Prisma,
le catalogue et l’API, l’absence d’appel pour un compte sans matricule décoché,
la création désactivée des matricules décochés ou inactifs, puis la création
d’un compte dans GLPI et un second passage sans duplication. Le transport est
redirigé uniquement dans le test vers l’HTTP du conteneur isolé ; le connecteur
livré exige HTTPS et refuse les redirections.

Les conteneurs peuvent ensuite être arrêtés explicitement sans suppression :

```sh
sudo docker stop portal-glpi-fixture-20261020-web portal-glpi-fixture-20261020-db portal-glpi-fixture-20261020-pg
```

## Livraison et retour arrière

Livraison uniquement après contrôles, revue/fusion et autorisation, via la
procédure `EXPLOITATION.md`, avec sauvegarde et migration Prisma. Une fois le
connecteur configuré, les jobs issus de la migration créeront les comptes
manquants : vérifier auparavant le mapping SSO, le profil par défaut GLPI et
le périmètre du compte API. Contrôler la file et la santé du worker après livraison.

Le retour arrière complet vers l’ancienne version rétablit son comportement
GLPI forcé pour tous : il ne respecte donc plus les décochages. Pour conserver
ces choix en cas d’incident du connecteur, suspendre ce connecteur et garder
la nouvelle lecture du booléen, plutôt que revenir à l’ancienne interface.
Ne pas supprimer la colonne ni les comptes GLPI créés. Les rôles locaux ne sont
jamais modifiés par le connecteur et aucune restauration GLPI n’est automatique.

## Résultat de validation du 20 octobre 2026

| Contrôle                                                        | Résultat                                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `make lint`                                                     | Réussi                                                                                                                             |
| `make typecheck`                                                | Réussi                                                                                                                             |
| `make test`                                                     | 104 tests Vitest + 8 tests Node réussis ; recette externe exclue de cette commande                                                 |
| `pnpm format:check`                                             | Réussi                                                                                                                             |
| `make build`                                                    | Réussi ; 10 avertissements Turbopack sur les accès fichiers des modules `agent-reports` / `agent-runtime`, non modifiés par ce lot |
| `pnpm --filter portal run build:worker`                         | Réussi                                                                                                                             |
| `pnpm --filter portal exec node scripts/test-glpi-isolated.mjs` | 6 tests réussis, dont la recette réelle PostgreSQL + GLPI                                                                          |
| `node --check apps/portal/scripts/start-glpi-isolated.mjs`      | Réussi                                                                                                                             |
| `git diff --check`                                              | Réussi                                                                                                                             |

La recette réelle vérifie aussi la mise en file par la migration, y compris les
matricules inactifs, et la relecture de l’accès par le worker après décochage. Aucun compte réel, rôle local,
fichier de configuration GLPI de production ou fichier `.env` réel n’a été
consulté ou modifié pour cette recette. Aucune livraison en production n’est
réalisée dans ce lot. Les trois conteneurs de recette ont été arrêtés après
validation, sans supprimer leurs données.

Fichiers concernés (chemins relatifs au dépôt) :

- Formulaire et sauvegarde : `apps/portal/components/user-management.tsx`,
  `apps/portal/app/admin/page.tsx`, `apps/portal/app/admin/actions.ts`.
- Lecture et autorisation : `apps/portal/lib/portal-users.ts`,
  `apps/portal/lib/catalog-db.ts`,
  `apps/portal/app/api/authorization/profiles/route.ts`.
- Entrées RH côté portail :
  `apps/portal/app/api/provisioning/sirh/users/route.ts`,
  `apps/portal/app/api/provisioning/sirh/initial-access/route.ts`.
- File et connecteur : `apps/portal/lib/provisioning/glpi-access.ts`,
  `apps/portal/lib/provisioning/glpi.ts`,
  `apps/portal/lib/provisioning/worker.ts`.
- Base : `apps/portal/prisma/schema.prisma`,
  `apps/portal/prisma/migrations/20261020150000_persistent_glpi_access/migration.sql`.
- Tests : `apps/portal/tests/glpi-access.test.ts`,
  `apps/portal/tests/glpi-connector.test.ts`,
  `apps/portal/tests/glpi-isolated.test.ts`,
  `apps/portal/tests/sirh-provisioning-route.test.ts`,
  `apps/portal/tests/sirh-initial-access-route.test.ts`.
- Recette isolée : `apps/portal/scripts/start-glpi-isolated.mjs`,
  `apps/portal/scripts/test-glpi-isolated.mjs`,
  `apps/portal/scripts/fixtures/glpi.php`.
- Configuration d’exemple, documentation et exclusions des artefacts compilés :
  `.env.example`, `.gitignore`, `docs/ADMINISTRATION.md`, ce document.
