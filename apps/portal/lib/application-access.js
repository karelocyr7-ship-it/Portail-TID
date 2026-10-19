function applicationAccess(active, assignments) {
  return (
    active === true && Array.isArray(assignments) && assignments.length > 0
  );
}

module.exports = { applicationAccess };
