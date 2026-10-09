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
    const user = await prisma.portalUser.findFirst({
      where: {
        OR: [
          { keycloakSubject: identity.subject },
          ...(identity.sageId ? [{ sageEmployeeId: identity.sageId }] : []),
          ...(identity.employeeId ? [{ employeeId: identity.employeeId }] : []),
          ...(identity.email
            ? [
                {
                  email: {
                    equals: identity.email,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        assignments: {
          where: {
            profile: {
              active: true,
              application: { code: application, active: true },
            },
          },
          select: { profile: { select: { key: true } } },
        },
      },
    });
    const profiles = user?.active
      ? user.assignments.map(({ profile }) => profile.key)
      : [];
    return NextResponse.json({
      lookup: true,
      subject: identity.subject,
      identity: {
        employeeId: identity.employeeId ?? null,
        email: user?.email ?? identity.email ?? null,
        name: user?.displayName ?? identity.name ?? null,
        phone: user?.phone ?? identity.phone ?? null,
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
