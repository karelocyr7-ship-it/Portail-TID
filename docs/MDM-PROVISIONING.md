# Provisioning HMDM depuis le portail

Le connecteur expose `POST https://mdm.tadgroupe.com/rest/public/provisioning/users`.
Il utilise le contrat commun du worker et le header
`x-sirh-provisioning-token`. L’identifiant Sage est prioritaire pour
l’idempotence; l’adresse e-mail sert de repli. Une collision avec un compte
HMDM non géré par le portail retourne `409` sans écraser ce compte.

Tous les comptes sont attachés au client maître HMDM, déterminé à partir du
marqueur `customers.master` (et non d’un ID supposé). Les profils se mappent
ainsi :

| Profil portail | Rôle HMDM | Portée |
| --- | --- | --- |
| `ADMIN` | `Admin` | Administrateur du client maître, pas super-admin global |
| `USER` | `User` | Utilisateur opérationnel |
| `OBSERVER` | `Portal Observer` | Lecture des applications, fichiers et détails des appareils |
| `adminportail@tadgroupe.com` + `ADMIN` | `Super-Admin` | Exception globale explicitement autorisée |

Une révocation sans compte existant est un succès sans création. La révocation
d’un compte géré fait tourner son mot de passe aléatoire inconnu, révoque son
jeton d’authentification et active l’indicateur de réinitialisation que refuse
le callback OIDC. Les comptes HMDM locaux préexistants ne sont pas revendiqués
automatiquement.

## Secrets runtime

Sur le portail, le worker charge `/srv/tad/secrets/mdm-provisioning.env` avec
`MDM_PROVISIONING_URL` et `MDM_PROVISIONING_TOKEN`. Sur la VM MDM, la même
valeur de token est fournie par
`/opt/hmdm/secrets/mdm-provisioning.env` sous le nom
`HMDM_PORTAL_PROVISIONING_TOKEN`. Les deux fichiers doivent être créés en
mode `0600`; aucune valeur secrète ne va dans Git ou dans Compose.

## Livraison et retour arrière

1. Construire le WAR et exécuter les tests HMDM dans l’image Maven Java 17.
2. Avant toute livraison, faire un `pg_dump` complet de la base HMDM et
   sauvegarder le WAR courant ainsi que le `ROOT.xml` sans en afficher le
   contenu. Garder les sauvegardes en accès root uniquement.
3. Installer le WAR validé par remplacement atomique du fichier monté
   `/opt/hmdm/hmdm-oidc.war`, charger l’override
   `integrations/hmdm-oidc/compose.provisioning.yml`, puis recréer uniquement
   le service Compose `hmdm` (conteneur `hmdm-app`, sans recréer PostgreSQL).
4. Vérifier l’état du conteneur, la route OIDC (réponse de redirection) et
   l’endpoint de provisioning sans token (403). Avec un payload synthétique
   invalide authentifié, vérifier un refus 400 et l’absence d’écriture en DB.
5. En cas d’échec, restaurer le WAR horodaté, relancer uniquement
   `hmdm-app`, puis confirmer la route OIDC. La sauvegarde PostgreSQL reste
   disponible si une migration doit être annulée explicitement.

L’override Compose charge le token depuis le fichier runtime protégé :

```sh
cd /opt/hmdm
docker compose -f docker-compose.yml -f compose.provisioning.yml up -d --no-deps hmdm
```
