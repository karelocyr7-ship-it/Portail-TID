const categories = [
  ["Pilotage", "Tableaux de pilotage et indicateurs", 1],
  ["Finance", "Applications financières", 2],
  ["Terrain", "Outils pour les équipes terrain", 3],
  ["Ressources humaines", "Outils RH", 4],
  ["Parc automobile", "Gestion du parc automobile", 5],
  ["Administration", "Documents et fonctions administratives", 6],
  ["Informatique", "Outils techniques et référentiels", 7],
] as const;

const applications = [
  [
    "CASH-RECON",
    "CASH-RECON",
    "Rapprochement financier",
    "Finance",
    ["PORTAL_ADMIN", "DIRECTION", "FINANCE"],
  ],
  [
    "TDB",
    "TDB",
    "Tableau de bord de pilotage",
    "Pilotage",
    ["PORTAL_ADMIN", "DIRECTION", "SUPERVISEUR"],
  ],
  [
    "GPARC",
    "GPARC",
    "Gestion du parc automobile",
    "Parc automobile",
    ["PORTAL_ADMIN", "GESTIONNAIRE_PARC", "DIRECTION"],
  ],
  [
    "REVUE-PDV",
    "Revue-PDV",
    "Revue des points de vente",
    "Terrain",
    ["PORTAL_ADMIN", "SUPERVISEUR", "AGENT_TERRAIN", "DIRECTION"],
  ],
  [
    "ATF",
    "ATF",
    "Application terrain",
    "Terrain",
    ["PORTAL_ADMIN", "SUPERVISEUR", "DIRECTION"],
  ],
  [
    "MDM",
    "MDM",
    "Master Data Management",
    "Informatique",
    ["PORTAL_ADMIN", "INFORMATIQUE"],
  ],
  [
    "SIRH",
    "SIRH",
    "Système d’information RH",
    "Ressources humaines",
    ["PORTAL_ADMIN", "RH", "DIRECTION"],
  ],
  [
    "GED",
    "GED",
    "Gestion électronique des documents",
    "Administration",
    ["PORTAL_ADMIN", "RH", "DIRECTION"],
  ],
  [
    "RECRUTEMENT",
    "Recrutement",
    "Suivi des recrutements",
    "Ressources humaines",
    ["PORTAL_ADMIN", "RH", "DIRECTION"],
  ],
  [
    "CA",
    "Suivi du chiffre d’affaires",
    "Suivi du chiffre d’affaires",
    "Finance",
    ["PORTAL_ADMIN", "DIRECTION", "FINANCE"],
  ],
] as const;

export { applications, categories };
