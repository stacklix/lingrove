import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function verifyPagesSource({ repository, api }) {
  if (!repository) throw new Error('GITHUB_REPOSITORY is required');
  const site = await api(`repos/${repository}/pages`, 'GET');
  if (site.build_type !== 'workflow') {
    throw new Error(
      `Set Settings → Pages → Build and deployment → Source to GitHub Actions before publishing: https://github.com/${repository}/settings/pages`,
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await verifyPagesSource({
      repository: process.env.GITHUB_REPOSITORY,
      api: async (endpoint, method) => {
        const { stdout } = await exec('gh', ['api', '--method', method, endpoint]);
        return JSON.parse(stdout);
      },
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
