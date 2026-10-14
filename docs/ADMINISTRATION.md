# Administration

L’espace `/admin` permet aux utilisateurs portant le rôle Keycloak
`PORTAL_ADMIN` de :

- recevoir la création ou la mise à jour d’un utilisateur depuis le SIRH avec
  son identifiant Sage et son adresse e-mail ; le compte Keycloak est
  provisionné automatiquement si nécessaire ;
- activer ou désactiver ce compte sans stocker de mot de passe ;
- attribuer les applications autorisées à l’utilisateur ; le portail demande
  alors la création du compte applicatif avec le profil minimal ;
- consulter les habilitations enregistrées.

Les profils minimaux sont définis dans le catalogue. Une demande idempotente
est inscrite dans ApplicationProvisioningOutbox pour chaque application
sélectionnée ; le connecteur de l’application crée ou synchronise ensuite son
compte local avec ce profil. Les administrateurs des applications restent
responsables de l’affinage des droits fonctionnels après cette création
initiale.

## Onboarding SIRH

Le SIRH appelle POST /api/provisioning/sirh/users avec un JSON contenant
sageId, email, displayName et éventuellement phone ou keycloakSubject. La
requête est signée avec HMAC-SHA256 :

- X-SIRH-Timestamp contient l’époque Unix en secondes ;
- X-SIRH-Signature contient sha256= suivi de la signature de timestamp.body.

Le secret partagé reste uniquement dans la configuration d’exécution du SIRH
et du portail. L’onboarding rapproche d’abord l’utilisateur par ID Sage, puis
par e-mail uniquement si la correspondance est unique. Les profils minimaux
ne sont pas attribués automatiquement. L’onboarding crée ou met à jour
l’identité Portail et son compte Keycloak sans changer les accès applicatifs
existants. Un administrateur du Portail doit ensuite sélectionner explicitement
les applications et profils autorisés; chaque sélection produit une demande
de provisionnement dédiée.

La section **Comptes et profils applicatifs** affiche un répertoire filtrable
par nom ou e-mail, avec des filtres pour les comptes actifs et désactivés. Un
clic sur une fiche ouvre directement son formulaire d’édition et affiche le
nombre de profils qui lui sont affectés. La navigation latérale expose aussi
un accès direct à cette section via `/admin#comptes`.

Les profils persistés dans `ApplicationProfile` sont synchronisés depuis les
définitions de rôles versionnées des applications TDB, Revue-PDV, CASH-RECON et
HMDM. Chaque profil conserve sa provenance (`sourceSystem`,
`sourceReference`, `syncedAt`) et le profil minimal porte `isDefault=true`.
Cette synchronisation ne copie ni les comptes, ni les mots de passe, ni les
données personnelles des applications externes.
Les applications externes conservent leurs propres autorisations et doivent
continuer à valider leurs rôles côté serveur.

Chaque création ou modification de compte est inscrite dans `AuditLog`. Les
migrations Prisma doivent être appliquées par la procédure de livraison ; ne
pas modifier directement la base de production.

Les URL du catalogue restent modifiables uniquement depuis l’administration ;
aucune URL métier réelle n’est inventée dans le dépôt.

## Connecteurs de provisionnement

Le worker charge les paramètres de connecteurs depuis
`/srv/tad/secrets/portal-provisioning-connectors.env` en plus de
`portal.env`. Ce fichier facultatif doit rester hors Git, appartenir à
l’utilisateur d’exploitation et être protégé en mode `0600`. Il contient les
variables `<APPLICATION>_PROVISIONING_URL` et
`<APPLICATION>_PROVISIONING_TOKEN` pour CASH-RECON, GPARC et RECRUITMENT.
Chaque application reçoit le même jeton que son connecteur portail, par son
propre fichier de secrets runtime. Les valeurs ne doivent jamais être
affichées dans les journaux ni ajoutées au dépôt.
