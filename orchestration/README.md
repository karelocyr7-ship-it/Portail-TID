# Orchestration multi-applications

Cette configuration est une proposition locale. Elle n'installe aucun agent,
ne crée aucune unité systemd et ne déclenche aucune action distante.

Les validations administrateur créent uniquement une action `QUEUED`. Le
`portal-orchestrator` devra ensuite appliquer une politique de file (une action
à la fois), refaire les contrôles de sécurité et demander une validation
humaine supplémentaire pour toute opération de production.

Les valeurs `to_confirm` ne doivent pas être remplacées par déduction.
