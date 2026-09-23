# Opérations de sécurité

Les procédures de gestion des secrets, permissions, journaux, mises à jour,
pare-feu, sauvegardes et incidents seront complétées avant la mise en service.

Ne jamais afficher un `.env` réel, un token, un mot de passe ou une clé privée.

## Provisionnement Keycloak des utilisateurs

La création d’un nouvel utilisateur depuis l’administration du portail peut
provisionner le compte dans Keycloak et récupérer son `sub` automatiquement.
Cette opération utilise un client confidentiel dédié, avec le flux
`client_credentials` et uniquement les droits Keycloak nécessaires à la
gestion des utilisateurs du realm. Les variables suivantes doivent rester
dans le fichier de secrets d’exécution du portail, jamais dans Git :

- `KEYCLOAK_ADMIN_CLIENT_ID`
- `KEYCLOAK_ADMIN_CLIENT_SECRET`

Le compte créé n’a pas de mot de passe stocké dans le portail ; Keycloak doit
gérer l’action initiale `UPDATE_PASSWORD`. En cas d’erreur après la création
Keycloak, vérifier l’existence du compte avant toute nouvelle tentative afin
d’éviter les doublons.
