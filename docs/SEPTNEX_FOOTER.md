# Mention SEPTNEX — lot Portail et connexion

Demande du 19 octobre 2026 : afficher « Powered by SEPTNEX », lien vers
https://septnex.com, dans toutes les applications et fenêtres.

## Lot préparé, non déployé

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
