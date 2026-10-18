# Relais initial SIRH — candidate atomique du 18 octobre 2026

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
