# Administration

L’espace `/admin` permet aux utilisateurs portant le rôle Keycloak
`PORTAL_ADMIN` de :

- créer un compte utilisateur à partir de son identité métier et de son
  adresse e-mail ; le compte Keycloak est provisionné automatiquement ;
- activer ou désactiver ce compte sans stocker de mot de passe ;
- attribuer automatiquement le profil minimal de chaque application active ;
- consulter les habilitations enregistrées.

Les profils minimaux sont définis dans le catalogue et ne sont pas choisis par
le navigateur. Une demande idempotente est inscrite dans
`ApplicationProvisioningOutbox` pour chaque application ; le connecteur de
l’application crée ou synchronise ensuite son compte local avec ce profil.
Les administrateurs des applications restent responsables de l’affinage des
droits après cette création initiale.

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
