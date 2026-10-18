# Première connexion SIRH → Keycloak — candidate non livrée

État au 18 octobre 2026 : développement sur branche, aucune modification de
production, aucune fusion. Autorisation de push/PR limitée à cette correction.

## Diagnostic et candidate

Keycloak constaté : 26.6.2, realm tad-groupe. La remise RH du secret HRMS
et le provisionnement d'identité du portail étaient deux flux distincts.
La candidate ajoute une remise synchrone signée HMAC via HTTPS, distincte
des jobs d'identité, et une création Keycloak avec credential temporaire
natif et UPDATE_PASSWORD. Aucun courriel d'activation n'est envoyé par ce
nouveau flux. Le parcours de mot de passe oublié existant est conservé.

Le matricule reste une chaîne, les rôles et affectations existants ne sont
pas modifiés. Les nouveaux comptes ne reçoivent aucune application par défaut.
Le rejeu du requestId est refusé ; un verrou transactionnel PostgreSQL
sérialise les demandes initiales du même matricule. Les journaux ne reçoivent
que des codes bornés, jamais les corps des échanges.

## Contrôles exécutés

- make lint, make typecheck : réussis.
- make test : 56 tests Vitest et 12 tests Node réussis.
- make build : échec Turbopack lié aux dépendances symlinkées hors worktree.
- next build --webpack : réussi, y compris après protection des comptes legacy.
- Keycloak 26.6.2 et PostgreSQL éphémères isolés : initialisation READY et
  rejet 409 du même requestId constatés avec une identité synthétique.
- Parcours navigateur portail isolé réussi : connexion provisoire, changement
  obligatoire sans e-mail, arrivée au portail sans applications, refus de
  l'ancien secret, synchronisation d'identité, nouvelle demande protégée,
  connexion avec le mot de passe personnel après cette synchronisation.
- Scan des journaux portail et Keycloak isolés : les deux mots de passe
  synthétiques sont absents. Le contrôle des files et logs SIRH reste à finir.
- SIRH isolé : 6 tests de transfert mocké, 4 régressions HTTP de changement
  de mot de passe, 10 tests de fiches/permissions réussis. Build Vue réussi.

Le test navigateur initialise directement un compte synthétique par l'API
portail. Il ne prouve pas encore la chaîne intégrée depuis la création d'un
salarié SIRH ni la reprise legacy. Aucune réussite globale annoncée.

## Blocages de livraison

1. Reprise après réponse perdue : la présence d'un credential protège le
   compte mais ne permet pas actuellement de remettre l'accès provisoire.
2. Compte legacy sans credential : lecture puis reset-password ne constitue
   pas une opération conditionnelle atomique vis-à-vis d'un changement natif
   concurrent. La candidate refuse donc cette mutation (REVIEW_REQUIRED).
3. Recette intégrée SIRH réel isolé → portail, concurrence, panne/reprise,
   vérification finale des logs et des files, encore à terminer.
4. Migrations et sauvegardes de livraison/rollback à vérifier avant fusion.

TID1000 : contrôle en lecture seule, compte activé, actions UPDATE_PASSWORD
et VERIFY_EMAIL présentes, liste de credentials vide au moment du contrôle.
Pas de modification, pas de connexion de test, pas de secret réémis.

## Livraison et retour arrière (préparatoire, ne pas exécuter maintenant)

Terminer les contrôles ci-dessus ; figer et tester les deux commits ; ouvrir
les PR ; fusionner après contrôles réussis. Produire les backups cohérents
portail/Keycloak/SIRH et vérifier leur restauration. Exécuter la procédure
documentée scripts/deploy.sh depuis un checkout propre de main et la procédure
SIRH avec backup --with-files, Compose config --quiet et migration validée
sur clone. Vérifier santé puis parcours synthétique sans courriel réel.

Retour : conserver les tags exacts précédents et les sauvegardes ; rétablir
les images précédentes selon les procédures de chaque projet. Ne pas effacer
les comptes créés ni restaurer aveuglément une base après de nouvelles
écritures utilisateur. Le champ SIRH ajouté est nullable et peut rester
présent lors du retour aux images précédentes. Les changements Keycloak
sur des utilisateurs ne sont pas annulés par un rollback d'image.
