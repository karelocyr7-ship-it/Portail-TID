CREATE TABLE "AgentCredential" (
    "agentId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgentCredential_pkey" PRIMARY KEY ("agentId")
);

CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "summary" TEXT,
    "report" TEXT,
    "workspacePath" TEXT,
    "error" TEXT,
    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentTask_status_requestedAt_idx" ON "AgentTask"("status", "requestedAt");
CREATE INDEX "AgentTask_applicationId_requestedAt_idx" ON "AgentTask"("applicationId", "requestedAt");
CREATE INDEX "AgentTask_agentId_status_requestedAt_idx" ON "AgentTask"("agentId", "status", "requestedAt");
CREATE INDEX "AgentTask_agentId_status_leaseExpiresAt_idx" ON "AgentTask"("agentId", "status", "leaseExpiresAt");
