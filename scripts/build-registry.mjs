#!/usr/bin/env node
/**
 * Gerador do Nortear registry (estilo shadcn, sem Tailwind/React).
 *
 * Lê os fontes do nortear-design-system/ e emite, para cada componente PoC:
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
 * Para incluir um componente novo: adicione o slug em COMPONENTS.
 * Para alterar a camada base: edite INIT_FILES + INIT_ENTRY_IMPORTS + INIT_DEPS.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT       = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NORTEAR    = path.join(ROOT, 'nortear-design-system');
const SHARED     = path.join(ROOT, 'docs', 'shared');
const OUT_DIR    = path.join(ROOT, 'registry', 'v1');

// ─── Componentes a empacotar ─────────────────────────────────────────────────
const COMPONENTS = [
  { name: 'button', ts: 'src/components/ui/button.ts', css: 'src/styles/components/button.css' },
  { name: 'alert',  ts: 'src/components/ui/alert.ts',  css: 'src/styles/components/alert.css'  },
];

// ─── Camada base (init) ──────────────────────────────────────────────────────
// type ∈ paths.{lib|tokens|theme|vendor|styles}; o CLI compõe o destino final.
const INIT_FILES = [
  // lib
  { type: 'lib',    name: 'utils.ts',         src: path.join(NORTEAR, 'src/lib/utils.ts') },
  { type: 'lib',    name: 'sanitize-html.ts', src: path.join(NORTEAR, 'src/lib/sanitize-html.ts') },
  // tokens
  { type: 'tokens', name: 'tokens.css',       src: path.join(SHARED,  'tokens/tokens.css') },
  // themes
  { type: 'theme',  name: 'index.css',        src: path.join(SHARED,  'themes/index.css') },
  { type: 'theme',  name: 'default.css',      src: path.join(SHARED,  'themes/default.css') },
  { type: 'theme',  name: 'warm.css',         src: path.join(SHARED,  'themes/warm.css') },
  { type: 'theme',  name: 'cold.css',         src: path.join(SHARED,  'themes/cold.css') },
  { type: 'theme',  name: 'densities.css',    src: path.join(SHARED,  'themes/densities.css') },
  { type: 'theme',  name: 'fonts.css',        src: path.join(SHARED,  'themes/fonts.css') },
];

// Referências por {type, name} — o CLI computa o path relativo ao entry CSS
// usando os paths do nortear.json do consumidor (não hardcodamos diretórios).
const INIT_ENTRY_IMPORTS = [
  { type: 'tokens', name: 'tokens.css' },
  { type: 'theme',  name: 'index.css'  },
];

const INIT_DEPS = ['clsx', 'tailwind-merge'];

// ─── Build ──────────────────────────────────────────────────────────────────
const VERSION = '1.0.0';

await mkdir(OUT_DIR, { recursive: true });

const indexItems = [];

// init
{
  const files = [];
  for (const f of INIT_FILES) {
    const content = await readFile(f.src, 'utf8');
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
  const tsContent  = await readFile(path.join(NORTEAR, comp.ts),  'utf8');
  const cssContent = comp.css ? await readFile(path.join(NORTEAR, comp.css), 'utf8') : null;

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
