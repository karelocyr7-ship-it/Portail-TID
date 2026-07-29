# Environnements

| Application            | Production observée       | Développement / recette                                       | Preuve / limite                    |
| ---------------------- | ------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| TDB                    | VM 135, conteneurs actifs | non déterminé                                                 | Compose et conteneurs observés     |
| CASH-RECON             | VM 135, conteneurs actifs | non déterminé                                                 | Compose et conteneurs observés     |
| Revue-PDV              | VM 135, conteneurs actifs | dépôt/remédiation présents mais non rattachés à la production | Compose et dépôt PROD observés     |
| GParc                  | VM 51, conteneurs actifs  | non déterminé                                                 | Compose et healthcheck déjà connus |
| MDM                    | VM 91, HMDM actif         | non déterminé                                                 | conteneur HMDM observé             |
| Recrutement OM & Telco | VM 91, Compose actif      | non déterminé                                                 | Compose et healthchecks documentés |
| ATF                    | to_confirm                | to_confirm                                                    | aucun rattachement confirmé        |

Les fichiers `.env` réels sont signalés comme présents dans certains dépôts,
mais leur contenu n’a pas été lu.
