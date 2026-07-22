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
dans `docs/VERSIONS.md`. Le service Docker est activé au démarrage et actif.

Les réseaux `tad-edge`, `tad-app`, `tad-identity`, `tad-agents`, `tad-data` et
`tad-monitoring` sont séparés. Les volumes nommés de base sont créés sans
conteneur ni donnée applicative : Caddy, PostgreSQL, n8n et Uptime Kuma.
