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
