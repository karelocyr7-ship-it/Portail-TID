const sageIdPattern = /^[A-Z0-9][A-Z0-9._/-]{1,63}$/;

export function normalizeSageId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return sageIdPattern.test(normalized) ? normalized : undefined;
}
