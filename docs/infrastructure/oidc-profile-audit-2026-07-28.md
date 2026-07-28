# Audit des profils OIDC applicatifs — 2026-07-28

## Résultat

Le portail contient les profils TDB actifs et le compte administré dispose du
profil `ADMIN`. Le flux TDB recherchait uniquement le `keycloakSubject` stocké
dans le portail. Une recréation ou une resynchronisation d'un utilisateur
Keycloak pouvait donc produire « Profil TDB introuvable ou inactif » malgré une
adresse e-mail OIDC vérifiée et une affectation valide.

Le portail utilise maintenant le sujet OIDC en priorité, puis l'adresse e-mail
vérifiée comme repli lorsque aucun sujet ne correspond. Le sujet enregistré
n'est pas modifié implicitement.

## Périmètre des applications

| Application | Flux contrôlé | Même défaut constaté | Action |
|---|---|---:|---|
| TDB | Appel de `/api/authorization/profiles` | Oui | Corrigé côté portail |
| CASH-RECON | Utilisateur local recherché par e-mail après validation OIDC | Non | Aucune modification |
| Revue-PDV | Utilisateur local recherché par e-mail après validation OIDC | Non | Aucune modification |
| GParc | Utilisateur local recherché par e-mail après validation OIDC | Non | Aucune modification |
| MDM | Utilisateur local recherché par e-mail après validation OIDC | Non | Aucune modification |
| ATF | Aucun flux OIDC comparable trouvé dans le dépôt audité | Non déterminé | À confirmer |
| Recrutement OM & Telco | Aucun flux OIDC comparable trouvé dans le dépôt audité | Non déterminé | À confirmer |

## Contrôles exécutés

- Portail : lint, typecheck, tests (7/7) et build réussis.
- TDB : tests backend réussis (2/2) ; build frontend non exécutable, dépendance
  `vite` absente du miroir.
- CASH-RECON : 4 tests réussis, 6 suites bloquées par des dépendances absentes
  (`express`, `bcryptjs`, `mysql2`). Aucune installation n'a été effectuée.
- Revue-PDV : 6 tests réussis, 6 scénarios conditionnels ignorés.
- GParc et MDM : aucun test automatisé comparable n'a été lancé dans cette
  phase ; les fichiers OIDC inspectés restent inchangés.
- Vérification syntaxique Node réussie pour les flux OIDC TDB, CASH-RECON,
  Revue-PDV et GParc.

## Déploiement

Le correctif portail est fusionné dans `main`, reconstruit et déployé. Le
conteneur portail est sain et `https://portail.tadgroupe.com/health` répond avec
`{"status":"ok","service":"portal"}`.

