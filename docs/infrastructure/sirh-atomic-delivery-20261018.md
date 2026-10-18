# Relais initial SIRH — livraison atomique du 18 octobre 2026

## Livraison portail et Keycloak, 19 h 14 UTC

PR #106 et #107 fusionnées ; version applicative déployée :
`d5bdf1ac8f1a5b97b852a03fdd8682e93d73cef8`. Image portail/2 workers
`tad-portal:d5bdf1ac8f1a`, image Keycloak
`tad-keycloak:initial-access-26.6.2-v1`. Santé portail et découverte OIDC HTTP
200, workers running. Sonde authentifiée Keycloak vide refusée avant toute
opération utilisateur ; garde atomique disponible. Sonde HTTPS/HMAC depuis le
SIRH de production refusée en validation de contrat (400), donc liaison signée
effective, sans création ni modification de compte.

Sauvegardes de bascule : `tad-20261018T191041Z.tar.gz` (Keycloak),
`tad-20261018T191222Z.tar.gz` (portail, 6/6 empreintes vérifiées).
Restauration effective des trois bases isolées réussie avant bascule depuis
`tad-20261018T184919Z.tar.gz`. Retour portail par `scripts/rollback.sh`, image
`tad-portal:rollback-20261018T191224Z-404ce31f9652cb681657ffe429f677a3dba95c1d4545f3f330730bb6bdd8397f`.
Retour Keycloak vers l'image 26.6.2 d'origine
`sha256:f9ba7b2af90db8dc749a57ca9aedca51e840cb9224441ab546a968da941da900`,
uniquement après retour SIRH et arrêt du nouveau relais.

Complément de recette finale : 57 tests ciblés SIRH, chaîne intégrée réelle
salarié sans e-mail, reprise après panne, prestataire et stagiaire. Scan des
vrais payloads RQ (y compris sérialisation binaire compressée) et journaux :
aucune occurrence des secrets synthétiques après correction. Le test navigateur
de présentation RH intercepte seulement l'endpoint de reprise pour empêcher
le clone Web de joindre le connecteur de production ; le relais serveur réel
est testé séparément avec TLS/HMAC sous les permissions RH synthétiques.
Le parcours navigateur Keycloak/portail, lui, n'est pas simulé.

## SIRH livré et reprise RH disponible

PR SIRH #10–11, main `46b8656cd795e2b675c24ce052a4779efed0ac5c`, HRMS 0.4.129.
Six services sur `srih-ged/hrms:atomic-initial-access-0.4.129-20261018`, image
`sha256:355c640a16d4755582434ef6f574551f07c92e36d55281e60a5f00002669452b`.
Migration et santé finales réussies, JS/CSS HTTP 200 ; Drive .36 inchangé.
Backup `/home/debian/SIRH/backups/20261018T191651Z`, 11/11 empreintes.
Restauration préalable du backup 185027Z en MariaDB isolée : 919 tables HRMS,
274 tables Drive. Procédure RH et rollback SIRH : `INITIAL_ACCESS_DELIVERY.txt`
dans le dépôt SIRH. Retour HRMS vers `reconciled-password-reset-20261018` avec
`scripts/deploy_password_reset.sh` avant tout retrait du relais portail/Keycloak.

TID1000 relu après livraison : fiche active unique, login activé, génération 0 ;
Keycloak activé, zéro credential et UPDATE_PASSWORD en attente. Aucun reset ou
essai sur ce compte. La reprise RH est livrée : Personnel > Employés > TID1000 >
Accès portail, confirmer puis remettre le provisoire affiché une seule fois.
La remise RH et le choix du mot de passe personnel par le titulaire restent
à effectuer ; ne pas confondre mécanisme livré et compte déjà activé.

Les états « candidat/non déployé » ci-dessous sont des notes historiques.

Autorisation explicite : extension Keycloak, branches/PR de cette correction,
fusion et déploiement après contrôles. Aucun push direct sur main. Les changements
locaux préexistants du portail et de la VM SIRH sont conservés hors livraison.

## Diagnostic et correctif

