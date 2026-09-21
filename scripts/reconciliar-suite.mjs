#!/usr/bin/env node
/**
 * reconciliar-suite.mjs — a suíte mediu tudo o que dizia que ia medir?
 *
 * "Verde" numa suíte de navegador responde se o que RODOU passou. Não responde
 * se rodou. E a diferença não é teórica nesta casa:
 *
 *   2026-09-01, angular · o `preview.ts` importa `storybook/internal/core-events`,
 *     o otimizador do Vite só descobriu o subcaminho depois que a suíte começou,
 *     o pré-empacotamento mudou e a página RECARREGOU. Os onze arquivos em voo
 *     morreram com "Vitest failed to find the current suite" e foram contados
 *     como `(0 test)` — um deles era o `docs-smoke.stories.ts`, as 98 docs pages
 *     inteiras. A rodada só fechou vermelha por OUTRO motivo: com os outros
 *     vinte testes verdes, ela teria fechado VERDE sem medir a fumaça.
 *
 *   2026-09-13, svelte · sob contenção, o sumário disse
 *     `2 failed | 137 passed (383)`. Parecem duas falhas; eram 244 arquivos que
 *     nunca reportaram, e o sumário NÃO os rotula como skipped.
 *
 *   2026-09-20, svelte · `sheet-variants.stories.ts` falhou UMA vez em cinco, na
 *     primeira rodada depois de forçar a reotimização — `tests 67.08s` contra
 *     ~30s nas limpas. Não houve texto de asserção porque não houve asserção: o
 *     arquivo morreu. Foi o que levou a este portão.
 *
 * As três têm a mesma assinatura: a contagem ENCOLHE e nada fica vermelho. O
 * CLAUDE.md manda "conte ARQUIVOS, não só falhas" desde a primeira — e isso era
 * prática humana, sem detector. Prática humana não sobrevive a uma rodada de
 * madrugada com a suíte verde na tela.
 *
 * ## Como ele sabe o que DEVERIA ter rodado
 *
 * Perguntando ao próprio vitest: `vitest list --filesOnly --json`, com os mesmos
 * filtros da rodada. O conjunto esperado sai da resolução DELE, não de uma
 * reimplementação dos globs aqui — mapa paralelo envelhece em silêncio, que é a
 * classe de defeito que este arquivo existe para pegar. E `--filesOnly` resolve
 * por glob, sem abrir o navegador: ele não pode ser truncado pelo mesmo acidente
 * que trunca a rodada.
 *
 * ## Uso
 *
 *   node scripts/reconciliar-suite.mjs <stack> [filtros e flags do vitest...]
 *   node scripts/reconciliar-suite.mjs svelte src/components/ui/sheet
 *   node scripts/reconciliar-suite.mjs angular --projeto=storybook
 *
 * Sai 0 quando todo arquivo esperado reportou com pelo menos um teste; 1 quando
 * algum sumiu ou voltou vazio; 2 quando a própria medição não pôde ser feita.
 * O resultado da SUÍTE é preservado: se ela reprovou, isto também reprova.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const STACKS = {
  react: 'nortear-design-system-react',
  vue: 'nortear-design-system-vue',
  svelte: 'nortear-design-system-svelte',
  vanilla: 'nortear-design-system-vanilla',
  angular: 'nortear-design-system-angular',
};

const RAIZ = path.resolve(import.meta.dirname, '..');

/** Separador uniforme e caixa única: no Windows os dois lados divergem. */
function normalize(file) {
  return file.replace(/\\/g, '/').toLowerCase();
}

/**
 * `stream` manda a saída direto para o terminal em vez de capturá-la.
 *
 * A suíte SEMPRE transmite: capturar o stdout dela deixaria quem espera sem
 * nada na tela por dez ou vinte minutos, que é o cenário em que esta casa já
 * confundiu impasse com lentidão mais de uma vez. O relatório não vem do stdout
 * de qualquer forma — vem do arquivo JSON.
 */
function run(cwd, args, { stream = false } = {}) {
  return spawnSync('npx', ['vitest', ...args], {
    cwd,
    shell: true,
    ...(stream
      ? { stdio: 'inherit' }
      : { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }),
  });
}

