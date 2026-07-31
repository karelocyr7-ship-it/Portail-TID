import { runAgentDispatchWorker } from "./worker";

void runAgentDispatchWorker().catch(() => {
  console.error(
    JSON.stringify({ event: "agent_dispatch.worker_start_failed" }),
  );
  process.exitCode = 1;
});
