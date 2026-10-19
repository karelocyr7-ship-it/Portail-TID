# Préservation des profils administrateur

## Diagnostic du 19 octobre 2026

L'audit portail du 18/10 à 22:18:53 UTC montre le remplacement des profils
attribués par les profils minimaux lors d'un PORTAL_USER_UPDATED. L'audit
CASH-RECON à 22:18:58 UTC confirme ensuite ADMIN → VIEWER sur le compte concerné.
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

Applications actives : CASH-RECON/TDB/GPARC/ATF ADMIN, Revue-PDV super_admin,
Recrutement RECRUT_OCI_ADMIN, SIRH PORTAL_ADMIN. GLPI ACCESS est uniquement le
droit catalogue ; l'administration GLPI reste locale (Super-Admin confirmé).
Applications inactives : pas d'activation globale ni de synchronisation risquant
de désactiver les comptes locaux. SIRH : pas de job envoyé tant que le doublon
d'e-mail avec le compte technique Administrator n'est pas traité de façon sûre.
Le résultat d'un connecteur ne remplace pas la relecture des droits locaux.

## Livraison et retour arrière

PR et contrôles avant fusion, sauvegarde et livraison documentée via deploy.sh.
Restaurer les affectations du seul compte concerné depuis les audits si nécessaire,
puis re-synchroniser uniquement les applications vérifiées. Ne restaurer aucune
base globale ni supprimer de compte. Revenir à l'image précédente reste possible,
mais réintroduit le défaut : éviter toute sauvegarde de fiche avec cette version.
Les branches GLPI par défaut et leurs 241 affectations ne font pas partie de ce lot.
