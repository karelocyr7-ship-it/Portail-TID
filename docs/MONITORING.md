# Monitoring léger

## Contrôle manuel

Depuis `/srv/tad/portail`, exécuter :

```sh
./scripts/healthcheck.sh
```

Le script affiche l’état des conteneurs, les ressources Docker, l’espace
disque, l’endpoint public `/health`, l’expiration du certificat HTTPS et les
dernières sauvegardes. Il ne lit pas `.env` et n’affiche aucun secret.

## Renouvellement automatique TLS

Caddy gère les certificats publics via ACME. La configuration renouvelle les
certificats dans leur dernier tiers de validité, soit environ 30 jours avant
expiration pour un certificat de 90 jours. Les données ACME sont conservées
dans le volume Docker externe `tad-caddy-data` ; ce volume ne doit pas être
supprimé ni recréé pendant une mise à jour.

Prérequis à maintenir :

- l’enregistrement DNS de `portail.tadgroupe.com` doit pointer vers la VM ;
- les ports TCP 80 et 443 doivent rester accessibles à Caddy ;
- `ACME_EMAIL` doit être défini dans l’environnement d’exécution ;
- le service Caddy doit rester démarré avec `restart: unless-stopped`.

Pour contrôler l’état sans afficher de secret :

```sh
./scripts/healthcheck.sh
docker compose logs --tail=200 caddy
```

Le renouvellement est effectué sans intervention humaine par Caddy. En cas
d’échec ACME, les journaux Caddy doivent être examinés avant toute action ; le
rollback consiste à restaurer le dernier commit de configuration puis à
recharger Caddy, sans supprimer le volume `tad-caddy-data`.

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