L'API Admin REST native ne fournit pas de précondition atomique pour reset-password.
Contrôler un credential puis l'écrire séparément expose à une activation personnelle
concurrente. L'extension versionnée apporte une transaction PostgreSQL et une garde
commune aux écritures natives, sans modifier les sources amont. Table additive sans
mot de passe, token ni hash. Le portail ne fait aucun repli vers un reset non gardé
pour les opérations du nouveau protocole.

SIRH conserve les métadonnées d'opération avant transmission HTTPS/HMAC. Un nonce
protège le rejeu et une génération persistante protège les réponses perdues ou
requêtes retardées. Reprise explicite RH pour un legacy sans credential, uniquement
si le subject lié correspond et UPDATE_PASSWORD est en attente. Les credentials
personnels, rôles et accès existants sont préservés.

## Contrôles réalisés, exclusivement synthétiques

- Portail : lint, typecheck, 77 tests Vitest + 12 tests Node, build webpack réussis.
- Extension isolée PostgreSQL : service-account/realm, provisoire natif,
  idempotence, reissue, rejeu, protection après mot de passe personnel et même
  après suppression du credential personnel, reprise legacy et 12 courses
  concurrentes réussis. Certaines courses produisent un conflit natif explicite,
  avec renvoi du formulaire nécessaire, jamais une réussite suivie d'écrasement.
- Vrai navigateur : provisoire, changement obligatoire sans e-mail, session
  portail, refus ancien provisoire, identité synchronisée, tentative de reissue
  refusée et connexion personnelle suivante réussis.
- Clone SIRH restauré : création sans e-mail, TLS avec validation du certificat,
  signature, panne laissant la fiche persistée, reprise RH de génération suivante,
  périmètre société et absence de mot de passe dans les arguments de jobs.
- Recherche des secrets synthétiques dans les journaux portail/Keycloak capturés :
  aucune occurrence. Aucun courriel réel, aucun essai sur un utilisateur réel.

TID1000 contrôlé en lecture seule : activé, zéro credential,
VERIFY_EMAIL/UPDATE_PASSWORD. Aucun reset effectué. La remise du nouveau provisoire
doit être faite dans l'interface RH, une fois la livraison achevée, sans secret
dans cette documentation ou la conversation. Recontrôler l'état juste avant.

## Ordre de livraison et retour

1. PR, main propre, contrôles techniques, sauvegardes vérifiées et preuve de
   restauration isolée. Aucun fichier .env réel lu/copié/modifié.
2. `scripts/deploy-keycloak-initial-access.sh` depuis main propre : build exact,
   backup, bascule Keycloak seulement, santé et découverte OIDC. Brève interruption
   SSO possible ; pas de suppression des sessions ou des comptes.
3. `scripts/deploy.sh` : portail et workers uniquement, contrôles santé.
4. SIRH `scripts/deploy_initial_access.sh` depuis l'archive fusionnée vérifiée :
   migration additive avant bascule, six services HRMS, santé et bundles HTTP 200.
   Drive reste distinct et inchangé.

Rollback : arrêter d'abord le relais en revenant à l'image SIRH précédente,
puis aux images portail/Keycloak précédentes si nécessaire. Conserver les tables,
comptes et mots de passe personnels nouveaux ; ne pas restaurer la base sur des
écritures nouvelles. Pas de cluster mélangeant Keycloak avec et sans la garde.
Tout futur changement de version Keycloak impose une nouvelle recette SPI.

État à cette entrée : candidat testé, non fusionné et non déployé.

## Première tentative de bascule et garde de santé

PR #106 fusionnée dans ad9f76d. Tentative Keycloak du 18/10 : sauvegarde
tad-20261018T185910Z.tar.gz, santé Docker atteinte mais découverte publique 503 ;
retour automatique à l'image amont précédente réussi, découverte publique 200.
SIRH non basculé. Le contrôle existant cherchait simplement UP dans la réponse,
ce qui accepte aussi un composant UP quand l'état global est DOWN. Le correctif
de procédure impose désormais HTTP 200 sur readiness et une attente bornée de
la découverte publique, sans contourner le rollback en cas d'échec persistant.

Le contrôle complémentaire SIRH a détecté la sérialisation native de l'objet User
avec son attribut privé de provisoire dans create_contact. La livraison SIRH
reste conditionnée au correctif et au scan effectif des jobs RQ, pas seulement
à l'inspection de leurs arguments affichables.
