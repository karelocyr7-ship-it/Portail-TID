# Contrat d’accès et d’autorité applicative

Le portail gère l’identité, l’accès à une application et la visibilité de ses
tuiles. Chaque application gère ses propres rôles et permissions. Le portail
ne transmet aucun rôle applicatif lors de l’authentification ou du
provisionnement.

## Vérification d’accès

`POST /api/authorization/profiles` accepte le jeton OIDC de l’application :

```json
{ "application": "CODE_APPLICATION", "idToken": "OIDC_ID_TOKEN" }
```

Après vérification du jeton, la réponse contient l’identité nécessaire au
rapprochement et un booléen d’accès. Elle ne contient ni `profiles`, ni
`primaryProfile` :

```json
{
  "lookup": true,
  "subject": "…",
  "identity": { "employeeId": "…", "email": "…" },
  "active": true,
  "authorized": true,
  "revision": "2026-10-19T00:00:00.000Z"
}
```

Une application refuse l’accès si le compte portail est inactif ou si
`authorized` est faux. Une réponse réseau invalide ou indisponible échoue
fermée. Après l’accès, les décisions de rôle et de permission reposent
uniquement sur les données et réglages locaux de l’application.

## Provisionnement

Les messages de provisionnement contiennent l’application, les informations
d’identité utiles et `enabled`. Ils ne contiennent jamais de profil ou de rôle.
Une synchronisation met à jour l’identité et l’état actif d’un compte existant
sans modifier ses rôles locaux. Un nouveau compte reçoit le rôle local le plus
limité prévu par l’application et un administrateur le configure dans cette
application.

La désactivation portail retire l’accès à l’application; elle ne transforme
pas le rôle local. Les connecteurs doivent appliquer l’état `enabled` sans
écrire dans les champs de rôle ou de permission.

## Contrôles avant livraison

Tester séparément la réponse d’autorisation sans profils, le maintien du rôle
local à la reconnexion, la préservation des rôles lors d’une mise à jour de
provisionnement, le rôle initial limité d’un nouveau compte et la révocation
d’accès. Déployer les consommateurs avant le portail afin que tous acceptent
ce contrat, puis vérifier la santé de chaque application et du portail.

Le retour arrière se fait par la procédure de livraison documentée de chaque
application. Un retour d’image ne restaure pas les rôles locaux déjà modifiés;
aucune restauration ou suppression de base n’est requise.
