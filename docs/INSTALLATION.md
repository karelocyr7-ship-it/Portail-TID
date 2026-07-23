# Installation

## Phase 2 — préparation Linux

### Réalisé

- Fuseau configuré sur `Africa/Abidjan`.
- Utilisateur système `tad-agents` créé avec le shell `/usr/sbin/nologin`.
- Répertoire `/srv/tad/agents/` créé en `0750`, propriétaire `tad-agents`.
- Sous-répertoires créés : `queue`, `repositories`, `workspaces`, `results`,
  `logs` et `scripts`, tous en `0750`.
- Utilitaires installés : `gnupg`, `jq`, `rsync`, `unzip`, `acl`.
- `ca-certificates` et `curl` étaient déjà installés.

### Non réalisé volontairement

- aucune modification SSH ;
- aucun pare-feu activé ou configuré ;
- aucun changement DNS ;
- aucun Docker, Node.js, Keycloak ou service applicatif ;
- aucune base, volume ou donnée supprimée.

### Contrôle

```sh
getent passwd tad-agents
sudo stat -c '%A %a %U:%G %n' /srv/tad/agents
timedatectl
```

Résultat attendu : compte avec `/usr/sbin/nologin`, répertoire `750` détenu
par `tad-agents`, fuseau `Africa/Abidjan`.

### Retour arrière

Un retour arrière éventuel doit être préparé et validé avant exécution :
restauration du fuseau précédent, puis neutralisation ou suppression contrôlée
du compte et des répertoires agents. Les paquets ne doivent pas être retirés
automatiquement, car certains pourront être requis par Docker ou les sauvegardes.

Prérequis restants : accès administrateur système, DNS pointant vers la VM,
adresse e-mail d’administration et stratégie de sauvegarde externe.

## Phase 3 — Docker

Docker Engine, Compose Plugin et Buildx sont installés depuis le dépôt APT
officiel Docker pour Debian Trixie. Les versions installées sont documentées
dans `docs/VERSIONS.md`.

Le fichier `compose.yml` décrit les six services et leurs réseaux/volumes,
avec des images versionnées, des healthchecks, des limites de ressources et
aucun port public autre que 80/443. La création des ressources et le démarrage
restent à exécuter avec un compte autorisé à accéder au socket Docker.

Ne jamais utiliser `.env.example` en production : il ne contient que des
valeurs indicatives. Créer un `.env` réel avec des secrets aléatoires, le
protéger en `0600`, puis contrôler la configuration sans afficher ses valeurs :

```sh
chmod 600 .env
docker compose config --quiet
docker compose up -d
```

Le contrôle de cette reprise a confirmé la syntaxe Compose, mais l’utilisateur
de session ne dispose pas de l’accès à `/var/run/docker.sock`; aucun réseau,
volume ou conteneur n’a donc été créé par l’agent.

## Phase 4 — application

Node.js, pnpm et les dépendances du workspace sont installés. Le portail peut
être contrôlé avec `pnpm --filter portal test`, `typecheck`, `lint` et `build`.
La migration Prisma initiale est versionnée et appliquée dans la base locale
`portal`. PostgreSQL reste privé ; les commandes Prisma d’exploitation doivent
être exécutées depuis un conteneur attaché au réseau Docker `tad-data`.
