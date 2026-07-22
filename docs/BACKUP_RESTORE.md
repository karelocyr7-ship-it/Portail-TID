# Sauvegarde et restauration

## Sauvegarde locale

La commande `make backup` crée une archive dans `/srv/tad/backups` (ou dans la
valeur de `BACKUP_DIR`) avec des permissions `0600`. Elle contient :

- un dump PostgreSQL au format custom pour `portal`, `keycloak` et `n8n` ;
- les données n8n et Uptime Kuma ;
- les configurations nécessaires au redéploiement, sans fichier `.env` ;
- un manifeste et des sommes SHA-256.

Les secrets présents dans les bases ou les données n8n rendent ces archives
confidentielles. Elles doivent être copiées vers un stockage externe chiffré
à définir, sans être ajoutées à Git.

## Contrôle et restauration isolée

`make restore-check` sélectionne la sauvegarde la plus récente, vérifie son
archive et ses sommes, puis restaure les trois dumps dans des bases temporaires
créées uniquement pour ce test. Une requête `SELECT 1` confirme la lecture,
après quoi ces bases temporaires sont supprimées. Les bases de production et
leurs volumes ne sont pas écrasés.

Pour contrôler une archive précise :

```sh
./scripts/restore.sh --check-only /srv/tad/backups/tad-AAAAMMJJTHHMMSSZ.tar.gz
```

La rétention cible reste de 7 sauvegardes quotidiennes, 4 hebdomadaires et 6
mensuelles. La suppression automatique n’est pas activée tant que la
destination externe et la politique de rotation n’ont pas été validées.
