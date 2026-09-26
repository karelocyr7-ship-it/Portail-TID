import { runProvisioningWorker } from "./worker";

runProvisioningWorker().catch((error) => {
  console.error(
    JSON.stringify({
      event: "provisioning.worker_failed",
      error: error instanceof Error ? error.message : "unknown",
    }),
  );
  process.exitCode = 1;
});
