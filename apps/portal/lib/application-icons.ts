const applicationIconPaths: Record<string, string> = {
  "CASH-RECON": "/branding/apps/cash-recon.svg",
  TDB: "/branding/apps/tdb.svg",
  "REVUE-PDV": "/branding/apps/revue-pdv.png",
};

export function getApplicationIconPath(code: string): string | undefined {
  return applicationIconPaths[code];
}