function main() {
  const [stack, ...rest] = process.argv.slice(2);

  if (!stack || !STACKS[stack]) {
    console.error(`uso: node scripts/reconciliar-suite.mjs <${Object.keys(STACKS).join('|')}> [filtros do vitest]`);
    return 2;
  }

  // `--projeto` é nosso, não do vitest: ele não pode vazar para a linha de
  // comando dele.
  //
  // **O default é TODOS os projetos, e isso foi um conserto.** A primeira versão
  // fixava `--project=storybook`, e a varredura completa do svelte a desmascarou:
  // 321 arquivos e 1097 testes, contra os 385 arquivos que o `npm test` da stack
  // roda — ele é `vitest run` seco, e alcança também o projeto `unit`, com 64
  // arquivos de teste de nó. Um portão que substitui o `npm test` medindo MENOS
  // que ele, e calado, é exatamente o defeito que este arquivo existe para pegar:
  // a regra da casa chama isso de "portão que FILTRA exclui em silêncio", e foi
  // assim que 28 exports saíram da varredura de snippets sem nada reprovar.
  const projectArg = rest.find((a) => a.startsWith('--projeto='));
  const project = projectArg ? projectArg.slice('--projeto='.length) : null;
  const filters = rest.filter((a) => a !== projectArg);
  const projectFlag = project ? [`--project=${project}`] : [];

  // `--shard` divide a RODADA e não a enumeração — medido: `list` o ignora,
  // `run` o aplica. Foi exatamente assim que o plantio de "arquivo ausente"
  // provou este portão, o que quer dizer que uma rodada fatiada de verdade
  // seria acusada como defeito. Recusar é honesto; reconciliar um pedaço contra
  // o todo não é.
  if (filters.some((a) => a.startsWith('--shard'))) {
    console.error('`--shard` fatia a rodada mas não a enumeração: a reconciliação');
    console.error('acusaria como perdidos os arquivos do outro fatiamento. Rode as');
    console.error('fatias com `vitest run` e reconcilie a rodada inteira à parte.');
    return 2;
  }

  // `--watch` não termina, e sem fim não há relatório para reconciliar.
  if (filters.some((a) => a === '--watch' || a === '-w')) {
    console.error('`--watch` não produz relatório final — reconciliar exige rodada que fecha.');
    return 2;
  }

  // Um `--reporter` próprio substituiria o relator JSON de que a reconciliação
  // depende, e o portão passaria a não medir nada, calado.
  if (filters.some((a) => a.startsWith('--reporter'))) {
    console.error('`--reporter` é definido aqui (`default` + `json`): o JSON é a medição.');
    return 2;
  }

  const cwd = path.join(RAIZ, STACKS[stack]);
  const out = path.join(mkdtempSync(path.join(tmpdir(), 'reconciliar-')), 'report.json');

  console.log(`\n[1/2] enumerando o que DEVE rodar — ${stack}, projeto "${project ?? 'todos'}"`);

  // O JSON vai para ARQUIVO, nunca para o stdout. A primeira versão disto
  // recortava a saída a partir do primeiro `[` — e funcionou em toda medição de
  // máquina quente, porque ali o vitest só imprime o array. Na primeira rodada
  // de CACHE FRIO, que é a condição para a qual o portão existe, o Vite imprime
  // antes dele e o primeiro `[` passou a ser o de uma sequência de cor ANSI.
  // O portão reprovou a si mesmo com exit 2 na estreia, o que é o desfecho certo
  // para quem não consegue medir — mas o recorte de stdout era frágil pelo mesmo
  // motivo que esta casa já catalogou: funcionava por acidente do ambiente.
  const listOut = path.join(path.dirname(out), 'list.json');
  const listed = run(cwd, ['list', '--filesOnly', `--json=${listOut}`, ...projectFlag, ...filters]);

  if (listed.status !== 0 || !existsSync(listOut)) {
    console.error('a enumeração falhou — sem ela não há com o que comparar:');
    console.error(listed.stderr || listed.stdout);
    return 2;
  }

  let expected;
  try {
    // Conjunto, não lista: sem `--project` a enumeração cobre os dois projetos,
    // e um arquivo alcançado pelos dois viria duas vezes — o relatório o traz
    // uma só, e a diferença seria acusada como perda que não houve.
    expected = [
      ...new Set(JSON.parse(readFileSync(listOut, 'utf8')).map((entry) => normalize(entry.file))),
    ];
  } catch (err) {
    console.error(`a enumeração não devolveu JSON legível: ${err.message}`);
    return 2;
  }

  if (expected.length === 0) {
    // Zero esperado com filtro é quase sempre filtro errado, e passar calado
    // aqui seria o próprio defeito que este portão persegue.
    console.error('a enumeração não achou arquivo nenhum — filtro errado?');
    return 2;
  }

  console.log(`      ${expected.length} arquivo(s)\n\n[2/2] rodando a suíte`);
  const suite = run(
    cwd,
    [
      'run',
      ...projectFlag,
      '--reporter=default',
      '--reporter=json',
      `--outputFile.json=${out}`,
      ...filters,
    ],
    { stream: true },
  );

  if (!existsSync(out)) {
    console.error('\nA SUÍTE NÃO ESCREVEU RELATÓRIO — ela morreu antes do fim.');
    console.error('Não há como afirmar que arquivo nenhum foi medido.');
    return 1;
  }

  const report = JSON.parse(readFileSync(out, 'utf8'));
  const reported = new Map(
    (report.testResults ?? []).map((r) => [normalize(r.name), r.assertionResults?.length ?? 0]),
  );

  const missing = expected.filter((f) => !reported.has(f));
  const empty = expected.filter((f) => reported.get(f) === 0);

  console.log('\n── reconciliação ──────────────────────────────────────');
  console.log(`esperados   ${expected.length}`);
  console.log(`reportados  ${reported.size}`);
  console.log(`testes      ${report.numTotalTests ?? 0}`);

  for (const f of missing) {
    console.log(`\nSUMIU      ${path.relative(cwd, f)}`);
    console.log('           enumerado e ausente do relatório — o arquivo morreu no meio.');
  }
  for (const f of empty) {
    console.log(`\nVAZIO      ${path.relative(cwd, f)}`);
    console.log('           reportou com ZERO testes — é o `(0 test)`, não arquivo sem story.');
  }

  if (missing.length || empty.length) {
    console.log('\nA CONTAGEM ENCOLHEU. A suíte não mediu o que diz ter medido.');
    console.log('Suspeito nº 1: subcaminho descoberto tarde pelo otimizador do Vite');
    console.log('recarregou a página no meio. Declare-o em `optimizeDeps.include`');
    console.log('no `.storybook/main.ts` da stack. Suspeito nº 2: contenção de');
    console.log('memória — meça a RAM livre antes de culpar o código.');
    return 1;
  }

  console.log('\nTodo arquivo esperado reportou com pelo menos um teste.');
  // A suíte é dona do próprio veredito: reconciliar não absolve quem reprovou.
  return suite.status === 0 ? 0 : 1;
}

process.exit(main());
