import { getVisibleApplicationsFromDatabase } from "@/lib/catalog-db";
import { getRoles, getSession } from "@/lib/oidc";

export async function GET() {
  const session = await getSession();
  const roles = getRoles(session);
  return Response.json(
    {
      data: await getVisibleApplicationsFromDatabase(
        roles,
        session?.subject,
        session?.employeeId,
      ),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
