import { headers } from "next/headers";
import { getVisibleApplications } from "@/lib/catalog";

export async function GET() {
  const requestHeaders = await headers();
  const roles =
    process.env.NODE_ENV === "development"
      ? (
          requestHeaders.get("x-demo-roles") ??
          process.env.PORTAL_DEMO_ROLES ??
          ""
        )
          .split(",")
          .map((role) => role.trim())
          .filter(Boolean)
      : [];
  return Response.json(
    { data: getVisibleApplications(roles) },
    { headers: { "cache-control": "no-store" } },
  );
}
