// Priority selects a landing profile; it does not grant or combine permissions.
const priorities = new Map(Object.entries({
  "REVUE-PDV": ["super_admin", "admin", "ro", "rc", "sup_orange", "rz", "auditeur"],
  "CASH-RECON": ["ADMIN", "DAF", "DG", "TRESORIER", "CASH_MANAGER", "VIEWER"],
  TDB: ["ADMIN", "MANAGER", "SUPERVISOR", "DIRECTION", "VIEWER"],
  GPARC: ["ADMIN", "DAF", "CHAUFFEUR_GESTIONNAIRE", "GESTIONNAIRE", "CHAUFFEUR"],
  MDM: ["ADMIN", "USER", "OBSERVER"],
  ATF: ["ADMIN", "USER", "OBSERVER", "OBSERVER_LIMITED"],
  RECRUTEMENT: ["RECRUT_OCI_ADMIN", "RECRUT_OCI_GESTIONNAIRE", "RECRUT_OCI_RO", "RECRUT_OCI_SUPERVISEUR", "RECRUT_OCI_DIRECTION"],
}));

function orderApplicationProfiles(application, profiles) {
  const priority = priorities.get(application) || [];
  const rank = (key) => {
    const index = priority.indexOf(key);
    return index < 0 ? priority.length : index;
  };
  return [...profiles].sort((a, b) =>
    rank(a.key) - rank(b.key)
    || a.displayOrder - b.displayOrder
    || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  ).map(({ key }) => key);
}

function applicationProfileAccess(application, active, profiles) {
  const ordered = active === true ? orderApplicationProfiles(application, profiles) : [];
  return { profiles: ordered, primaryProfile: ordered[0] ?? null, authorized: ordered.length > 0 };
}

module.exports = { orderApplicationProfiles, applicationProfileAccess };
