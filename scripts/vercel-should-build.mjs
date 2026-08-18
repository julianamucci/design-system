// Ignored Build Step (Vercel) — decide se o deploy deve acontecer.
//
// O comando vem do `ignoreCommand` no vercel.json de cada stack, NÃO da UI:
//   "ignoreCommand": "node ../scripts/vercel-should-build.mjs"
// (roda no Root Directory do projeto, que é a pasta da stack — daí o `../`)
//
// Por que no vercel.json e não em Settings → Git → Ignored Build Step: o campo
// da UI já foi preenchido como `bash node ../scripts/vercel-should-build.mjs`,
// e o `bash` sobrando faz o shell tentar EXECUTAR O BINÁRIO do node como script
// ("cannot execute binary file"), derrubando o deploy antes de qualquer build.
// No arquivo o comando fica versionado, revisável e igual nas 5 stacks.
// Se o campo da UI ainda tiver algum valor, esvazie-o: o vercel.json prevalece,
// mas deixar os dois divergentes só confunde quem for depurar depois.
//
// Semântica da Vercel: exit 0 = PULA o build · exit 1 = builda.
//
// Regras:
//   1. Só builda a branch de produção (main). Previews de PR — incluindo os
//      do Dependabot — são pulados. Para reativar previews humanos, defina
//      a env VERCEL_PREVIEW_BUILDS=1 no projeto.
//   2. Em main, só builda se algo relevante para ESTA stack mudou: a pasta da
//      stack, docs/shared/ ou scripts/. Um push que só toca outra stack não
//      gasta build aqui.
//
// Limitação conhecida: o diff é HEAD~1..HEAD. Em MERGE de PR isso cobre o PR
// inteiro (diff contra o primeiro pai). Em push direto com vários commits,
// só o último é comparado — se um commit antigo do push tocou a stack e o
// último não, o build é pulado. Correção manual: botão Redeploy no painel.

import { execSync } from 'node:child_process';
import { basename } from 'node:path';

const SKIP = 0;
const BUILD = 1;

const ref = process.env.VERCEL_GIT_COMMIT_REF ?? '';
const previewsEnabled = process.env.VERCEL_PREVIEW_BUILDS === '1';

if (ref !== 'main' && !previewsEnabled) {
  console.log(`vercel-should-build: branch "${ref}" não é main e previews estão desligados — pulando build.`);
  process.exit(SKIP);
}

// Root Directory = pasta da stack (ex.: nortear-design-system-react)
const stackDir = basename(process.cwd());
const watched = ['.', '../docs/shared', '../scripts'];

try {
  // --quiet: exit 0 se NADA mudou nos paths; exit 1 se mudou.
  // HEAD~1 (e não HEAD^): no Windows o execSync usa cmd.exe, onde ^ é escape.
  execSync(`git diff HEAD~1 HEAD --quiet -- ${watched.join(' ')}`, { stdio: 'ignore' });
  console.log(`vercel-should-build: nenhum arquivo de ${stackDir}, docs/shared ou scripts mudou — pulando build.`);
  process.exit(SKIP);
} catch {
  // diff encontrou mudanças (ou HEAD~1 não existe — primeiro deploy/clone raso):
  // na dúvida, builda.
  console.log(`vercel-should-build: mudanças relevantes para ${stackDir} — buildando.`);
  process.exit(BUILD);
}
