# Cartographie applicative

| ID officiel          | VM (regroupement confirmé le 23/10/2026)  | Dépôt / chemin observé            | Branche observée                | État / limite d’audit                                                     |
| -------------------- | ----------------------------------------- | --------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| portal, glpi         | Portail + GLPI                            | dépôt portail ; installation GLPI | voir dépôts dédiés              | DNS commun ; runner portail uniquement                                    |
| sirh                 | SIRH + GED                                | source SIRH à confirmer           | à confirmer                     | Codex présent, runner absent ; SSH inaccessible depuis le Portail         |
| tdb                  | TDB / Perf-TID, VM 135                    | `/home/debian/TDB-TID`            | `codex/modernize-dashboard-kpi` | état Git observé en juillet                                               |
| cash-recon           | CASH-RECON, VM 135                        | `/home/debian/CASH-RECON`         | `codex/domain-aware-login-cash` | état Git observé en juillet                                               |
| revue-pdv            | Revue-PDV, VM 135                         | `/home/debian/Revue-PDV-PROD`     | `codex/domain-aware-login-pdv`  | état Git observé en juillet                                               |
| atf                  | ATF, VM `atf-tid`                         | chemin à confirmer                | à confirmer                     | Codex présent, runner absent ; SSH inaccessible depuis le Portail         |
| gparc                | GParc, VM distincte                       | `/home/debian/gparc-prod`         | `codex/gparc-integration`       | Codex présent, runner absent ; SSH inaccessible depuis le Portail         |
| mdm                  | MDM, VM 91                                | `/opt/hmdm`                       | `to_confirm`                    | dépôt source non confirmé                                                 |
| recrutement-om-telco | Recrutement OM/Telco, VM 91               | `/home/debian/RECRUT_OM`          | `agent/step-0`                  | état Git observé en juillet                                               |

Les noms de dépôt, branches et états Git ci-dessus sont des observations
historiques ; ils ne constituent pas une autorisation de les modifier. Les
regroupements VM viennent du responsable et ont été recoupés avec les
résolutions DNS publiques, qui ne prouvent pas à elles seules les accès SSH.
