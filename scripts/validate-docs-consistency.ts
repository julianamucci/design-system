/**
 * validate-docs-consistency.ts
 *
 * Verifica que todos os projetos importam traduções de docs/shared/content/
 * e que nenhuma cópia local de translations.json existe nos projetos.
 *
 * Uso:
 *   npx tsx scripts/validate-docs-consistency.ts
 *   (ou via CI como npm run validate:docs no package.json raiz)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const STACKS = ['design-system-react', 'design-system-vue', 'design-system-svelte', 'nortear-design-system'];
const SHARED_CONTENT = path.join(ROOT, 'docs/shared/content');

// ─── Cores para output ───────────────────────────────────────────────────────
const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW= '\x1b[33m';
const RESET = '\x1b[0m';

let errors   = 0;
let warnings = 0;

function error(msg: string)   { console.error(`${RED}✖ ${msg}${RESET}`);   errors++;   }
function warn(msg: string)    { console.warn(`${YELLOW}⚠ ${msg}${RESET}`);  warnings++; }
function ok(msg: string)      { console.log(`${GREEN}✔ ${msg}${RESET}`);                }

// ─── 1. Verifica que docs/shared/content existe e tem componentes ─────────────
console.log('\n── Verificando docs/shared/content/ ──\n');

if (!fs.existsSync(SHARED_CONTENT)) {
  error(`docs/shared/content/ não existe. Execute a migração primeiro.`);
  process.exit(1);
}

const sharedComponents = fs.readdirSync(SHARED_CONTENT, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

if (sharedComponents.length === 0) {
  error('Nenhum componente encontrado em docs/shared/content/');
  process.exit(1);
}

ok(`docs/shared/content/ tem ${sharedComponents.length} componente(s): ${sharedComponents.join(', ')}`);

// ─── 2. Verifica que cada componente tem translations.json ────────────────────
for (const comp of sharedComponents) {
  const jsonPath = path.join(SHARED_CONTENT, comp, 'translations.json');
  if (!fs.existsSync(jsonPath)) {
    error(`Falta translations.json em docs/shared/content/${comp}/`);
    continue;
  }

  const content = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const locales = Object.keys(content);

  if (!locales.includes('pt-BR')) error(`${comp}/translations.json: falta locale "pt-BR"`);
  if (!locales.includes('en'))    warn(`${comp}/translations.json: falta locale "en"`);
  if (!locales.includes('es'))    warn(`${comp}/translations.json: falta locale "es"`);

  // Verifica que todos os locales têm as mesmas chaves
  const ptKeys = JSON.stringify(Object.keys(flattenObject(content['pt-BR'] ?? {})).sort());
  for (const locale of locales.filter((l) => l !== 'pt-BR')) {
    const localeKeys = JSON.stringify(Object.keys(flattenObject(content[locale] ?? {})).sort());
    if (ptKeys !== localeKeys) {
      warn(`${comp}/translations.json: chaves divergem entre "pt-BR" e "${locale}"`);
    }
  }

  ok(`docs/shared/content/${comp}/translations.json — locales: [${locales.join(', ')}]`);
}

// ─── 3. Verifica exemplos por stack ──────────────────────────────────────────
console.log('\n── Verificando exemplos por stack ──\n');
const expectedExamples = ['react.tsx', 'vue.ts', 'svelte.ts', 'vanilla.ts'];

for (const comp of sharedComponents) {
  const examplesDir = path.join(SHARED_CONTENT, comp, 'examples');
  if (!fs.existsSync(examplesDir)) {
    warn(`${comp}: pasta examples/ não existe`);
    continue;
  }
  const existing = fs.readdirSync(examplesDir);
  for (const expected of expectedExamples) {
    if (!existing.includes(expected)) {
      warn(`${comp}/examples/${expected} não existe`);
    } else {
      ok(`${comp}/examples/${expected}`);
    }
  }
}

// ─── 4. Verifica que os projetos NÃO têm cópias locais ───────────────────────
console.log('\n── Verificando ausência de cópias locais ──\n');

for (const stack of STACKS) {
  const stackPath = path.join(ROOT, stack, 'src');
  if (!fs.existsSync(stackPath)) {
    warn(`${stack}/src não existe — pulando`);
    continue;
  }

  const localJsons = findFiles(stackPath, 'translations.json');
  if (localJsons.length > 0) {
    for (const f of localJsons) {
      error(`Cópia local encontrada: ${f.replace(ROOT + '/', '')}`);
    }
  } else {
    ok(`${stack}: sem cópias locais de translations.json ✓`);
  }
}

// ─── 5. Verifica que os projetos importam de @shared ─────────────────────────
console.log('\n── Verificando imports de @shared ──\n');

for (const stack of STACKS) {
  const srcPath = path.join(ROOT, stack, 'src');
  if (!fs.existsSync(srcPath)) continue;

  const docFiles = findFiles(srcPath, /Docs\.(tsx|vue|svelte|ts)$/);
  for (const file of docFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const hasSharedImport = content.includes('@shared/') || content.includes('docs/shared/');
    const hasLocalImport = content.includes('./content/') || content.includes('../content/');

    if (hasLocalImport) {
      error(`${file.replace(ROOT + '/', '')}: ainda importa de caminho local, use @shared/`);
    } else if (hasSharedImport) {
      ok(`${file.replace(ROOT + '/', '')}: importa de @shared ✓`);
    }
  }
}

// ─── Resultado ────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
if (errors > 0) {
  console.error(`\n${RED}✖ ${errors} erro(s), ${warnings} aviso(s). Corrija antes de commitar.${RESET}\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n${YELLOW}⚠ 0 erros, ${warnings} aviso(s).${RESET}\n`);
} else {
  console.log(`\n${GREEN}✔ Tudo certo! Documentação consistente entre todas as stacks.${RESET}\n`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findFiles(dir: string, matcher: string | RegExp): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...findFiles(fullPath, matcher));
    } else if (entry.isFile()) {
      const match = typeof matcher === 'string'
        ? entry.name === matcher
        : matcher.test(entry.name);
      if (match) results.push(fullPath);
    }
  }
  return results;
}

function flattenObject(obj: unknown, prefix = ''): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) return { [prefix]: obj };
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(result, flattenObject(v, key));
    } else {
      result[key] = v;
    }
  }
  return result;
}
