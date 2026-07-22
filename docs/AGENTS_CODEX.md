# Agents Codex nocturnes

L’architecture limite à un agent simultané, sans sudo, sans secrets de
production, sans accès aux bases de production et sans socket Docker. Le
répertoire de travail est `/srv/tad/agents/`, avec `queue`, `repositories`,
`workspaces`, `results`, `logs` et `state`.

## Commandes préparées

Les scripts du dépôt sont idempotents :

```sh
/srv/tad/portail/scripts/agents-start.sh
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
19 h 30–6 h 00, avec suspension à 5 h 30, arrêt propre à 5 h 45, arrêt forcé
à 6 h et rapport à 6 h 05, fuseau `Africa/Abidjan`. Ils ne doivent pas être
copiés dans `/etc/systemd/system` ni activés sans validation administrateur.

## n8n local

n8n utilise sa base PostgreSQL dédiée et reste privé. Pour un accès ponctuel,
utiliser un tunnel SSH validé :

```sh
ssh -L 5678:127.0.0.1:5678 utilisateur@adresse-ip-vm
```

Ne jamais fournir à n8n le socket Docker, les secrets du portail ou une clé
SSH générale de production.
