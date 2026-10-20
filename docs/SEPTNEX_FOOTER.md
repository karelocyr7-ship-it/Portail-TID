# Mention SEPTNEX — lot Portail et connexion

## Dernière demande : logo seul

Le 19 octobre 2026, retrait demandé du texte visible « Powered by ».
Le composant commun (page Applications et fenêtre utilisateur) et les deux
thèmes Keycloak conservent uniquement le logo centré 96 × 60 px, son texte
alternatif SEPTNEX et le lien HTTPS vers septnex.com. Tests de non-régression
adaptés pour interdire le retour de la mention. Aucun changement de données,
de droits ou de dépendances. Livraison selon la procédure habituelle après
contrôles et fusion ; autorisation permanente limitée à ce pied de page reçue.
Rollback : image précédente et revert des templates par livraison contrôlée.
Les sections suivantes conservent l'historique des étapes précédentes.

Demande du 19 octobre 2026 : afficher « Powered by SEPTNEX », lien vers
https://septnex.com, dans toutes les applications et fenêtres.

## Livraison du texte et évolution du logo

Le lot texte a été livré le 19 octobre 2026 via la PR #113, commit
`0293fb50f759`. Santé publique, workers et rendu HTML de connexion vérifiés.
Sauvegarde `tad-20261019T082524Z.tar.gz` vérifiée (SHA256 et gzip).

Évolution préparée sur `codex/septnex-logo`, non déployée : remplacement du
texte SEPTNEX par le logo fourni dans `/srv/tad/portail/tmp/signature.png`.
Affichage 96 × 60 px, proportions conservées, texte alternatif SEPTNEX,
mention « Powered by » et lien externe conservés. Image servie localement
par le portail et par chacun des deux thèmes Keycloak, sans appel tiers.
Les trois copies doivent rester identiques (test automatisé).
Une nouvelle livraison nécessite fusion, contrôles et confirmation utilisateur.
Rollback du logo : revenir au composant, CSS et templates texte par une
livraison Git contrôlée ; aucune migration de données.

## Périmètre

Correction suivante (`codex/septnex-stacked`, non déployée) : mention centrée
au-dessus du logo, espacement 4 px, footer non rétrécissable, image chargée
immédiatement plutôt que paresseusement. Le fichier PNG en production répond
HTTP 200 ; la cause de l'absence signalée sur la page Applications n'est pas
reproduite dans une session authentifiée. Vérifier le rendu après rechargement
complet et défiler jusqu'au pied de page : celui-ci reste dans le flux et ne
masque pas les cartes. Aucun changement d'accès ni de données.

- Portail : composant commun dans le layout de toutes les pages authentifiées.
- Fenêtre de création/modification d'utilisateur : même composant.
- Keycloak : extension native `footer.ftl` des thèmes `tad-login` et
  `tad-login-v2`, sans modifier le thème amont ni les paramètres du realm.
- Lien accessible au clavier, ouverture dans un nouvel onglet, sans transmettre
  de referrer et sans accès à `window.opener`.
- Pied de page dans le flux, sans bandeau fixe masquant les boutons.
- Aucun traceur, secret, dépendance ou changement d'authentification.

Les dialogues du navigateur et du système ne font pas partie des interfaces
modifiables par les applications. Les autres dialogues applicatifs doivent être
recensés et adaptés dans chaque projet.

## Contrôles

Lint et typecheck : réussis. Tests existants : 77 Vitest et 12 Node réussis,
tests ciblés supplémentaires pour le composant et les thèmes.
Build Next.js : réussi, avec dix avertissements de traçage de fichiers dans
les modules agents non modifiés. Premier essai refusé par Turbopack à cause
des liens vers les dépendances du worktree voisin ; résolu par copie locale
des dépendances existantes identiques, sans installation ni changement de version.
Destination HTTPS SEPTNEX : HTTP 200.
Recette visuelle et rendu FreeMarker dans Keycloak isolé : restent à effectuer.

## Livraison et retour arrière

Branche `codex/septnex-footer`, revue et fusion avant déploiement selon la
procédure du portail. Conserver l'image précédente, vérifier santé et rendu
desktop/mobile. Ne pas appliquer directement les fichiers au checkout de prod.
Le thème Keycloak est monté depuis le checkout de livraison : vérifier le thème
effectif et sa politique de cache avant activation ; prévoir une validation
ciblée si le fournisseur partagé doit être redémarré.
Rollback : image précédente pour le portail et version précédente des thèmes
via livraison contrôlée. Aucune migration de données.

## Couverture restante — ne pas annoncer « toutes les applications »

| Application                       | État constaté                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------ |
| GLPI                              | Footer SEPTNEX pas encore intégré ; utiliser une extension native, pas le cœur |
| SIRH / GED                        | SSH confirmé sur 152.228.138.54 ; respecter les apps personnalisées Frappe     |
| Revue-PDV / Perf-TID / CASH-RECON | SSH confirmé sur 135.125.132.51 ; dépôts et worktrees à isoler                 |
| GParc                             | SSH confirmé sur 51.91.102.44                                                  |
| MDM / Recrutement                 | SSH confirmé sur 91.134.255.77                                                 |
| ATF                               | Dépôt et procédure de livraison encore à identifier                            |

Des modifications utilisateur sont présentes dans plusieurs dépôts distants.
Elles ne doivent pas être incorporées à cette livraison ni écrasées.
Chaque application nécessite son intégration, ses tests et sa livraison propres.
L'ajout au portail ne personnalise pas automatiquement les applications externes.
