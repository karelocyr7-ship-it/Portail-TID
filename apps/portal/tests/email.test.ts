import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailConfig } from "@/lib/email/config";
import { EmailConfigurationError, EmailValidationError } from "@/lib/email/errors";
import { sendTransactionalEmail } from "@/lib/email/send-email";
import { renderTemplate } from "@/lib/email/templates";

afterEach(() => vi.unstubAllEnvs());

describe("SMTP configuration", () => {
  it("requires a password when SMTP is enabled", () => {
    expect(() => getEmailConfig({ SMTP_ENABLED: "true", SMTP_PASSWORD: "" })).toThrow(EmailConfigurationError);
  });

  it("enforces STARTTLS on port 587", () => {
    const config = getEmailConfig({ SMTP_ENABLED: "false", SMTP_SECURE: "false", SMTP_REQUIRE_TLS: "true" });
    expect(config.SMTP_PORT).toBe(587);
    expect(config.SMTP_REQUIRE_TLS).toBe(true);
  });
});

describe("transactional messages", () => {
  it("always renders equivalent HTML and text content", () => {
    const rendered = renderTemplate("generic-notification", { title: "Bonjour", message: "Message de test" });
    expect(rendered.html).toContain("Message de test");
    expect(rendered.text).toContain("Message de test");
    expect(rendered.html).toContain("portail.tadgroupe.com");
  });

  it("rejects header injection before opening SMTP", async () => {
    vi.stubEnv("SMTP_ENABLED", "true");
    vi.stubEnv("SMTP_PASSWORD", "test-only");
    await expect(sendTransactionalEmail({
      to: "admin@example.com",
      subject: "Test\r\nBcc: attacker@example.com",
      template: "technical-alert",
    })).rejects.toBeInstanceOf(EmailValidationError);
  });

  it("rejects invalid recipients", async () => {
    vi.stubEnv("SMTP_ENABLED", "true");
    vi.stubEnv("SMTP_PASSWORD", "test-only");
    await expect(sendTransactionalEmail({
      to: "not-an-email",
      subject: "Test",
      template: "technical-alert",
    })).rejects.toBeInstanceOf(EmailValidationError);
  });
});
