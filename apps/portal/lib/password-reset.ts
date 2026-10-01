import { normalizeSageId } from "@/lib/sage-id";
import { sendKeycloakPasswordReset } from "@/lib/keycloak-admin";
import { getPrisma } from "@/lib/prisma";

export async function requestPasswordReset(identifier: string): Promise<boolean> {
  const value = identifier.trim();
  if (!value || value.length > 200) return false;

  const prisma = getPrisma();
  const sageId = normalizeSageId(value);
  const user = sageId
    ? await prisma.portalUser.findFirst({
        where: {
          active: true,
          OR: [{ sageEmployeeId: sageId }, { employeeId: sageId }],
        },
        select: { id: true, keycloakSubject: true },
      })
    : value.includes("@")
      ? await prisma.portalUser.findFirst({
          where: {
            active: true,
            email: { equals: value.toLowerCase(), mode: "insensitive" },
          },
          select: { id: true, keycloakSubject: true },
        })
      : null;

  if (!user) return false;
  await sendKeycloakPasswordReset(user.keycloakSubject);
  return true;
}
