# Contrat d’autorité applicative

Le portail TAD est la source d’autorité pour chaque application inscrite au
catalogue, présente ou future. Une application ne possède pas sa propre
politique de droits : elle conserve au plus une projection locale de l’état
décidé par le portail.

## Identité et rapprochement

Le connecteur d’une application vérifie d’abord le jeton OIDC émis pour son
client. Il demande ensuite l’autorisation au portail. Pour un compte local
existant, le rapprochement est fait dans cet ordre : matricule, e-mail, puis
nom complet exact et non ambigu. Une absence de rapprochement permet une
création locale seulement si le portail renvoie un compte actif et au moins un
profil pour l’application.

Un rapprochement ambigu est refusé : un connecteur ne doit jamais choisir un
compte sur la seule base d’un nom approchant.

## Endpoint commun

`POST /api/authorization/profiles` accepte :

```json
{ "application": "CODE_APPLICATION", "idToken": "OIDC_ID_TOKEN" }
```

Le jeton doit être signé par le realm TAD, destiné au client déclaré pour
l’application, non expiré et émis pour l’issuer configuré. La réponse ne
contient aucun jeton :

```json
{
  "lookup": true,
  "subject": "…",
  "identity": { "employeeId": "…", "email": "…" },
  "active": true,
  "authorized": true,
  "profiles": ["PROFILE_KEY"],
  "primaryProfile": "PROFILE_KEY",
  "revision": "2026-07-29T00:00:00.000Z"
}
```

`authorized` est vrai uniquement si le compte portail est actif et possède au
moins un profil actif pour l’application. Une réponse non autorisée désactive
l’accès applicatif et invalide la projection locale au prochain contrôle.

## Synchronisation

Chaque connecteur interroge ce contrat à l’ouverture de session et avant toute
action privilégiée. Il applique sans exception le statut et les profils
renvoyés. Le champ `revision` permet d’éviter les écritures locales inutiles.

Un connecteur doit aussi proposer une synchronisation planifiée des comptes
locaux connus afin de propager les désactivations même lorsque l’utilisateur
ne se reconnecte pas. La fréquence et le mécanisme d’authentification de ce
traitement sont définis par le connecteur; les secrets d’exécution restent
hors du dépôt.

## Admission d’une nouvelle application

Avant son activation dans le catalogue, une nouvelle application doit :

1. disposer d’un client OIDC dédié ;
2. déclarer son code et son client dans la configuration du portail ;
3. consommer cet endpoint et appliquer les profils portail ;
4. documenter son mapping de profils, sa synchronisation et son rollback ;
5. fournir des tests de création, changement de profil et désactivation.

## Sélection du profil applicatif

`profiles` contient les profils actifs attribués, dans un ordre déterministe.
`primaryProfile` est le premier de cette liste, ou `null` sans autorisation.
Les connecteurs historiques qui prennent le premier élément bénéficient ainsi
de la même sélection que le provisioning. Aucun profil absent des attributions
n'est ajouté et les permissions ne sont pas fusionnées.

Priorités de sélection (de gauche à droite) :

| Application | Profils                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| REVUE-PDV   | super_admin, admin, ro, rc, sup_orange, rz, auditeur                                                   |
| CASH-RECON  | ADMIN, DAF, DG, TRESORIER, CASH_MANAGER, VIEWER                                                        |
| TDB         | ADMIN, MANAGER, SUPERVISOR, DIRECTION, VIEWER                                                          |
| GPARC       | ADMIN, DAF, CHAUFFEUR_GESTIONNAIRE, GESTIONNAIRE, CHAUFFEUR                                            |
| MDM         | ADMIN, USER, OBSERVER                                                                                  |
| ATF         | ADMIN, USER, OBSERVER, OBSERVER_LIMITED                                                                |
| RECRUTEMENT | RECRUT_OCI_ADMIN, RECRUT_OCI_GESTIONNAIRE, RECRUT_OCI_RO, RECRUT_OCI_SUPERVISEUR, RECRUT_OCI_DIRECTION |

Cette priorité détermine le profil d'ouverture, pas une hiérarchie universelle
de permissions. Pour les autres applications, l'ordre du catalogue
`ApplicationProfile.displayOrder` s'applique, puis la clé départage les égalités.
Les profils non répertoriés restent présents après les profils répertoriés.
Un compte inactif reçoit une liste vide, `primaryProfile: null` et
`authorized: false`.

Le worker relit les attributions actives avant chaque envoi. Une ancienne tâche
qui contient un profil remplacé ne doit pas rétablir ce profil. La suppression
d'un seul profil conserve l'accès si un autre profil actif reste attribué ;
la suppression de tous les profils ou la désactivation du compte retire l'accès.
Le profil conservé dans un message de désactivation est uniquement une valeur
technique historique : `enabled` reste faux.

## Validation et livraison de la sélection

Tests ciblés sans dépendances :
`node --test apps/portal/tests/application-profile-priority.node.mjs`.
Ils vérifient les sept politiques, l'indépendance de l'ordre des attributions,
l'absence d'élévation depuis un profil unique, le catalogue de secours et les
comptes sans autorisation. Ils ne remplacent pas les tests d'intégration API,
Prisma, worker et de connexion réelle.

Avant fusion, exécuter `make lint`, `make typecheck`, `make test`, `make build`
et la compilation `build:worker` dans l'environnement prévu. Déployer ensemble
le portail et le worker par la procédure du README, après validation et
confirmation. Aucune migration de schéma n'est nécessaire.

Contrôler après livraison, avec des comptes de test autorisés, le profil obtenu
à la reconnexion et après provisioning pour chaque application. Revue-PDV,
CASH-RECON et TDB ont des consommateurs du contrat identifiés dans le code ;
les autres connecteurs restent à vérifier de bout en bout. Une application
qui ignore ce contrat ne bénéficie pas automatiquement de cette correction.
Les sessions déjà ouvertes peuvent conserver leur profil jusqu'au prochain
contrôle. Aucun traitement massif des comptes ni changement Android n'est inclus.

Rollback : rétablir les images précédentes du portail et du worker par la
procédure du README, sans supprimer de données ni de volumes. Les projections
applicatives déjà mises à jour ne sont pas annulées par un retour d'image ;
les contrôler puis les resynchroniser depuis les attributions du portail si
nécessaire. Ne pas restaurer une base pour annuler cette seule modification.
