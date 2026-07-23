# Recette phase 12 — 22 juillet 2026

## Résultat

La recette est réussie pour les contrôles disponibles sans compte utilisateur
réel. La stack est saine, les services internes ne sont pas publiés et le
parcours OIDC de base répond correctement.

## Contrôles réussis

- `docker compose config --quiet` ;
- six conteneurs actifs, PostgreSQL, Keycloak, n8n, Uptime Kuma et portail
  sains ;
- seuls les ports 80 et 443 écoutent sur l’hôte ;
- `https://portail.tadgroupe.com/health` retourne HTTP 200 ;
- découverte OIDC du realm `tad-groupe` retourne HTTP 200 ;
- `/api/auth/login` retourne HTTP 302 vers Keycloak avec état anti-CSRF dans un
  cookie `HttpOnly` ;
- callback OIDC invalide rejeté en HTTP 400 ;
- catalogue `/api/applications` accessible sans session mais vide ;
- interface `/admin` accessible mais refuse une session anonyme ;
- realm Keycloak actif ;
- PostgreSQL contient le catalogue initial (10 applications, 7 catégories) ;
- contrôle d’intégrité de la sauvegarde et restauration dans trois bases
  temporaires réussis, bases temporaires supprimées par le script ;
- espace disponible : environ 170 Go (11 %) ; certificat valide jusqu’au
  20 octobre 2026 ;
- cinq timers systemd des agents actifs dans `Africa/Abidjan` ; le smoke test
  n’a lancé aucune tâche ;
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (4 tests) et
  `pnpm build` réussis ; `git diff --check` réussi.

## Réserves

- `make` n’est pas installé sur la VM ; les commandes pnpm équivalentes ont
  été utilisées, sans installation système ;
- `pnpm audit --prod` signale une vulnérabilité haute dans `sharp` et une
  vulnérabilité modérée dans `postcss`, via Next.js. La mise à jour doit être
  traitée dans une tâche de dépendances dédiée, après vérification de
  compatibilité ;
- le filtrage par rôle et la connexion complète nécessitent un compte
  Keycloak de test dédié. Aucun compte n’a été créé pendant cette recette afin
  d’éviter toute donnée personnelle réelle ;
- aucun dépôt distant GitHub ni protection distante de `main` n’est configuré.

## Risques et actions restantes

La livraison finale doit traiter ou accepter explicitement les alertes de
dépendances, exécuter le parcours avec un compte de test non personnel et
confirmer la configuration GitHub. Aucune action automatique n’est proposée
sur ces points.

## Retour arrière

La recette n’a modifié ni base, ni volume, ni configuration de production.
Pour une régression applicative, revenir au commit précédent sur une branche
de travail puis reconstruire le seul service `portal` après validation. Les
restaurations de recette ont utilisé des bases temporaires supprimées par le
script ; les données persistantes de la stack n’ont pas été supprimées.
