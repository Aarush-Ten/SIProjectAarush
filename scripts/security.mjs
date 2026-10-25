import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const python = path.join(root, ".tools/security-venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
if (!existsSync(python)) throw new Error("Create .tools/security-venv and install scripts/security-requirements.txt; see docs/security-audit.md.");
const output = path.join(root, ".test-tmp-security/latest");
mkdirSync(output, { recursive: true });
const checks = [];
function run(name, command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", timeout: 180000, maxBuffer: 10_000_000 });
  writeFileSync(path.join(output, `${name}.json`), result.stdout || "");
  if (result.stderr) writeFileSync(path.join(output, `${name}.stderr.txt`), result.stderr);
  const passed = !result.error && result.status === 0;
  checks.push({ name, passed, exit_code: result.status });
  process.stdout.write(`${name}: ${passed ? "PASS" : "FAIL (see private local report)"}\n`);
}
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Use npm run security:scan.");
run("scanner-tests", python, ["-m", "unittest", "discover", "-s", "scripts/security_tests", "-v"]);
run("npm-frontend", process.execPath, [npm, "audit", "--json", "--audit-level=low"], path.join(root, "frontend"));
run("npm-root", process.execPath, [npm, "audit", "--json", "--audit-level=low"]);
for (const [name, requirements] of [["python-runtime", "backend/requirements.txt"], ["python-authoring", "docs/pitch/requirements.txt"], ["python-security-tools", "scripts/security-requirements.txt"]]) {
  run(name, python, ["-m", "pip_audit", "-r", requirements, "--no-deps", "--disable-pip", "--format", "json"]);
}
run("bandit", python, ["-m", "bandit", "-r", "backend/app", "scripts", "--exclude", "scripts/tests,scripts/security_tests", "-ll", "-f", "json"]);
run("secrets", python, ["scripts/security_scan.py"]);
writeFileSync(path.join(output, "summary.json"), JSON.stringify({ checked_at_utc: new Date().toISOString(), checks }, null, 2));
process.exit(checks.every(check => check.passed) ? 0 : 1);
