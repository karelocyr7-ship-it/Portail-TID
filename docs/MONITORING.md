# Monitoring léger

## Contrôle manuel

Depuis `/srv/tad/portail`, exécuter :

```sh
./scripts/healthcheck.sh
```

Le script affiche l’état des conteneurs, les ressources Docker, l’espace
disque, l’endpoint public `/health`, l’expiration du certificat HTTPS et les
dernières sauvegardes. Il ne lit pas `.env` et n’affiche aucun secret.

## Uptime Kuma

Uptime Kuma est conservé sur le réseau Docker privé `tad-monitoring` et n’est
pas publié directement sur Internet. Les moniteurs à créer dans son interface
locale sont :

- `https://portail.tadgroupe.com/health` — HTTP 200 attendu ;
- `https://portail.tadgroupe.com/auth/realms/tad-groupe/.well-known/openid-configuration` — HTTP 200 attendu ;
- contrôle périodique de l’expiration TLS ;
- contrôle de la présence d’une sauvegarde récente.

La configuration des notifications dépend de l’adresse d’alerte technique qui
reste à confirmer. Aucun canal d’alerte réel n’est activé automatiquement.
