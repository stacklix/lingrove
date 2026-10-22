import { execFile } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function verifyPagesBuild({
  repository, commit, api, wait, log = console.log, attempts = 48,
}) {
  if (!repository || !commit) throw new Error('GITHUB_REPOSITORY and RELEASE_COMMIT are required');
  const builds = `repos/${repository}/pages/builds`;
  await api(builds, 'POST');
  let lastBuild;
  for (let attempt = 0; attempt < attempts; attempt++) {
    // A second Pages request can cancel the first build. Follow the latest build
    // for this commit rather than pinning verification to a cancelled build URL.
    lastBuild = await api(`${builds}/latest`, 'GET');
    if (lastBuild.commit === commit && lastBuild.status === 'built') return;
    log(`Pages ${lastBuild.commit}: ${lastBuild.status}${lastBuild.error?.message ? ` (${lastBuild.error.message})` : ''}`);
    // Pages may briefly report errored while its replacement deployment queues.
    // Only a successful build of the requested commit counts as publication.
    if (attempt + 1 < attempts) await wait(10_000);
  }
  throw new Error(`Timed out waiting for Pages to build ${commit}; latest: ${lastBuild?.commit} ${lastBuild?.status}${lastBuild?.error?.message ? `: ${lastBuild.error.message}` : ''}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await verifyPagesBuild({
      repository: process.env.GITHUB_REPOSITORY,
      commit: process.env.RELEASE_COMMIT,
      api: async (endpoint, method) => {
        const { stdout } = await exec('gh', ['api', '--method', method, endpoint]);
        return JSON.parse(stdout);
      },
      wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    });
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `Pages published commit ${process.env.RELEASE_COMMIT}.\n`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
