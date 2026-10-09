# Agents Codex nocturnes

L’architecture limite à un agent simultané, sans sudo, sans secrets de
production, sans accès aux bases de production et sans socket Docker. Le
répertoire de travail est `/srv/tad/agents/`, avec `queue`, `repositories`,
`workspaces`, `results`, `logs` et `state`.

## Commandes préparées

Les scripts du dépôt sont idempotents :

```sh
/srv/tad/portail/scripts/agents-start.sh
/srv/tad/portail/scripts/agents-enable-new-tasks.sh
/srv/tad/portail/scripts/agents-stop-new-tasks.sh
/srv/tad/portail/scripts/agents-stop.sh
/srv/tad/portail/scripts/daily-report.sh
```

L’exécution est désactivée par défaut. Elle ne peut être activée qu’avec
`AGENT_ALLOW_RUN=true`, après revue de la tâche et validation de l’installation
systemd. Un exemple de lancement contrôlé est :

```sh
AGENT_ALLOW_RUN=true codex exec --sandbox workspace-write --cd /srv/tad/agents/workspaces/tache \
  "Décris précisément la tâche et limite les modifications au dépôt."
```

Les unités et timers `infrastructure/systemd/tad-agent-*` prévoient la fenêtre
19 h 30–6 h 00 : le timer de démarrage déclenche l'unité de réactivation à
19 h 30, puis la suspension intervient à 5 h 30, l’arrêt propre à 5 h 45,
l’arrêt forcé à 6 h et le rapport à 6 h 05, fuseau `Africa/Abidjan`. Ils ne doivent pas être
copiés dans `/etc/systemd/system` ni activés sans validation administrateur.

Les prérequis système `bubblewrap` et `ripgrep` sont installés sur la VM du
Portail. Le service systemd autorise `AF_NETLINK`, requis par bubblewrap, sans
accorder d’accès SSH, Docker ou base de données aux agents.

## Synchronisation de la file

Le service Compose `agent-dispatch-worker` synchronise toutes les 15 secondes
les rapports déposés par les runtimes, les actions approuvées en base et les
fichiers `.task` de la file technique. Cette synchronisation ne dépend pas de
l’ouverture de la page « Rapports des agents ».

Le worker accède uniquement à PostgreSQL, aux résultats en lecture seule et à
la file en écriture. Il ne possède ni socket Docker, ni clé SSH, ni accès aux
secrets des applications métiers. Le traitement effectif des tâches demeure
assuré par `tad-agent-start.service`, un agent à la fois, pendant la fenêtre
19 h 30–5 h 30.

## n8n local

n8n utilise sa base PostgreSQL dédiée et reste privé. Pour un accès ponctuel,
utiliser un tunnel SSH validé :

```sh
ssh -L 5678:127.0.0.1:5678 utilisateur@adresse-ip-vm
```

Ne jamais fournir à n8n le socket Docker, les secrets du portail ou une clé
SSH générale de production.
