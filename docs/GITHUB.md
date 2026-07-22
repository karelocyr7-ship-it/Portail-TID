# GitHub

- Compte ou organisation déclaré : `karelocyr7-ship-it`
- Dépôt déclaré : `Portail-TID`
- Dépôt distant localement configuré : non détecté lors de l’audit initial

Les workflows et modèles sont préparés localement. Ils exécutent l’installation
figée pnpm, le formatage, ESLint, TypeScript, les tests, l’audit des
dépendances, la détection de signatures de secrets et le build Docker sans
publication. La concurrence GitHub annule un ancien build de la même branche.

## Labels proposés

Créer ces labels dans le dépôt distant :

`agent:queued`, `agent:running`, `agent:review`, `agent:blocked`, `agent:done`,
`type:feature`, `type:bug`, `type:security`, `priority:low`,
`priority:normal`, `priority:high`, `priority:critical`.

## Protection de `main`

Après authentification GitHub et identification du dépôt `karelocyr7-ship-it/Portail-TID`,
configurer manuellement : Pull Request obligatoire, validation humaine, checks
`Quality`, `Security` et `Build` obligatoires, interdiction du push direct et
du force push. Cette configuration n’a pas été appliquée automatiquement.

Le dépôt distant n’est pas configuré dans ce checkout et `gh` n’est pas installé
sur la VM. Aucun push ni changement GitHub distant n’a donc été effectué.
