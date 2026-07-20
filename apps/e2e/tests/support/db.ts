import { execFileSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../../../..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/**
 * Reset de schema + re-execução do seed determinístico. Chamado uma vez por
 * arquivo de teste (test.beforeAll) — nunca por teste individual, porque o
 * domínio é acumulativo (estoque, caixa, fiado) e cada arquivo precisa
 * partir de um estado conhecido, independente do que outro arquivo deixou.
 *
 * `prisma migrate reset --force` já roda o seed automaticamente ao final.
 */
export function resetDatabase(): void {
  execFileSync(npmCmd, ['run', 'db:reset', '--workspace', 'apps/api'], {
    cwd: repoRoot,
    stdio: 'inherit',
    // No Windows, .cmd precisa passar pelo shell — sem isso o spawn falha com EINVAL.
    shell: process.platform === 'win32',
  });
}
