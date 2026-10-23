# Inventaire infrastructure — audit initial du 28 juillet, actualisé le 23 octobre 2026

## Résumé de l’audit initial du 28 juillet 2026

L’audit a utilisé uniquement des commandes d’inspection SSH, Git, Docker,
systemd, `ss` et des lectures de noms de fichiers. Aucun `.env` réel n’a été
lu, aucun service n’a été redémarré et aucun paquet n’a été installé.

État initial relevé le 28 juillet 2026, complété par l’actualisation datée en
fin de document.

## VM et accès SSH détectés lors de l’audit initial

| VM               | Alias / utilisateur    | Système                      | Applications rattachées     |
| ---------------- | ---------------------- | ---------------------------- | --------------------------- |
| `54.37.11.202`   | Portail / à confirmer  | à confirmer dans cette passe | Portail                     |
| `135.125.132.51` | `Revue-PDV` / `debian` | Debian 12                    | TDB, CASH-RECON, Revue-PDV  |
| `51.91.102.44`   | `gparc` / `debian`     | Debian 12                    | GParc                       |
| `91.134.255.77`  | `mdm-tad` / `debian`   | Debian 13.6                  | MDM, Recrutement OM & Telco |

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

## Mise à jour du rattachement des applications — 23 octobre 2026

Le responsable confirme les regroupements suivants : Portail et GLPI ; SIRH et
GED ; CASH-RECON, TDB/Perf-TID et Revue-PDV ; ATF ; Recrutement OM/Telco et
MDM. GParc est sur une VM distincte. Les résolutions DNS publiques observées
concordent avec ces groupes :

| Groupe confirmé                     | IP publique résolue pour les domaines applicatifs |
| ----------------------------------- | ------------------------------------------------- |
| Portail, GLPI                       | `54.37.11.202`                                    |
| SIRH, GED                           | `152.228.138.54`                                  |
| TDB/Perf-TID, CASH-RECON, Revue-PDV | `135.125.132.51`                                  |
| ATF                                 | `51.178.142.237`                                  |
| Recrutement OM/Telco, MDM           | `91.134.255.77`                                   |
| GParc                               | `51.91.102.44`                                    |

Une IP DNS publique n’est pas une preuve à elle seule de l’adresse SSH ou de
l’origine du serveur. L’accès SSH testé depuis le Portail fonctionne par les
alias `Revue-PDV` (VM 135) et `mdm-tad` (VM 91). L’authentification SSH a été
refusée sur les IP des VMs SIRH/GED, ATF et GParc. L’alias historique `gparc`
ne résout pas et l’alias `SIRH-GED` pointe vers un nom non résolu.

## État des agents locaux — 23 octobre 2026

Le Portail a un worker de dispatch et des timers locaux. Sur les VMs 135 et 91,
Codex CLI est présent, mais `/srv/tad/agents` et les unités systemd
`tad-agent-*` sont absents. La file actuelle est locale à la VM Portail et le
runner interdit les connexions distantes et le déploiement. Les VMs SIRH/GED,
ATF et GParc n’ont pas pu être inspectées par SSH. Aucun déploiement d’agent
local n’a été effectué pendant cet audit.
