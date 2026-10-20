# Activation du provisionnement GLPI

Le portail conserve le choix GLPI et provisionne les matricules automatiquement.
Le connecteur crée uniquement les identités absentes ; les comptes existants et
leurs profils métier restent administrés dans GLPI.

## Livraison

Après tests, PR fusionnée et autorisation de déploiement, depuis un checkout
propre de `main` à jour :

1. Lancer `/home/debian/GLPI/scripts/backup.sh` depuis le dépôt GLPI. Cette
   sauvegarde cohérente arrête brièvement GLPI puis le redémarre.
2. Lancer `sudo python3 scripts/glpi/activate-glpi-api.py --backup-dir <répertoire>`.
   Le script vérifie les empreintes de la sauvegarde (moins d'une heure), crée
   exclusivement un nouveau fichier protégé `/srv/tad/secrets/glpi-provisioning.env`,
   puis configure GLPI par ses modèles natifs dans une transaction.
3. Lancer la procédure habituelle `scripts/deploy.sh` avec le fichier Compose
   d'environnement de livraison. Seul le worker reçoit le connecteur protégé.
4. Contrôler la santé et les statuts GLPI de l'outbox, puis les identités créées.

Les secrets générés passent par stdin ou un fichier de mode 0600, jamais par
les arguments ni la sortie. Un fichier existant n'est ni lu ni écrasé ; un échec
nécessite un diagnostic avant reprise. Aucun ancien compte n'est modifié.
Le profil technique permet seulement la lecture et la création des utilisateurs.
Le profil par défaut GLPI est conservé ; l'authentification API par mot de passe
n'est pas activée. Les identités SAML utilisent l'adresse électronique.

## Validation isolée

`sudo python3 scripts/glpi/activate-glpi-api.py --fixture` utilise exclusivement
les conteneurs synthétiques `portal-glpi-fixture-20261020-*`. Il crée un service
technique unique et exécute les six tests d'intégration : migration, choix
persistant, création idempotente, compte inactif et refus de modification d'un
utilisateur ou d'attribution d'un profil administrateur. Aucun secret persistant
n'est créé pour ces tests.

## Retour arrière

Arrêter le worker avant toute intervention. Le déploiement conserve l'image
précédente et ses contrôles de santé. Si nécessaire, désactiver le client API et
le compte technique créés via l'administration native GLPI, puis remettre les
indicateurs API antérieurs affichés par le script. Conserver les nouveaux comptes
métier et leurs données. Ne pas restaurer une ancienne base sur des données
récentes sans décision explicite ; la sauvegarde SQL/fichiers reste disponible
pour une restauration cohérente selon la procédure GLPI.
