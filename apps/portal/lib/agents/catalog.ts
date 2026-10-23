export const agentCatalog = {
  "portal-agent": { applicationId: "portal", name: "Portail" },
  "supervision-agent": {
    applicationId: "supervision",
    name: "Supervision / SEPTNEX",
  },
  "glpi-agent": { applicationId: "glpi", name: "GLPI" },
  "sirh-agent": { applicationId: "sirh", name: "SIRH / GED" },
  "tdb-agent": { applicationId: "tdb", name: "TDB / Perf-TID" },
  "cash-recon-agent": { applicationId: "cash-recon", name: "CASH-RECON" },
  "revue-pdv-agent": { applicationId: "revue-pdv", name: "Revue-PDV" },
  "atf-agent": { applicationId: "atf", name: "ATF" },
  "gparc-agent": { applicationId: "gparc", name: "GParc" },
  "mdm-agent": { applicationId: "mdm", name: "MDM" },
  "recrutement-om-telco-agent": {
    applicationId: "recrutement-om-telco",
    name: "Recrutement OM / Telco",
  },
} as const;

export type PortalAgentId = keyof typeof agentCatalog;

export function isPortalAgentId(value: string): value is PortalAgentId {
  return Object.hasOwn(agentCatalog, value);
}

export function agentForApplication(applicationId: string) {
  return Object.entries(agentCatalog).find(
    ([, agent]) => agent.applicationId === applicationId,
  )?.[0] as PortalAgentId | undefined;
}
