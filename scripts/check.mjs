import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backend = join(root, "backend");
const localPython = join(backend, ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const python = existsSync(localPython) ? localPython : "python";

function run(command, args, cwd) {
  process.stdout.write(`\n> ${command} ${args.join(" ")}\n`);
  const result = spawnSync(command, args, { cwd, stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Calling npm's JS entry point avoids Windows .cmd shell quoting and works from npm run.
function npm(args) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("Run this script using npm run check (npm_execpath is missing).");
  run(process.execPath, [npmCli, ...args], join(root, "frontend"));
}

// Isolated temporary/cache paths also work after switching Windows execution accounts.
const testTemporary = mkdtempSync(join(tmpdir(), "pathforge-check-"));
try {
  run(python, ["-m", "pytest", "-q", "-p", "no:cacheprovider", "--basetemp", join(testTemporary, "pytest")], backend);
} finally {
  // This exact absolute path was created by this process, never supplied by a caller.
  if (resolve(testTemporary).startsWith(resolve(tmpdir()) + (process.platform === "win32" ? "\\" : "/"))) {
    rmSync(testTemporary, { recursive: true, force: true });
  }
}
run(python, [join(root, "scripts", "export_openapi.py"), "--check"], backend);
npm(["test"]);
npm(["run", "typecheck"]);
npm(["run", "build"]);
if (process.argv.includes("--e2e")) npm(["run", "test:e2e"]);
process.stdout.write("\nPrototype checks passed (deterministic core, optional Phase 3 features and expert administration).\n");
