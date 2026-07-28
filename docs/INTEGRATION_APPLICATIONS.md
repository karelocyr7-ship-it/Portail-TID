# Intégration des applications

Les applications initiales sont introduites comme entrées configurables du
catalogue. Les rôles/profils de TDB, Revue-PDV, CASH-RECON, ATF et HMDM ont été relevés
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
- ATF : `traccar.tc_users` (`administrator`, `readonly`, `limitcommands`,
  `disablereports`). Les combinaisons effectivement présentes sont
  administrateur, utilisateur standard, observateur et observateur restreint.
- HMDM/MDM : rôles Headwind MDM Community (`ADMIN`, `USER`, `OBSERVER`) ;
  URL initiale : `https://mdm.tadgroupe.com`.

MDM est désormais au niveau 2 : le portail ouvre l’application externe, et
HMDM propose un flux OIDC Authorization Code côté serveur avec le client
Keycloak confidentiel `tad-mdm`. Aucun identifiant ni mot de passe local n’est
transmis par le portail; l’e-mail Keycloak doit correspondre à un utilisateur
HMDM déjà existant. La validation navigateur complète avec un compte de test
non personnel reste à effectuer.

## Application effective des profils

La sélection d’un profil dans le portail contrôle actuellement l’accès au
catalogue et l’habilitation enregistrée pour le compte Keycloak. Les
applications TDB, Revue-PDV, CASH-RECON et ATF continuent toutefois de vérifier
leur rôle local en base après le retour OIDC. Pour rendre la sélection du
portail autoritaire, chaque application doit consommer l’affectation centrale
(ou un claim Keycloak synchronisé) dans son middleware serveur, avec une
livraison séparée et réversible. Le portail ne modifie pas directement les
bases de production des applications.
