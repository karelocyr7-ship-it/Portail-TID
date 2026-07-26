const applicationIconPaths: Record<string, string> = {
  ATF: "/branding/apps/atf.svg",
  "CASH-RECON": "/branding/apps/cash-recon.svg",
  GED: "/branding/apps/ged.svg",
  GPARC: "/branding/apps/gparc.svg",
  MDM: "/branding/apps/mdm.svg",
  RECRUTEMENT: "/branding/apps/recrutement.svg",
  SIRH: "/branding/apps/sirh.svg",
  TDB: "/branding/apps/tdb.svg",
  "REVUE-PDV": "/branding/apps/revue-pdv.png",
};

export function getApplicationIconPath(code: string): string | undefined {
  return applicationIconPaths[code];
}
