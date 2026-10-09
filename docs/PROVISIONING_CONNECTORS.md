# Connecteurs de provisioning applicatif

Le portail conserve la mécanique historique de connexion de chaque application
(OIDC Keycloak ou authentification locale). Le worker de provisioning ajoute un
flux séparé, déclenché uniquement après l’attribution d’une application par un
administrateur du portail.

## Contrat commun

Chaque application peut exposer un endpoint interne ou HTTPS :

```text
POST /api/provisioning/users
Content-Type: application/json
x-sirh-provisioning-token: <secret partagé>
```

Le corps contient `application`, `profile`, `sage_id`, `email`, `first_name`,
`last_name` et `enabled`. L’application doit créer ou synchroniser uniquement
le compte minimal demandé par `profile`; elle conserve ensuite la gestion de
ses droits fonctionnels. `enabled=false` désactive l’accès lors d’une
révocation portail.

Le endpoint doit être idempotent sur `sage_id`, puis sur l’adresse e-mail,
retourner un statut `2xx` en cas de succès et ne jamais retourner de mot de
passe. Le secret doit être stocké uniquement dans le gestionnaire de secrets
de l’application.

## Variables du portail

Les variables suivent le nom du code applicatif, avec les tirets remplacés par
des underscores : `TDB_PROVISIONING_URL`, `CASH_RECON_PROVISIONING_URL`,
`REVUE_PDV_PROVISIONING_URL`, `GPARC_PROVISIONING_URL`,
`ATF_PROVISIONING_URL`, `MDM_PROVISIONING_URL`, `SIRH_PROVISIONING_URL` et
`RECRUTEMENT_PROVISIONING_URL`, accompagnées de la variable `_TOKEN`.

GED conserve ses variables historiques `DRIVE_PROVISIONING_URL` et
`DRIVE_PROVISIONING_TOKEN`.

Une application non configurée reste dans l’état `WAITING_CONFIG`; son job
n’est pas supprimé et sera repris après ajout de l’URL et du secret. Les flux
OIDC et locaux existants restent inchangés.

## Déploiement côté application

Pour chaque application, il reste à ajouter la route adaptatrice qui traduit
le profil minimal vers son modèle local, puis à livrer cette route sur sa VM.
Cette étape est volontairement séparée du portail : elle doit être revue par
le propriétaire de l’application et ne doit pas contourner ses contrôles
d’autorisation.
