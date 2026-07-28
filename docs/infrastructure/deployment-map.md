# Carte des déploiements

| Application | Méthode observée | Santé | Rollback connu |
|---|---|---|---|
| TDB | Docker Compose sur VM 135 | `https://tdb.tadgroupe.com/api/health` | reconstruction du commit précédent, à formaliser dans le dépôt |
| CASH-RECON | Docker Compose sur VM 135 | `https://cash.tadgroupe.com/api/health` | à confirmer dans la procédure du dépôt |
| Revue-PDV | Docker Compose sur VM 135 | `https://pdv.tadgroupe.com/api/health` | script `scripts/rollback_revue_pdv_prod.sh` présent |
| GParc | Docker Compose sur VM 51 | `https://gparc.tadgroupe.com/api/health` | retour au commit précédent et reconstruction, documenté dans le journal |
| MDM | WAR HMDM / Docker sur VM 91 | accueil MDM HTTPS | sauvegardes WAR et `ROOT.xml` documentées |
| Recrutement OM & Telco | Compose sur VM 91 | `https://recrut-oci.tadgroupe.com/api/health` | archive applicative documentée, à vérifier |
| ATF | to_confirm | to_confirm | to_confirm |

Cette carte est une proposition de supervision. Elle ne déclenche aucun
déploiement et ne remplace pas la procédure propre à chaque dépôt.
