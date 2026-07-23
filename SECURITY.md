# Politique de sécurité

- Les secrets sont fournis par l’environnement d’exécution et ne sont jamais commités.
- Les fichiers `.env` réels doivent être protégés en `0600`.
- Les tokens OIDC ne doivent apparaître ni dans les logs, ni dans les réponses API.
- Les autorisations sont contrôlées côté serveur.
- Les anciennes applications ne reçoivent aucun identifiant personnel depuis le portail.
- Toute vulnérabilité doit être signalée sans preuve contenant un secret ou une donnée personnelle.

Voir `docs/SECURITY_OPERATIONS.md` pour l’exploitation.
