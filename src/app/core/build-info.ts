import { version } from '../../../package.json';

export interface BuildInfo {
  /** SemVer from package.json, set with `npm version`. */
  version: string;
  /** Short git commit the build was made from; null without git (e.g. in unit tests). */
  commit: string | null;
  /** The working tree had uncommitted changes. */
  dirty: boolean;
  /** ISO timestamp of the build. */
  builtAt: string | null;
}

/** Replaced at build time by scripts/ng-with-build-info.mjs (`ng build --define`). */
declare const MC_BUILD_INFO: Omit<BuildInfo, 'version'> | undefined;

export const BUILD_INFO: BuildInfo = {
  version,
  ...(typeof MC_BUILD_INFO === 'undefined'
    ? { commit: null, dirty: false, builtAt: null }
    : MC_BUILD_INFO),
};
