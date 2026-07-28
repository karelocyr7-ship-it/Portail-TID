CREATE TABLE "AgentReport" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "reportBody" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "riskLevel" INTEGER NOT NULL DEFAULT 0,
    "proposal" JSONB,
    "evidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentReport_taskId_key" ON "AgentReport"("taskId");
CREATE INDEX "AgentReport_status_createdAt_idx" ON "AgentReport"("status", "createdAt");
CREATE INDEX "AgentReport_applicationId_createdAt_idx" ON "AgentReport"("applicationId", "createdAt");
CREATE INDEX "AgentAction_status_requestedAt_idx" ON "AgentAction"("status", "requestedAt");
CREATE INDEX "AgentAction_reportId_requestedAt_idx" ON "AgentAction"("reportId", "requestedAt");

ALTER TABLE "AgentAction"
ADD CONSTRAINT "AgentAction_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "AgentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
