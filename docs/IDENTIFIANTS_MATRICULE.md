# Migration vers les matricules d’entreprise

Statut : préparation uniquement — migration non exécutée.

## Format cible

- TID : `TID` suivi d’au moins trois chiffres, par exemple `TID000`.
- TID+ : `TIDP` suivi d’au moins trois chiffres, par exemple `TIDP000`.

La comparaison est insensible à la casse côté application puis stockée en
majuscules. Le champ reste nullable pendant la transition afin de préserver
les comptes existants.

## Changements préparés

- Ajout de `PortalUser.employeeId`, unique et nullable.
- Contrainte SQL de format.
- Administration du matricule dans le Portail.
- Lecture des claims OIDC `employee_id`, `employeeId` ou `matricule`.
- Repli temporaire sur `preferred_username` uniquement s’il respecte le
  format matricule.
- Résolution d’accès dans l’ordre : `sub`, matricule, puis e-mail.
- Les anciennes identités Keycloak restent utilisables.

## Déroulement prévu

1. Ajouter dans Keycloak un mapper OIDC signé vers `employee_id`.
2. Vérifier l’unicité et le format des matricules dans chaque application.
3. Exporter une correspondance contrôlée `sub → employeeId`, sans mot de passe
   ni token.
4. Renseigner les matricules dans `PortalUser` par lots contrôlés.
5. Tester les sept applications en recette.
6. Rendre le matricule obligatoire uniquement après validation humaine.
7. Retirer progressivement le repli e-mail, après période de compatibilité.

## Contrôles et retour arrière

Avant exécution : sauvegarde PostgreSQL, contrôle des doublons et simulation
des lignes concernées. La migration SQL est additive et réversible avant le
remplissage : supprimer la contrainte, l’index et la colonne dans cet ordre.
Ne pas exécuter cette procédure sur production sans validation humaine.
