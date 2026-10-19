# Préservation des profils administrateur

## Diagnostic du 19 octobre 2026

L'audit portail du 18/10 à 22:18:53 UTC montre le remplacement des profils
attribués par les profils minimaux lors d'un `PORTAL_USER_UPDATED`, dont
`CASH-RECON: ADMIN → VIEWER`. Cela établit une rétrogradation de l'affectation
dans le portail. La base locale CASH-RECON ne contient pas d'événement
`ADMIN → VIEWER` à 22:18 : le compte y est actuellement actif avec le rôle
`ADMIN`, et ses modifications auditées du 19/10 sont `ADMIN → ADMIN`. La
conclusion précédente attribuant le changement du rôle local à cet événement
était donc trop affirmative.
Le formulaire utilisait `isDefault` pour toutes les cases cochées, effaçait
les affectations précédentes puis mettait les nouvelles en file de synchronisation.
La sélection prioritaire du worker était correcte mais ne pouvait retrouver
un rôle ADMIN qui avait été retiré.

## Correctif

Les cases gèrent l'accès, pas le niveau de rôle. Une application restant cochée
conserve tous ses profils existants. Seule une nouvelle application reçoit
son profil minimal. Décocher retire explicitement l'accès. Une application
absente de l'éditeur (aucun profil par défaut) n'est plus révoquée implicitement.
La priorité des rôles, l'identité, les mots de passe et les comptes ne changent pas.

Tests : conservation ADMIN contre VIEWER, nouveaux accès minimaux, retrait
explicite, applications cachées, plusieurs profils, champ absent et choix invalide.

## Réparation nominative

`scripts/repair-target-application-admin.mjs` reçoit matricule, e-mail et sujet
Keycloak vérifiés. Exécution dans le conteneur portail, lecture seule par défaut,
`--apply` après sauvegarde. Il refuse tout doublon ou incohérence, journalise les
anciens profils et vérifie que les affectations des autres utilisateurs sont
inchangées. Aucun rôle d'administrateur n'est attribué globalement.

Contrôle des profils locaux le 19/10 :

| Application | Profil effectif vérifié                                      | Provisionnement portail      |
| ----------- | ------------------------------------------------------------ | ---------------------------- |
| CASH-RECON  | `ADMIN`                                                      | `COMPLETED`                  |
| TDB         | `ADMIN`                                                      | `COMPLETED`                  |
| Revue-PDV   | `super_admin`                                                | `COMPLETED`                  |
| GParc       | `ADMIN`                                                      | `FAILED` (HTTP 404)          |
| ATF         | Administrateur (`administrator=1`, lecture seule désactivée) | `FAILED` (HTTP 400)          |
| Recrutement | `RECRUT_OCI_ADMIN`, rôle de gestion accepté par l'API        | `COMPLETED`                  |
| SIRH / HRMS | `System Manager`                                             | `FAILED` (HTTP 417)          |
| GLPI        | `Super-Admin` local ; `ACCESS` dans le catalogue portail     | aucun job                    |
| Drive / GED | `System Manager` et `Drive Admin` locaux                     | GED inactive dans le portail |
| MDM         | `Admin` local                                                | MDM inactive dans le portail |

Les rôles locaux sont la référence pour les droits métier. Les trois jobs en
échec n'ont pas empêché les profils locaux ci-dessus d'être présents. Le
résultat d'un connecteur ne remplace pas la relecture des droits locaux.

## Livraison et retour arrière

PR et contrôles avant fusion, sauvegarde et livraison documentée via deploy.sh.
Restaurer les affectations du seul compte concerné depuis les audits si nécessaire,
puis re-synchroniser uniquement les applications vérifiées. Ne restaurer aucune
base globale ni supprimer de compte. Revenir à l'image précédente reste possible,
mais réintroduit le défaut : éviter toute sauvegarde de fiche avec cette version.
Les branches GLPI par défaut et leurs 241 affectations ne font pas partie de ce lot.
