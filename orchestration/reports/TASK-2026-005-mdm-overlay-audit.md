# Rapport MDM — miroir overlay vérifié

## Résultat

Le blocage « miroir source non confirmé » est levé pour l'overlay OIDC MDM.
Le miroir local `/srv/tad/agents/repositories/mdm` est enregistré dans Git au
commit `567f891` et sa provenance est documentée dans
`docs/infrastructure/mdm-source-provenance.md`.

## Limite importante

Le miroir est `overlay-only`. Il ne contient ni la source amont complète HMDM
5.38.1, ni le WAR. La reproductibilité complète de l'artefact reste donc non
démontrée.

## Audit statique

Contrôles réussis : JavaScript, intégrité Git, diff whitespace et absence de
secret OIDC littéral dans les fichiers suivis. Aucun accès VM, base, WAR ou
déploiement n'a été effectué.

Points à revoir par l'agent sécurité avant toute livraison :

- renouvellement de session après authentification ;
- validation JWT/JWKS à rendre explicitement démontrable ;
- attributs et garanties `SameSite` du cookie de session ;
- séparation des domaines et confiance dans le Host/proxy ;
- vérification stricte de l'identité e-mail ;
- rattachement reproductible de l'overlay au WAR HMDM 5.38.1.

## Décision

MDM n'est plus bloqué par l'absence de miroir. Il reste `ready_for_review` et
interdit de déployer tant que la source amont, la chaîne de build et la revue
sécurité ne sont pas validées humainement.
