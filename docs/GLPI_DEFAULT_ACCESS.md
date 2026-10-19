# Accès GLPI par défaut

La case était absente car le profil ACCESS de GLPI n'était pas `isDefault`.
Ce champ choisit le profil minimal affiché, pas une attribution automatique.

La livraison prévoit :
- activation du profil ACCESS comme choix minimal dans le catalogue ;
- case précochée à la création manuelle, décochable par l'administrateur ;
- attribution ACCESS pour les nouvelles identités actives issues des deux
  parcours SIRH (identité et premier accès), jamais lors d'une resynchronisation ;
- reprise des utilisateurs actifs sans accès ni historique de provisionnement
  GLPI. Les désactivations, retraits antérieurs et profils existants sont préservés.

## Limite importante

Il s'agit d'accès **portail**. Le connecteur GLPI n'est pas livré : les travaux
restent en attente de configuration. Aucune création locale ni session SSO
réussie pour tous les utilisateurs n'est annoncée. Le JIT reste désactivé et
les droits locaux GLPI restent inchangés. Aucun administrateur n'est créé.

## Livraison

PR, contrôles, fusion, sauvegarde et scripts/deploy.sh. Exécuter ensuite dans le
conteneur portail `scripts/enable-glpi-default-access.mjs` via stdin avec Node
en mode module, d'abord sans option, puis avec `--apply` après lecture du bilan.
Le script n'affiche ni identités ni secrets, utilise une transaction sérialisable
et journalise chaque attribution. Une seconde exécution n'ajoute rien.

## Retour arrière

Livrer l'image précédente pour annuler la présélection et la politique nouvelle.
Pour le catalogue, rétablir isDefault selon l'audit GLPI_DEFAULT_PROFILE_ENABLED.
Pour la reprise, retirer uniquement les associations encore attribuées par
policy:glpi-default-20261019, après comparaison avec les audits et les éventuelles
modifications ultérieures. Annuler leurs travaux encore en attente seulement.
Ne supprimer aucun compte ni donnée GLPI, ne restaurer aucune base globale.
Les nouveaux comptes créés depuis la livraison nécessitent une revue distincte.
