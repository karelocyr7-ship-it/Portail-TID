import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyApplicationIdToken } from "@/lib/oidc";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      application?: unknown;
      idToken?: unknown;
    };
    const application =
      typeof body.application === "string" ? body.application.trim() : "";
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
    if (!application || !idToken || !/^[A-Z0-9-]{2,32}$/.test(application)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const identity = await verifyApplicationIdToken(idToken, application);
    const prisma = getPrisma();
    const userInclude = {
      assignments: {
        where: {
          profile: {
            active: true,
            application: { code: application, active: true },
          },
        },
        select: { profile: { select: { key: true } } },
      },
    } as const;

    // The portal provisions access by Keycloak subject. If Keycloak has
    // re-created a user, the verified email is the only safe recovery key
    // available to this endpoint. Keep subject lookup authoritative and use
    // the email only when no subject record exists, without changing stored
    // identities implicitly.
    const subjectUser = await prisma.portalUser.findUnique({
      where: { keycloakSubject: identity.subject },
      include: userInclude,
    });
    const user =
      subjectUser ??
      (identity.employeeId
        ? await prisma.portalUser.findUnique({
            where: { employeeId: identity.employeeId },
            include: userInclude,
          })
        : null) ??
      (identity.email
        ? await prisma.portalUser.findFirst({
            where: {
              email: { equals: identity.email, mode: "insensitive" },
            },
            include: userInclude,
          })
        : null);
    const profiles = user?.active
      ? user.assignments.map(({ profile }) => profile.key)
      : [];
    return NextResponse.json({
      lookup: true,
      subject: identity.subject,
      identity: {
        employeeId: identity.employeeId ?? null,
        email: identity.email ?? null,
      },
      active: Boolean(user?.active),
      authorized: Boolean(user?.active) && profiles.length > 0,
      profiles,
      revision: user?.updatedAt.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Authorization lookup failed" },
      { status: 401 },
    );
  }
}
