# Orchestration multi-applications

Cette configuration est installée sur le runtime central du Portail. Elle ne
modifie aucune VM applicative et ne déclenche aucune action distante.

Les validations administrateur créent uniquement une action `QUEUED`. Le
`portal-orchestrator` devra ensuite appliquer une politique de file (une action
à la fois), refaire les contrôles de sécurité et demander une validation
humaine supplémentaire pour toute opération de production.

Les valeurs `to_confirm` ne doivent pas être remplacées par déduction.

Le dispatcher central est actif avec une file par agent et une concurrence
maximale de un, dans la fenêtre 19:30–05:30 (Africa/Abidjan), avec arrêt
progressif à 05:30, 05:45 et 06:00 puis rapport à 06:05. Les agents
applicatifs connus sont activables par tâche ;
`atf-agent` est identifié sur la VM ATF, mais reste désactivé tant qu’un miroir
du dépôt et une procédure d’exécution sans secrets ni accès base ne sont pas
préparés.
Les agents de revue restent soumis au cycle d’approbation du Portail.
