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
    const user = await prisma.portalUser.findUnique({
      where: { keycloakSubject: identity.subject },
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
    return NextResponse.json({
      subject: identity.subject,
      active: Boolean(user?.active),
      profiles: user?.active
        ? user.assignments.map(({ profile }) => profile.key)
        : [],
    });
  } catch {
    return NextResponse.json(
      { error: "Authorization lookup failed" },
      { status: 401 },
    );
  }
}
