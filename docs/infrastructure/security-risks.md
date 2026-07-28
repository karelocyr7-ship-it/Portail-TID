# Risques de sécurité — audit lecture seule

## Élevés

- Plusieurs dépôts de production contiennent des modifications ou fichiers
  non suivis ; un agent ne doit pas les écraser ni les réinitialiser.
- Des services Docker exposent des ports directement sur la VM 135 ; la
  justification de chaque exposition et le pare-feu doivent être revus.
- MDM contient des fonctions de contrôle de terminaux ; toute action distante
  doit rester soumise à validation humaine et à un mode simulation.
- Recrutement traite potentiellement des données personnelles ; les fichiers,
  exports et URLs publiques doivent être contrôlés.
- ATF est non identifiée : aucune automatisation ne doit être tentée.

## Moyens

- Certificats et timers Certbot actifs, mais leurs dates d’expiration doivent
  être remontées au tableau de supervision.
- Les procédures de sauvegarde sont hétérogènes ; la preuve de restauration
  doit être collectée par application.

## Règles de confinement proposées

- aucun secret dans les rapports ;
- aucun accès Docker pour les agents applicatifs ;
- aucune action de production automatique ;
- une seule action approuvée en exécution à la fois ;
- revue indépendante avant mise en file ;
- rollback obligatoire avant toute action sensible.
