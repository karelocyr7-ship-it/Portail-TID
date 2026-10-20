export type AssignedProfile = { id: string; applicationId: string };

// Checkboxes manage access, not role selection. Never replace an existing
// elevated profile with the minimal profile just because its box remains checked.
export function profilesForApplicationCheckboxes(
  current: AssignedProfile[],
  defaults: AssignedProfile[],
  requested: string[] | null,
): AssignedProfile[] {
  if (requested === null) return current;
  const editable = new Set(defaults.map((p) => p.applicationId));
  const selected = new Set(requested);
  if ([...selected].some((id) => !editable.has(id))) {
    throw new Error(
      "Chaque application sélectionnée doit avoir un profil minimal actif",
    );
  }
  // Applications absent from the checkbox editor cannot be silently revoked.
  const result = current.filter(
    (p) => !editable.has(p.applicationId) || selected.has(p.applicationId),
  );
  for (const applicationId of selected) {
    if (result.some((p) => p.applicationId === applicationId)) continue;
    const choices = defaults.filter((p) => p.applicationId === applicationId);
    if (choices.length !== 1) throw new Error("Profil minimal ambigu");
    result.push(choices[0]);
  }
  return [...new Map(result.map((p) => [p.id, p])).values()];
}
