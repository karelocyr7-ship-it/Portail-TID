# Instructions pour les agents Codex

## Avant toute modification

1. Lire `README.md`, `docs/ARCHITECTURE.md` et `SECURITY.md`.
2. Exécuter `git status --short --branch`.
3. Travailler sur une branche différente de `main`.
4. Confirmer que la demande reste limitée au périmètre autorisé.

## Règles de sécurité

- Ne jamais lire, afficher, copier ou versionner un fichier `.env` réel.
- Ne jamais publier un mot de passe, token, clé privée ou secret.
- Ne jamais modifier directement la production.
- Ne jamais supprimer une base, un volume ou des fichiers sans validation explicite.
- Ne jamais monter `/var/run/docker.sock` dans un conteneur agent.
- Ne jamais utiliser `danger-full-access`.
- Ne jamais utiliser de données personnelles réelles dans les tests.
- Ne jamais donner aux agents nocturnes un accès aux secrets ou bases de production.
- Ne jamais ajouter une dépendance sans justification et contrôle de maintenance.
- Ne pas déployer automatiquement.

## Validation du travail

Avant livraison, exécuter autant que possible `make lint`, `make typecheck`,
`make test` et `make build`. Documenter les modifications, les tests réussis
et échoués, les risques et le rollback proposé. Si une commande requiert une
installation, une modification système ou une action irréversible, s’arrêter
et demander une validation explicite.

## Git

Utiliser une branche par tâche et une Pull Request. Ne pas pousser directement
sur `main` et ne pas effectuer de force push.
