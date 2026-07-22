import { headers } from "next/headers";
import { getVisibleApplicationsFromDatabase } from "@/lib/catalog-db";

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
    { data: await getVisibleApplicationsFromDatabase(roles) },
    { headers: { "cache-control": "no-store" } },
  );
}
