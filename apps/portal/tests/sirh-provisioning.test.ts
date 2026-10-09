import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizeSageId } from "@/lib/sage-id";
import { verifySirhSignature } from "@/lib/sirh-provisioning";

describe("onboarding SIRH", () => {
  it("normalise un identifiant Sage", () => {
    expect(normalizeSageId(" sage-001 ")).toBe("SAGE-001");
    expect(normalizeSageId("")).toBeUndefined();
    expect(normalizeSageId("sage id")).toBeUndefined();
  });

  it("vérifie une signature HMAC avec fenêtre temporelle", () => {
    const secret = "test-sirh-secret";
    const body = JSON.stringify({
      sageId: "SAGE-001",
      email: "test@example.test",
    });
    const timestamp = "1700000000";
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    expect(
      verifySirhSignature(body, timestamp, signature, secret, 1700000000),
    ).toBe(true);
    expect(
      verifySirhSignature(body, timestamp, `${signature}0`, secret, 1700000000),
    ).toBe(false);
    expect(
      verifySirhSignature(body, timestamp, signature, secret, 1700000401),
    ).toBe(false);
  });
});
