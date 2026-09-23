import {
  dispatchQueuedAgentActions,
  syncAgentActionStatuses,
  syncAgentReports,
} from "../agent-reports";

const pollIntervalMs = 15_000;

export async function runAgentDispatchWorker(): Promise<void> {
  let stopping = false;
  let wake: (() => void) | null = null;
  const stop = () => {
    stopping = true;
    wake?.();
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  console.info(JSON.stringify({ event: "agent_dispatch.worker_started" }));

  while (!stopping) {
    const startedAt = Date.now();
    try {
      const imported = await syncAgentReports();
      const dispatched = await dispatchQueuedAgentActions();
      await syncAgentActionStatuses();
      if (dispatched > 0) {
        console.info(
          JSON.stringify({
            event: "agent_dispatch.synchronized",
            imported,
            dispatched,
            durationMs: Date.now() - startedAt,
          }),
        );
      }
    } catch {
      console.error(
        JSON.stringify({
          event: "agent_dispatch.synchronization_failed",
          durationMs: Date.now() - startedAt,
        }),
      );
    }

    if (!stopping) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, pollIntervalMs);
        wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
      wake = null;
    }
  }

  console.info(JSON.stringify({ event: "agent_dispatch.worker_stopped" }));
}
