export const employeeIdPattern = /^(?:TID|TIDP)\d{3,}$/;

export function normalizeEmployeeId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return employeeIdPattern.test(normalized) ? normalized : undefined;
}

export function isEmployeeId(value: unknown): value is string {
  return Boolean(normalizeEmployeeId(value));
}
