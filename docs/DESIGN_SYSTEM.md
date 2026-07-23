# Charte graphique partagée

La charte est inspirée de la plaquette commerciale TID/TAD et doit rester
réutilisable par le portail web et la future application Android.

## Tokens

| Token        | Valeur    | Usage                                      |
| ------------ | --------- | ------------------------------------------ |
| `navy`       | `#062F70` | navigation, fonds principaux, titres forts |
| `blue`       | `#123F87` | liens, informations, accents secondaires   |
| `orange`     | `#F58216` | actions principales, repères, validation   |
| `ink`        | `#10254A` | texte principal                            |
| `muted`      | `#5E6C86` | texte secondaire                           |
| `surface`    | `#FFFFFF` | cartes et surfaces                         |
| `background` | `#F5F8FC` | fond d’application                         |

## Règles d’usage

- utiliser le logo TID fourni sans le recolorer ni le déformer ; le portail
  référence `tid-logo.png` et conserve les proportions natives de l’asset ;
- privilégier les surfaces blanches, les cartes arrondies et les accents
  orange sur une base bleu marine ;
- conserver un contraste lisible et des zones tactiles d’au moins 44 px pour
  les usages mobiles ;
- réserver les courbes et rubans décoratifs aux conteneurs principaux afin de
  conserver une interface légère sur Android ;
- ne pas ajouter de texte ou d’URL métier inventés dans les supports visuels.

L’asset web principal est `apps/portal/public/branding/tid-logo.png`. Android
devra reprendre ces tokens dans ses propres ressources natives plutôt que
charger la feuille CSS du portail.
