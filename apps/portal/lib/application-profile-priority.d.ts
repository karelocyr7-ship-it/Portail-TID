export function orderApplicationProfiles(
  application: string,
  profiles: ReadonlyArray<{ key: string; displayOrder: number }>,
): string[];
export function applicationProfileAccess(
  application: string,
  active: boolean,
  profiles: ReadonlyArray<{ key: string; displayOrder: number }>,
): { profiles: string[]; primaryProfile: string | null; authorized: boolean };
