#!/usr/bin/env node
/**
 * Gerador do Nortear registry (componentes copiáveis, sem Tailwind/React).
 *
 * Lê os fontes do nortear-design-system-vanilla/ e emite, para cada componente PoC:
 *   - registry/v1/<name>.json    — manifesto com files[].content inlinado
 *   - registry/v1/init.json      — camada base (lib/, tokens, themes)
 *   - registry/v1/index.json     — índice
 *
 * Convenções:
 *   - Os manifestos preservam imports `@/lib/...` e `@/components/ui/...`. O CLI
 *     reescreve para caminhos relativos no momento do install (com base no
 *     nortear.json do projeto consumidor).
 *   - O `type` de cada arquivo (component | style | lib | tokens | theme | vendor)
 *     define onde o CLI escreve (paths.<type> do nortear.json).
 *
 * Para incluir um componente novo: adicione o slug em COMPONENTS, que mora em
 * `registry-fontes.mjs` — o mesmo módulo que o portão `registry_defasado` lê.
 * Para alterar a camada base: edite INIT_FILES lá, e INIT_ENTRY_IMPORTS +
 * INIT_DEPS aqui.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPONENTS, INIT_FILES } from './registry-fontes.mjs';

const ROOT       = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR    = path.join(ROOT, 'registry', 'v1');

// ─── O que empacotar ─────────────────────────────────────────────────────────
// O mapa NÃO mora aqui: ele é declarado uma vez em `registry-fontes.mjs`, que
// este gerador e o portão `registry_defasado` do `audit.mjs` leem juntos. Duas
// cópias dele significariam um portão comparando contra um caminho que deixou
// de ser a origem — verde medindo a coisa errada.
// type ∈ paths.{lib|tokens|theme|vendor|styles}; o CLI compõe o destino final.

// Referências por {type, name} — o CLI computa o path relativo ao entry CSS
// usando os paths do nortear.json do consumidor (não hardcodamos diretórios).
const INIT_ENTRY_IMPORTS = [
  { type: 'tokens', name: 'tokens.css' },
  { type: 'theme',  name: 'index.css'  },
];

const INIT_DEPS = ['clsx'];

// ─── Build ──────────────────────────────────────────────────────────────────
const VERSION = '1.0.0';

await mkdir(OUT_DIR, { recursive: true });

const indexItems = [];

// init
{
  const files = [];
  for (const f of INIT_FILES) {
    const content = await readFile(path.join(ROOT, f.src), 'utf8');
    files.push({ type: f.type, name: f.name, content });
  }
  const manifest = {
    name: 'init',
    version: VERSION,
    description: 'Camada base do Nortear: lib/, tokens, themes e os @imports do entry CSS.',
    dependencies: INIT_DEPS,
    registryDependencies: [],
    files,
    entryImports: INIT_ENTRY_IMPORTS,
  };
  await writeJson(path.join(OUT_DIR, 'init.json'), manifest);
  indexItems.push({ name: 'init', version: VERSION, registryDependencies: [] });
  console.log(`✓ init.json (${files.length} arquivos)`);
}

// componentes
for (const comp of COMPONENTS) {
  const tsContent  = await readFile(path.join(ROOT, comp.ts),  'utf8');
  const cssContent = comp.css ? await readFile(path.join(ROOT, comp.css), 'utf8') : null;

  const { npmDeps, registryDeps } = detectDeps(tsContent);

  const files = [
    { type: 'component', name: `${comp.name}.ts`, content: tsContent },
  ];
  if (cssContent) {
    files.push({ type: 'style', name: `${comp.name}.css`, content: cssContent });
  }

  // init é dep implícita de todo componente (precisa de tokens/themes/lib).
  // Não declaramos no registryDependencies p/ não rodar add init sempre;
  // o usuário roda `nortear init` uma vez antes do primeiro add.
  const manifest = {
    name: comp.name,
    version: VERSION,
    dependencies: [...npmDeps].sort(),
    registryDependencies: [...registryDeps].sort(),
    files,
  };
  await writeJson(path.join(OUT_DIR, `${comp.name}.json`), manifest);
  indexItems.push({
    name: comp.name,
    version: VERSION,
    registryDependencies: [...registryDeps].sort(),
  });
  console.log(`✓ ${comp.name}.json (npm: ${[...npmDeps].join(', ') || '∅'}; registry: ${[...registryDeps].join(', ') || '∅'})`);
}

// index
await writeJson(path.join(OUT_DIR, 'index.json'), {
  version: VERSION,
  registry: 'nortear',
  items: indexItems,
});
console.log(`✓ index.json (${indexItems.length} itens)`);

// ─── Helpers ────────────────────────────────────────────────────────────────
async function writeJson(file, obj) {
  await writeFile(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

// Extrai imports do TS e classifica em npm vs registry (@/components/ui/X).
// Ignora @/lib/X (vem com init) e @/styles/X (CSS do próprio componente).
function detectDeps(source) {
  const npm = new Set();
  const reg = new Set();
  // matches: `from '...'` e `import '...'`
  const re = /(?:from|import)\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source))) {
    const spec = m[1];
    if (spec.startsWith('@/components/ui/')) {
      reg.add(spec.replace('@/components/ui/', ''));
    } else if (spec.startsWith('@/') || spec.startsWith('.')) {
      // aliases internos / paths relativos — não são deps externas
      continue;
    } else if (spec.startsWith('node:')) {
      continue;
    } else {
      // pacote npm: pega só `pkg` (ou `@scope/pkg`)
      const parts = spec.split('/');
      const pkg = spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
      npm.add(pkg);
    }
  }
  return { npmDeps: npm, registryDeps: reg };
}
