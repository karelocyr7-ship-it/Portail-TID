import type { CatalogApplication } from "@/lib/catalog";

export function getApplicationLaunchHref(
  application: Pick<CatalogApplication, "code" | "url">,
  loginHint?: string,
): string | undefined {
  if (!application.url) return undefined;
  if (application.code !== "REVUE-PDV" || !loginHint) return application.url;

  try {
    const url = new URL(application.url);
    url.searchParams.set("login_hint", loginHint);
    return url.toString();
  } catch {
    return application.url;
  }
}
