/**
 * Verifica, num Chromium real e com o `docs-tracking.ts` real, que
 * `docs_code_copy` só dispara quando o clique cai num controle.
 *
 * Existe porque a regra tem duas formas de uso que se contradizem:
 *   - `data-track="code"` num <button> (DocsVariants/DocsImport) — o trigger É o alvo;
 *   - `data-track="code"` na RAIZ de um bloco (CodeBlockDocs) — o trigger é enorme.
 * Sem guarda, a segunda forma conta seleção de texto e clique no título como cópia,
 * e o número no GA4 deixa de medir cópia. Nenhum audit estático pega isso.
 *
 * Uso: `node scripts/verify-docs-tracking.mjs [stack]` (padrão: react).
 * Sai 1 se algum caso falhar.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stack = process.argv[2] ?? 'react';
const STACK_DIR = path.join(REPO, `nortear-design-system-${stack}`);

// O bundler e o browser são agnósticos de stack — só a FONTE analisada é
// específica. Nem toda stack tem os dois instalados (o Vue não tem), então
// resolvemos a ferramenta na primeira que tiver, começando pela própria.
function resolveTooling(names) {
  const candidatas = [stack, 'react', 'svelte', 'vanilla', 'vue'];
  for (const dir of [...new Set(candidatas)]) {
    const pkg = path.join(REPO, `nortear-design-system-${dir}`, 'package.json');
    try {
      const req = createRequire(pkg);
      return names.map((n) => req(n));
    } catch {
      /* stack sem a dependência — tenta a próxima */
    }
  }
  throw new Error(`nenhuma stack tem ${names.join(' + ')} instalados`);
}

const [{ build }, { chromium }] = resolveTooling(['esbuild', 'playwright']);

const bundle = await build({
  entryPoints: [path.join(STACK_DIR, 'src/lib/docs-tracking.ts')],
  bundle: true,
  format: 'iife',
  globalName: 'DT',
  write: false,
  logLevel: 'silent',
  alias: {
    '@': path.join(STACK_DIR, 'src'),
    '@shared': path.join(REPO, 'docs/shared'),
  },
});

const browser = await chromium.launch();
const page = await browser.newPage();

await page.setContent(`
  <div id="root">
    <!-- forma nova: o atributo marca a RAIZ do bloco -->
    <div data-track="code" data-track-id="code-block:demonstracao:exemplo-tsx">
      <span id="titulo">exemplo.tsx</span>
      <button id="copiar" data-slot="code-block-copy">copiar</button>
      <div id="scroll" tabindex="0"><pre><code id="codigo">const x = 1;</code></pre></div>
    </div>
    <!-- forma antiga: o atributo marca o próprio <button> -->
    <button id="toggle" data-track="code" data-track-id="alert:code:default">Ver código</button>
  </div>
`);

await page.addScriptTag({ content: bundle.outputFiles[0].text });
await page.evaluate(() => {
  window.__events = [];
  window.gtag = (...args) => window.__events.push(args);
  window.DT.mountDocsTracking(document.getElementById('root'), { componentSlug: 'code-block' });
});

const copias = () =>
  page.evaluate(() => window.__events.filter((e) => e[1] === 'docs_code_copy').length);

const CASOS = [
  ['clique no botão copiar', '#copiar', 1],
  ['clique no título do bloco', '#titulo', 0],
  ['clique no código', '#codigo', 0],
  ['clique na área de scroll', '#scroll', 0],
  ['clique no toggle da forma antiga (<button>)', '#toggle', 1],
];

let falhas = 0;
for (const [nome, seletor, esperado] of CASOS) {
  const antes = await copias();
  await page.click(seletor, { force: true });
  const obtido = (await copias()) - antes;
  const ok = obtido === esperado;
  if (!ok) falhas += 1;
  console.log(`${ok ? 'PASS ' : 'FALHA'}  ${nome} — esperado ${esperado}, obtido ${obtido}`);
}

await browser.close();
console.log(falhas ? `\n${stack}: ${falhas} falha(s)` : `\n${stack}: todos os casos passaram`);
process.exit(falhas ? 1 : 0);
