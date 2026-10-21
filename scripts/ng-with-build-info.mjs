#!/usr/bin/env node
// Runs the Angular CLI with build information (git commit, build time) as the global
// MC_BUILD_INFO, read by src/app/core/build-info.ts. The version itself comes from package.json.
import { execFileSync, spawn } from 'node:child_process';

function git(...args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

const commit = git('rev-parse', '--short', 'HEAD');
const info = {
  commit,
  // Uncommitted changes: the build does not match the commit exactly
  dirty: commit !== null && git('status', '--porcelain') !== '',
  builtAt: new Date().toISOString(),
};

const child = spawn(
  'ng',
  [...process.argv.slice(2), '--define', `MC_BUILD_INFO=${JSON.stringify(info)}`],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);
child.on('exit', (code, signal) =>
  signal ? process.kill(process.pid, signal) : process.exit(code ?? 1),
);
