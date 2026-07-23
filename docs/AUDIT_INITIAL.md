# Audit initial — Portail TAD Groupe

Date de l’audit : 22 juillet 2026  
Répertoire audité : `/srv/tad/portail`  
Mode : lecture seule, hors création de ce rapport

## 1. Résumé de la VM

- Nom d’hôte : `vps-f97dd485`
- Système : Debian GNU/Linux 13.6 (trixie), 64 bits
- Noyau : Linux `6.12.86+deb13-amd64`
- Virtualisation : KVM / OpenStack Nova
- CPU : 8 vCPU
- Mémoire : 22 Gio, environ 22 Gio disponibles au moment du contrôle
- Swap : absente
- Stockage racine : 197 Gio, 1,7 Gio utilisés, 187 Gio disponibles
- Réseau public IPv4 : `54.37.11.202`
- Réseau public IPv6 : une adresse IPv6 globale est configurée
- Fuseau actuel : `Etc/UTC`; l’horloge est synchronisée par NTP
- Fuseau cible du projet : `Africa/Abidjan` — à configurer ultérieurement
- Utilisateur courant : `debian`, non root, groupe principal `debian`

## 2. État Git et fichiers du dépôt

- Branche active : `main`
- État au début de l’audit : propre
- Dernier commit observé : `921ae28 chore: initialisation du projet Portail TAD`
- Fichiers applicatifs visibles à faible profondeur : `README.md`, `.gitignore`
- Le dépôt est actuellement très peu fourni ; la structure cible reste à créer.
- Les noms potentiellement sensibles ont été exclus des listings. Aucun fichier `.env`, clé, mot de passe ou secret n’a été ouvert ou affiché.

## 3. Logiciels déjà présents

Présents :

- Git `2.47.3`
- Codex CLI `0.145.0`
- systemd
- curl

Absents ou non détectés :

- Docker Engine
- Docker Compose Plugin
- Docker Buildx
- Node.js
- npm
- Caddy
- UFW
- Fail2ban
- outils DNS `dig` et `nslookup` (la commande `host` est présente)

La version de pnpm n’a pas été contrôlée car Node.js/npm ne sont pas présents.

## 4. Ports utilisés

Écoutes détectées :

- TCP `22` sur IPv4 et IPv6 : SSH, exposé sur toutes les interfaces
- TCP/UDP `5355` sur IPv4 et IPv6 : service de découverte local/non identifié à analyser
- TCP/UDP DNS sur `127.0.0.53` et `127.0.0.54` uniquement : résolveur local

Aucun port 80, 443, 3000, 5432, 5678 ou 8080 n’est actuellement en écoute.

Aucun pare-feu local n’a pu être inspecté via UFW, nftables ou iptables : les outils correspondants ne sont pas installés ou détectés. La présence éventuelle d’un filtrage en amont n’a pas été vérifiée.

## 5. DNS du portail

La résolution DNS de `portail.tadgroupe.com` fonctionne et renvoie :

- IPv4 : `54.37.11.202`

Aucun enregistrement IPv6 AAAA n’a été retourné par les contrôles effectués. La cohérence DNS devra être recontrôlée depuis l’extérieur avant l’émission du certificat TLS.

## 6. Prérequis manquants

Prérequis techniques à préparer, après validation de la phase suivante :

1. accès administrateur système/root ou mécanisme sudo autorisé pour installer les paquets ;
2. Docker Engine officiel, Compose Plugin et Buildx ;
3. Node.js et gestionnaire de dépendances retenus ;
4. structure du dépôt et application initiale ;
5. configuration du fuseau `Africa/Abidjan` ;
6. stratégie de pare-feu et de limitation SSH ;
7. comptes, adresse d’alerte, dépôt GitHub et stockage externe des sauvegardes ;
8. logo officiel, s’il doit être intégré.

## 7. Risques et anomalies

- SSH est actuellement exposé sur toutes les interfaces ; il ne sera pas modifié pendant cette phase.
- Aucun pare-feu local n’est actuellement disponible ou vérifiable avec les outils présents.
- Le fuseau horaire ne correspond pas au fuseau cible du projet.
- L’absence de swap peut augmenter le risque d’arrêt de processus lors d’une forte charge ; toute création de swap nécessitera une phase dédiée et une validation si elle modifie le système.
- Le port `5355` est exposé sur toutes les interfaces et doit être identifié avant durcissement.
- Docker et Node.js sont absents ; aucune installation n’a été effectuée.
- L’adresse DNS pointe déjà vers l’IPv4 publique détectée, mais l’émission TLS et l’accessibilité externe restent à valider.
- La VM dispose de ressources suffisantes pour l’architecture légère envisagée, sous réserve de limites Docker et de tests de charge raisonnables.

## 8. Questions métier et d’exploitation

1. Quelle est l’adresse e-mail de l’administrateur du portail ?  
   Elle servira à identifier le premier administrateur fonctionnel.
2. Quelle adresse e-mail doit recevoir les alertes techniques ?  
   Elle recevra les notifications de disponibilité, sauvegarde et certificat.
3. Quelle est l’adresse IP ou le réseau autorisé à administrer la VM en SSH ?  
   Cette information permettra de préparer une restriction SSH sûre.
4. Quel est le nom du compte ou de l’organisation GitHub ?  
   Il permettra de préparer le dépôt et les workflows au bon emplacement.
5. Quel sera le nom du dépôt GitHub ?  
   Il permettra d’aligner les URLs et la documentation GitHub.
6. Le dépôt GitHub existe-t-il déjà ?  
   Cela déterminera s’il faut préparer un nouveau dépôt ou connecter l’existant.
7. Où les sauvegardes externes devront-elles être envoyées ?  
   Il faut connaître la destination avant d’automatiser une copie hors VM.
8. Le logo officiel TAD Groupe ou TID est-il disponible ?  
   Il pourra être ajouté sans inventer ni reproduire un logo non fourni.

## 9. Proposition pour la phase suivante

Après validation, proposer la PHASE 1 : créer la structure du dépôt, les règles agents, la documentation de base, les modèles GitHub locaux, `.env.example`, les fichiers Compose de préparation et le premier commit.

Cette phase ne nécessitera pas d’installation de paquet ni de modification système. Les installations Docker, Node.js, le fuseau horaire, le pare-feu et les utilisateurs techniques resteront dans des phases ultérieures avec validation préalable des opérations risquées.
