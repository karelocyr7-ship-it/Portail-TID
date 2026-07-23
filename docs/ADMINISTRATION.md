# Administration

L’espace `/admin` permet aux utilisateurs portant le rôle Keycloak
`PORTAL_ADMIN` de :

- référencer un compte portail par son identifiant Keycloak `sub` ;
- activer ou désactiver ce compte sans stocker de mot de passe ;
- sélectionner, application par application, les profils déclarés dans le
  catalogue ;
- consulter et modifier les habilitations enregistrées.

Les profils persistés dans `ApplicationProfile` constituent le catalogue de
profils connu du portail. Ils ne sont pas une découverte automatique des bases
des applications externes : une API ou un contrat d’intégration devra être
fourni par chaque application pour synchroniser ses profils réels. Les
applications externes conservent leurs propres autorisations et doivent
continuer à valider leurs rôles côté serveur.

Chaque création ou modification de compte est inscrite dans `AuditLog`. Les
migrations Prisma doivent être appliquées par la procédure de livraison ; ne
pas modifier directement la base de production.

Les URL du catalogue restent modifiables uniquement depuis l’administration ;
aucune URL métier réelle n’est inventée dans le dépôt.
