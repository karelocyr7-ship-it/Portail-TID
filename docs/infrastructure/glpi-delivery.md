# Livraison GLPI — périmètre ciblé autorisé

VM Portail, application indépendante dans /home/debian/GLPI. Cette livraison
ajoute seulement glpi.tadgroupe.com dans Caddy et une fiche catalogue inactive.
Les routes existantes, comptes, profils et affectations restent inchangés.
Le backend est tad-glpi-web:80 sur tad-app, SQL reste sur son réseau privé.

Après validation des contrôles et fusion PR : mettre à jour le worktree main,
puis lancer `bash scripts/deploy-glpi-proxy.sh`. Le script refuse une configuration
de production différente de l'état audité, sauvegarde Caddy, valide le candidat,
recharge sans redémarrer le portail et vérifie sa santé. Une erreur provoque
le rechargement de l'ancienne configuration. Ne pas utiliser deploy.sh, qui
reconstruirait inutilement les autres services pour ce changement ciblé.

Vérifier ensuite DNS, certificat/SAN/dates, HTTP→HTTPS, accès GLPI, cookies,
authentification et santé portail/OIDC. La fiche reste inactive jusqu'à ces
contrôles. L'activation et les habilitations sont des opérations administrateur.
Seul PORTAL_ADMIN est proposé initialement. Aucun transfert de mot de passe,
aucun profil applicatif provisionné : authentification GLPI indépendante.
Les autres rôles attendent la validation de leurs droits internes GLPI.

Retour : désactiver la fiche GLPI sans la supprimer, recopier la sauvegarde
Caddy annoncée sur le fichier monté, valider puis `caddy reload`. Conserver
les volumes et la base GLPI. Aucune restauration SQL du portail n'est requise :
l'opération catalogue est additive et transactionnelle, avec journal d'audit.

Contrôles : bash -n, node --check, diff sans changement des routes portail,
Caddy validate en conteneur existant ; contrôles globaux selon disponibilité.
La recette métier et les sauvegardes GLPI sont documentées dans son dépôt.

Contrôles locaux du 18/10 : syntaxe Bash/Node et validation Caddy réussies.
Après installation figée autorisée, make lint/typecheck/test/build et format
réussis (77 tests Vitest et 12 tests Node). Build avec 10 avertissements existants
de traçage dynamique. CI Quality, Build et Security réussies sur PR 109 fusionnée.

La première livraison a révélé un bind mount Caddy obsolète (ancien inode déjà
supprimé avant cette livraison). Le reload ne chargeait donc pas le fichier
modifié. La fiche reste inactive. Après autorisation ciblée d'une brève coupure,
`GLPI_CADDY_RECREATE_APPROVED=yes bash scripts/repair-glpi-proxy-mount.sh` recrée
seulement Caddy, image identique, compare les fichiers et vérifie le portail.
Rollback automatique vers le vhost sauvegardé si le contrôle échoue.

Après certificat et recette HTTPS valides :
`docker exec -i tad-portail-portal-1 node --input-type=module < scripts/activate-glpi.mjs`.
Ce script refuse une réponse HTTPS non valide, active seulement GLPI et journalise
l'opération. Les rôles restent PORTAL_ADMIN uniquement, sans profil utilisateur ajouté.
