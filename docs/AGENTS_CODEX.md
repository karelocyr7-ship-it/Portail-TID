# Agents Codex locaux pilotés par le Portail

Chaque application dispose d’un runner local sans accès aux bases, au socket
Docker ni aux secrets applicatifs. Le runner récupère les tâches par HTTPS avec
un jeton propre à l’agent, travaille sur un clone superficiel isolé et remonte
son rapport au Portail. Les tâches, rapports, états et derniers contacts sont
conservés dans la base du Portail. Un agent ne peut réclamer ou terminer que
les tâches de son identifiant.

Des opérations production limitées peuvent être habilitées par application.
Le portail transmet uniquement `STATUS_APP` et `RESTART_APP` ; l’administrateur
les choisit explicitement à la création de la tâche. Le runner passe par
sudoers pour appeler un helper root qui ne connaît que les conteneurs
applicatifs autorisés, avec une limite d’un redémarrage par application toutes
les deux minutes. Aucun shell root, chemin ou argument Docker libre n’est
exposé.

Les demandes se créent dans Administration → Rapports des agents. Chaque
instance systemd tourne sous un compte Linux dédié à un seul agent. Les jetons
bruts restent dans `/etc/tad-agents/<agent>.env`, lisible uniquement par root ;
la base du Portail conserve leur empreinte SHA-256. Le jeton n’est pas transmis
au processus Codex.

`can_execute_production: false` dans `orchestration/agents.yaml` signifie que
l’agent ne peut pas publier de code ou de configuration. Les opérations de
service listées séparément n’autorisent que l’état et le redémarrage des
conteneurs prévus pour cette application ; elles ne permettent pas de changer
leur configuration. Les demandes de changement restent isolées jusqu’à une
livraison effectuée par la procédure documentée de l’application.

## Installer un runner sur une VM

Prérequis sur la VM : Codex CLI, Git, Node.js et une connexion sortante HTTPS
vers `portail.tadgroupe.com`. Depuis la racine d’un dépôt Git local de
l’application, exécuter :

```sh
sudo bash scripts/install-portal-agent.sh <agent-id> <chemin-depot> https://portail.tadgroupe.com
```

Le script crée un compte Linux isolé, clone uniquement le commit courant sans
historique, refuse les chemins `.env` et de clés suivis par Git, crée le fichier
de configuration à permissions root, et installe l’unité
`tad-portal-agent@.service`. Il affiche uniquement l’empreinte SHA-256 du jeton.
Enregistrer cette empreinte dans Administration → Rapports des agents ; ne
jamais copier le jeton brut dans le Portail.

```sh
sudo -u <compte-agent-affiché-par-le-script> -H codex login
sudo systemctl enable --now tad-portal-agent@<agent-id>.service
```

Le runner commence alors à interroger le Portail toutes les 15 secondes. Il
crée une branche et un workspace local par tâche, puis publie seulement le
résumé et le rapport synthétique dans le journal du Portail. Le workspace reste
sur sa VM pour inspection.

Pour les agents dotés d’une politique d’opérations, installer le helper local
depuis ce même dépôt :

```sh
sudo bash scripts/install-agent-production-ops.sh <agent-id>
```

L’installateur vérifie la présence des conteneurs autorisés et valide la règle
sudoers avec `visudo`. Il n’accorde que les appels exacts `STATUS_APP` et
`RESTART_APP` pour le compte de service correspondant.

## État des VMs et limites de livraison

Les commandes d’installation pour les dépôts connus sont :

- VM 135 : `tdb-agent` sur `/home/debian/TDB-TID`, `cash-recon-agent` sur
  `/home/debian/CASH-RECON`, `revue-pdv-agent` sur
  `/home/debian/Revue-PDV-PROD`.
- VM 51 : `gparc-agent` sur `/home/debian/gparc-prod`.
- VM 91 : `recrutement-om-telco-agent` sur `/home/debian/RECRUT_OM`.
- VM Portail : `portal-agent` sur `/srv/tad/portail`.
- VM Supervision (`51.210.10.207`) : `monitoring-agent` sur le dépôt dédié
  `/srv/tad/monitoring-config-source`, limité aux configurations Prometheus,
  Grafana, Uptime Kuma, node-exporter et cAdvisor. Le site SEPTNEX reste hors
  de ce dépôt et du périmètre de l’agent.

La source Git locale de GLPI, SIRH/GED, ATF et MDM reste à identifier ou
confirmer ; aucun runner ne doit être installé pour ces agents avant de
confirmer le dépôt source. Les VMs 51 (GParc), 152 (SIRH/GED) et 51.178 (ATF)
ne sont pas accessibles en SSH depuis le Portail ; les commandes doivent y
être exécutées localement.

Les modifications de code restent dans le workspace isolé et sont rapportées
au Portail. Les opérations de service activées ne publient pas de code ni de
configuration. La création de PR, la fusion après CI et le déploiement d’une
version applicative nécessitent une procédure propre à chaque dépôt avec un
rollback validé ; le helper ne les déclenche pas.

Les anciens scripts `tad-agent-start.service` et `agent-dispatch-worker`
restent dédiés à la file historique d’actions de rapports. Ils ne sont pas le
canal de dispatch des nouvelles tâches locales.

## n8n local

n8n utilise sa base PostgreSQL dédiée et reste privé. Pour un accès ponctuel,
utiliser un tunnel SSH validé :

```sh
ssh -L 5678:127.0.0.1:5678 utilisateur@adresse-ip-vm
```

Ne jamais fournir à n8n le socket Docker, les secrets du portail ou une clé
SSH générale de production.
