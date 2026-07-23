# Administration

L’espace `/admin` permet aux utilisateurs portant le rôle Keycloak
`PORTAL_ADMIN` de :

- référencer un compte portail par son identifiant Keycloak `sub` ;
- activer ou désactiver ce compte sans stocker de mot de passe ;
- sélectionner, application par application, les profils déclarés dans le
  catalogue ;
- consulter et modifier les habilitations enregistrées.

La section **Comptes et profils applicatifs** affiche un répertoire filtrable
par nom ou e-mail, avec des filtres pour les comptes actifs et désactivés. Un
clic sur une fiche ouvre directement son formulaire d’édition et affiche le
nombre de profils qui lui sont affectés. La navigation latérale expose aussi
un accès direct à cette section via `/admin#comptes`.

Les profils persistés dans `ApplicationProfile` sont synchronisés depuis les
définitions de rôles versionnées des applications TDB, Revue-PDV et
CASH-RECON. Chaque profil conserve sa provenance (`sourceSystem`,
`sourceReference`, `syncedAt`). Cette synchronisation ne copie ni les comptes,
ni les mots de passe, ni les données personnelles des applications externes.
Les applications externes conservent leurs propres autorisations et doivent
continuer à valider leurs rôles côté serveur.

Chaque création ou modification de compte est inscrite dans `AuditLog`. Les
migrations Prisma doivent être appliquées par la procédure de livraison ; ne
pas modifier directement la base de production.

Les URL du catalogue restent modifiables uniquement depuis l’administration ;
aucune URL métier réelle n’est inventée dans le dépôt.
