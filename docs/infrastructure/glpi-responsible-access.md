# Accès nominatif GLPI

Constat 19/10/2026 : GLPI active, catégorie active, rôle PORTAL_ADMIN configuré.
Le responsable confirmé possède ce rôle dans Keycloak, mais aucune affectation
GLPI n'existe pour sa fiche portail. Cela ne démontre pas la cause dans son
navigateur : ses rôles de session et son affichage n'ont pas été observés.

Correction limitée : un profil de catalogue ACCESS et son affectation au seul
responsable, après correspondance unique e-mail/matricule, activation vérifiée.
Aucun ajout de rôle global, aucune attribution de privilège GLPI, aucun job de
provisionnement applicatif. Les profils locaux restent l'autorité des droits.
Script idempotent, transactionnel, journalisé et relecture avant validation.

Après PR fusionnée et CI réussie :
`docker exec -i tad-portail-portal-1 node --input-type=module < scripts/grant-glpi-responsible.mjs`.
Puis actualiser la page Applications ; une reconnexion est nécessaire si la
session ancienne ne contient pas les rôles actuels. Si la tuile reste absente,
relever l'URL et le compte réellement affichés, sans cookie ni jeton.

Retour : retirer uniquement cette affectation depuis l'administration portail,
sans supprimer la fiche GLPI ou modifier les autres applications.
