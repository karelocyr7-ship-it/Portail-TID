# Intégration OIDC HMDM

Cette intégration cible l’image HMDM `headwindmdm/hmdm:0.1.7`, qui télécharge
le panneau Headwind MDM 5.30.3. Elle ajoute un flux Authorization Code avec le
realm Keycloak `tad-groupe`.

Le callback valide l’état, le nonce, l’issuer, l’audience, la signature RSA
JWKS et l’expiration du jeton. L’e-mail Keycloak doit correspondre à un compte
HMDM déjà existant ; aucun compte ni mot de passe n’est créé automatiquement.

## Paramètres de déploiement

À fournir uniquement par l’environnement de la VM MDM, jamais dans Git :

```text
oidc.enabled=true
oidc.issuer=https://portail.tadgroupe.com/auth/realms/tad-groupe
oidc.client.id=tad-mdm
oidc.client.secret=<secret Keycloak>
oidc.redirect.uri=https://mdm.tadgroupe.com/rest/public/oidc/callback
```

Le client Keycloak doit limiter exactement son callback à l’URL ci-dessus et
son origine web à `https://mdm.tadgroupe.com`.

## Construction validée

La source HMDM v5.30.3 avec le contenu de `hmdm-5.30.3/` a été compilée dans
un conteneur Maven Java 8. L’artefact de test produit avait l’empreinte :

`85624c6b617d9934e39ed3d47e8373584f112bd8694bcec8bea0312eff2620e0`

Le déploiement reste soumis à fusion dans `main`, sauvegarde de l’artefact et
validation fonctionnelle avec un compte Keycloak non personnel. Le rollback
consiste à remettre l’ancienne URL/ancienne archive HMDM dans le volume de
travail puis redémarrer le service `hmdm-app`.
