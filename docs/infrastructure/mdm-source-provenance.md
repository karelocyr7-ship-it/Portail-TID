# Provenance MDM vérifiée — 2026-07-28

## Résultat

Le dépôt Git applicatif complet de HMDM n'est pas présent sur la VM. La source
traçable disponible est l'overlay OIDC versionné dans
`integrations/hmdm-oidc/`. Il est maintenant considéré comme le miroir source
de l'intégration MDM, avec le statut `overlay-only` : le code amont HMDM et le
WAR ne sont pas reconstitués dans ce dépôt.

## Preuves en lecture seule

- VM : alias SSH `mdm-tad`, hôte observé `cnps`.
- Installation : `/opt/hmdm`.
- Compose : `/opt/hmdm/docker-compose.yml`.
- Image applicative : `headwindmdm/hmdm:0.1.7`.
- Version d'artefact observée : HMDM 5.38.1.
- WAR observé : `/opt/hmdm/work/cache/hmdm-5.38.1-os.war`.
- SHA-256 observé le 2026-07-28 :
  `487d9faeb220d745553711045c187b53dfd68dd3ee582f51bce1ec2a34687232`.
- Aucune valeur de `.env`, de configuration secrète, de base ou de sauvegarde
  n'a été lue.
- Aucun répertoire `.git` n'a été trouvé sous `/opt/hmdm`.

## Limites

Cette preuve établit la correspondance entre l'installation HMDM, l'image
déployée et l'overlay OIDC du Portail, mais ne prouve pas la reproductibilité
complète du WAR sans la source amont HMDM 5.38.1. Une prochaine étape séparée
devra fournir l'archive amont et son commit ou son artefact signé.

## Règle d'exploitation

L'agent `mdm-agent` peut auditer et modifier uniquement le miroir local de
l'overlay. Il ne doit pas déployer, modifier le WAR, envoyer de commande à un
terminal ou lire la configuration secrète de la VM sans validation humaine.
