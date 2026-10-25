import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const server = spawn(process.execPath, [
  fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)),
  "start", "--hostname", "127.0.0.1", "--port", "3000",
], { env: process.env, stdio: "inherit" });
server.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
if (server.pid) {
  mkdirSync(process.env.PATHFORGE_E2E_STATE_DIR, { recursive: true });
  writeFileSync(
    path.join(process.env.PATHFORGE_E2E_STATE_DIR, "frontend.json"),
    JSON.stringify({ pid: server.pid, run_id: path.basename(process.env.PATHFORGE_E2E_STATE_DIR) }),
  );
}
server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
