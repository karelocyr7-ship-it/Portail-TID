# Keycloak

## Configuration locale validée

- Realm : `tad-groupe`
- Thème : `keycloak.v2`
- Client : `tad-portal`, confidentiel, flux Authorization Code activé
- Redirection : `https://portail.tadgroupe.com/*`
- Découverte OIDC :
  `https://portail.tadgroupe.com/auth/realms/tad-groupe/.well-known/openid-configuration`
- Groupes métier : `PORTAL_ADMIN`, `DIRECTION`, `FINANCE`, `SUPERVISEUR`,
  `AGENT_TERRAIN`, `GESTIONNAIRE_PARC`, `AUDITEUR`, `RH`, `INFORMATIQUE`.

Le secret du client reste uniquement dans `.env`, protégé en `0600`; aucun
mot de passe ou secret ne doit figurer dans cet export ou dans Git. Les rôles
et groupes sont prêts pour le branchement OIDC côté portail.
