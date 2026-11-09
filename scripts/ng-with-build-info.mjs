#!/usr/bin/env node
// Runs the Angular CLI with build information (version, git commit, build time) as the global
// MC_BUILD_INFO, read by src/app/core/build-info.ts. The version comes from backend/pom.xml, the
// single version source of mission control (frontend and backend are released together).
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** `<version>` of the project itself, not of the Spring Boot parent. */
function pomVersion() {
  const pom = readFileSync(new URL('../backend/pom.xml', import.meta.url), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<parent>[\s\S]*?<\/parent>/, '');
  const version = pom.match(/<version>\s*([^<\s]+)\s*<\/version>/)?.[1];
  if (!version) {
    throw new Error('No <version> found in backend/pom.xml');
  }
  return version;
}

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
  version: pomVersion(),
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
