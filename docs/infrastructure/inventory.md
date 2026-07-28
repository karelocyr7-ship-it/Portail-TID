# Inventaire infrastructure — audit lecture seule du 28 juillet 2026

## Résumé exécutif

L’audit a utilisé uniquement des commandes d’inspection SSH, Git, Docker,
systemd, `ss` et des lectures de noms de fichiers. Aucun `.env` réel n’a été
lu, aucun service n’a été redémarré et aucun paquet n’a été installé.

## VM et accès SSH détectés

| VM | Alias / utilisateur | Système | Applications rattachées |
|---|---|---|---|
| `54.37.11.202` | Portail / à confirmer | à confirmer dans cette passe | Portail |
| `135.125.132.51` | `Revue-PDV` / `debian` | Debian 12 | TDB, CASH-RECON, Revue-PDV |
| `51.91.102.44` | `gparc` / `debian` | Debian 12 | GParc |
| `91.134.255.77` | `mdm-tad` / `debian` | Debian 13.6 | MDM, Recrutement OM & Telco |

ATF n’a pas pu être rattachée à une VM, un dépôt ou un service avec une
preuve suffisante ; elle reste `to_confirm`.

## Services observés

- VM Revue-PDV : Docker, Nginx, TDB, CASH-RECON, Revue-PDV, OSRM et
  observabilité ; timer `tdb-sync.timer`.
- VM GParc : Docker, GParc API/DB/Nginx, TDB point et observabilité ; timer
  `gparc-tdb-sync.timer` et timers `gparc-agents-*`.
- VM MDM : Docker, HMDM, PostgreSQL, Recrutement OM & Telco, Patrimoine,
  observabilité et Certbot ; sauvegarde HMDM planifiée.

Les ports exposés et les conteneurs détaillés sont conservés dans
`deployment-map.md`; les valeurs d’environnement n’ont pas été inspectées.
