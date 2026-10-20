# Initialisation atomique des accès SIRH

Extension autorisée et déployée le 18/10/2026. Keycloak **26.6.2 uniquement**,
PostgreSQL obligatoire. Aucune source amont modifiée, aucune dépendance Java
supplémentaire embarquée. Compilation avec les bibliothèques exactes de l'image.
Les SPI internes sont sensibles aux versions : retester avant toute mise à jour.

Le service-account désigné par `TAD_INITIAL_ACCESS_CLIENT_ID` doit posséder
`realm-management/manage-users`. La ressource est limitée au realm
`TAD_INITIAL_ACCESS_REALM`. Aucun token, mot de passe ou corps de requête n'est
journalisé. La table additive `TAD_INITIAL_ACCESS` contient uniquement des
identifiants techniques, génération, version de credential et état d'activation.

Toutes les écritures locales de mot de passe dans ce realm prennent un verrou
transactionnel PostgreSQL par utilisateur. Les écritures natives hors opération
d'initialisation rendent l'état irréversiblement protégé. Une suppression
ultérieure du credential ne rend pas le compte de nouveau initialisable.
Une génération croissante et un UUID d'opération empêchent les reprises retardées
d'écraser un provisoire plus récent. Une répétition identique vérifie le secret
avec le fournisseur de hash natif, sans login ni renouvellement.

Un compte préexistant sans credential requiert une reprise RH explicite,
un subject attendu identique et UPDATE_PASSWORD. Un compte fédéré, désactivé,
ambigu ou possédant un credential personnel n'est jamais réinitialisé ici.
Les rôles et périmètres existants restent intacts. Un conflit concurrent natif
peut demander au titulaire de renvoyer son formulaire ; il n'est jamais présenté
comme un succès silencieux. Tout changement natif du credential, même technique,
protège conservativement le compte ; la reprise RH peut alors être refusée.

## Recette et livraison

- `node scripts/test-keycloak-initial-extension.mjs` : comptes synthétiques,
  PostgreSQL tmpfs et Keycloak isolé ; aucun mail.
- `node scripts/test-initial-access-live.mjs` : véritable portail isolé et
  navigateur, première connexion, changement obligatoire, reconnexion.
- `TEST_SIRH_CHAIN=1 node scripts/test-initial-access-live.mjs` ajoute le clone
  restauré SIRH, canal TLS signé, panne et reprise RH. Le certificat de test est
  public, sa clé privée reste en mémoire. Ne pas activer de traces réseau.

Après PR/fusion, contrôles, sauvegarde vérifiée et restauration isolée prouvée :
`scripts/deploy-keycloak-initial-access.sh` depuis main propre, puis déploiement
portail documenté, puis SIRH. Prévoir une brève indisponibilité SSO au redémarrage.
Ne jamais exploiter des instances Keycloak avec et sans garde simultanément.

Rollback : désactiver d'abord le relais SIRH en remettant son image précédente,
puis sélectionner l'image Keycloak précédente avec `KEYCLOAK_IMAGE` et le même
script. Conserver la table additive et tous les mots de passe définis depuis la
livraison : aucune restauration de base ni suppression de compte. Geler les
déploiements automatiques pendant le rollback, puisque Compose référence la
candidate par défaut. Avant réactivation, vérifier toutes les versions des
credentials ; ne jamais contourner un statut protégé.
