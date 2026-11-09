import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Removes the throw-away database of the test backend, also after failed runs. */
export default function globalTeardown(): void {
  const compose = resolve(__dirname, '../backend/docker-compose.e2e.yml');
  try {
    execFileSync('docker', ['compose', '-f', compose, 'down', '--volumes'], { stdio: 'inherit' });
  } catch (error) {
    // Do not hide the test results; the next run removes the database before starting it again
    console.warn('Could not remove the e2e database:', error);
  }
}
