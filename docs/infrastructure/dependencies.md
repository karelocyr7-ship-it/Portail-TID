# Dépendances entre applications

## Intégrations confirmées

- Portail → chaque application : liens du catalogue ; le portail ne transmet
  pas les mots de passe des applications.
- Portail → Keycloak → applications OIDC : clients et callbacks documentés
  pour les applications déjà intégrées.
- Revue-PDV et CASH-RECON → TDB : collecte horaire d’agrégats vers l’API TDB.
- GParc → TDB : collecte horaire d’agrégats via un client de service ; aucune
  donnée nominative ne doit être transférée.
- Recrutement OM & Telco → portail/Keycloak : intégration OIDC préparée,
  parcours de production à confirmer.

## À confirmer

- ATF : dépôt, API, propriétaire et flux sortants non identifiés.
- MDM : dépôt source Git et contrat de déploiement reproductible à confirmer.
- Correspondances détaillées de rôles entre les sept applications.

Chaque flux doit être validé dans le code, la configuration ou une
documentation de l’application avant automatisation.
