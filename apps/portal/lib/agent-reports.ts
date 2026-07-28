import { getPrisma } from "@/lib/prisma";

export async function getAgentReports() {
  return getPrisma().agentReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      actions: {
        orderBy: { requestedAt: "desc" },
        take: 3,
      },
    },
  });
}
