// Supported company prefixes: TID, TIDS, TIDC, TIDP, TIDPS and TIDPC.
export const employeeIdPattern = /^TID(?:P[SC]?|[SC])?\d{3,}$/;

export function normalizeEmployeeId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return employeeIdPattern.test(normalized) ? normalized : undefined;
}

export function isEmployeeId(value: unknown): value is string {
  return Boolean(normalizeEmployeeId(value));
}
