# Livraison des thèmes de connexion Keycloak

Les thèmes `tad-login` et `tad-login-v2` sont montés en lecture seule depuis
`infrastructure/keycloak/themes`. Leur cache est rechargé en recréant seulement
Keycloak, sans toucher au portail ni à ses comptes.

Après fusion dans `main` et validation des contrôles, mettre à jour le checkout
de livraison, puis lancer :

```sh
sudo env PORTAL_COMPOSE_ENV_FILE=/srv/tad/portail/.env bash scripts/deploy-keycloak-theme.sh
```

Le script vérifie la branche et le commit, sauvegarde les bases et fichiers
opérationnels, recrée Keycloak, attend son healthcheck et son endpoint OpenID,
puis vérifie que `/api/auth/login` affiche `Connexion`, centre le titre et sert
la feuille de style compacte. En cas d’échec, il restaure les fichiers de
messages, les gabarits de pied de page et les deux feuilles CSS du commit parent
puis recrée Keycloak ; le checkout est laissé modifié pour rendre ce rollback
visible.

Les deux variantes du thème doivent définir `loginAccountTitle`. `loginTitle`
seul ne change pas l’intitulé affiché dans l’en-tête du formulaire de connexion.
