import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const local = path.join(root, 'backend', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const args = process.argv.slice(2);
const command = args[0] === '--test'
  ? ['-m', 'unittest', 'discover', '-s', 'scripts/tests', '-p', 'test_submission_package.py', '-v']
  : ['scripts/package_submission.py', ...args];
const result = spawnSync(existsSync(local) ? local : 'python', command, { cwd: root, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
