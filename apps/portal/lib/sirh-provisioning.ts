import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySirhSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  secret = process.env.SIRH_PROVISIONING_SECRET,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!secret || !timestamp || !signature) return false;
  const parsedTimestamp = Number(timestamp);
  const maxSkew = Number(process.env.SIRH_PROVISIONING_MAX_SKEW_SECONDS ?? 300);
  if (
    !Number.isInteger(parsedTimestamp) ||
    !Number.isFinite(maxSkew) ||
    maxSkew < 30 ||
    Math.abs(now - parsedTimestamp) > maxSkew
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const supplied = signature
    .replace(/^sha256=/, "")
    .trim()
    .toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
