import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const backendDirectory = fileURLToPath(new URL("../../backend/", import.meta.url));
const virtualEnvironmentPython = path.join(
  backendDirectory,
  ".venv",
  process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
);
const python = process.env.PLAYWRIGHT_PYTHON ??
  (existsSync(virtualEnvironmentPython) ? virtualEnvironmentPython : "python");
const options = { cwd: backendDirectory, env: process.env, stdio: "inherit" };

for (const args of [["-m", "alembic", "upgrade", "head"], ["-m", "app.seed"]]) {
  const result = spawnSync(python, args, options);
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const server = spawn(python, [
  fileURLToPath(new URL("./run-backend.py", import.meta.url)),
], options);
server.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
