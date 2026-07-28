# Intégration OIDC HMDM

Cette intégration cible l’image HMDM `headwindmdm/hmdm:0.1.7`. Le dépôt conserve
l’overlay source initialement préparé sur HMDM 5.30.3; la VM MDM utilise
actuellement HMDM 5.38.1 et l’overlay a été adapté à cette version avant
déploiement. Elle ajoute un flux Authorization Code avec le realm Keycloak
`tad-groupe`.

Le bandeau authentifié conserve un lien `Portail` vers
`https://portail.tadgroupe.com/` pour revenir au portail centralisé.

Le callback valide l’état, le nonce, l’issuer, l’audience, la signature RSA
JWKS et l’expiration du jeton. L’e-mail Keycloak doit correspondre à un compte
HMDM déjà existant ; aucun compte ni mot de passe n’est créé automatiquement.
Après validation, le callback crée aussi le cookie de profil de session attendu
par l’interface Angular. Sa valeur est URL-encodée et ne contient ni
`authToken`, ni token OIDC, ni mot de passe.

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

La source amont HMDM v5.38.1 a été compilée dans un conteneur Maven Java 17
avec les ajouts de `hmdm-5.30.3/` adaptés sans retirer les protections natives.
L’artefact déployé du 24 juillet 2026 a l’empreinte :

`4215f1df9f1847b13cb5da1dc1df4924b12ce3b8b1d667077ef0ad377e87d2cc`

Le déploiement a été effectué après fusion dans `main`, avec sauvegarde de
l’artefact et de `ROOT.xml`. La validation fonctionnelle complète nécessite
encore un compte Keycloak de test non personnel correspondant à un utilisateur
HMDM existant. Le rollback est documenté dans `README.txt` et consiste à
restaurer la sauvegarde horodatée puis redémarrer `hmdm-app`.
