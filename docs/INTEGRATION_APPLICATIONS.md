# Intégration des applications

Les applications initiales sont introduites comme entrées configurables du
catalogue. Les rôles/profils de TDB, Revue-PDV et CASH-RECON ont été relevés
depuis leurs dépôts présents sur la VM distante et sont versionnés dans le
seed Prisma avec leur provenance. La synchronisation porte uniquement sur la
définition des profils, jamais sur les comptes ou les mots de passe.

Niveaux : 1) lien externe, 2) OIDC Keycloak, 3) API et indicateurs intégrés.
Le portail ne stockera jamais les identifiants personnels des anciennes
applications.

Sources actuellement intégrées :

- TDB : `backend/src/routes/users.js:roles` ;
- Revue-PDV : `db/init.sql:users.role` et
  `api/src/lib/branches.js:DEFAULT_BRANCHES` ;
- CASH-RECON : `api/src/routes/users.routes.js:USER_ROLES`.
