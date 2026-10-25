import { existsSync, readFileSync, rmSync, rmdirSync } from "node:fs";
import path from "node:path";

export default async function stopOwnedServers() {
  const directory = process.env.PATHFORGE_E2E_STATE_DIR;
  if (!directory) return;
  for (const filename of ["frontend.json", "backend.json"]) {
    const file = path.join(directory, filename);
    if (!existsSync(file)) continue;
    const { pid, run_id: runId } = JSON.parse(readFileSync(file, "utf8")) as { pid: number; run_id: string };
    if (runId !== path.basename(directory) || !Number.isSafeInteger(pid) || pid <= 0) {
      throw new Error("Invalid E2E server ownership record");
    }
    try {
      // Direct process termination works in restricted Windows environments where
      // Playwright's taskkill /T cannot enumerate process trees.
      process.kill(pid, "SIGTERM");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
    rmSync(file);
  }
  rmdirSync(directory);
  // Allow the server wrappers and their shells to observe their child's exit.
  await new Promise((resolve) => setTimeout(resolve, 500));
}
