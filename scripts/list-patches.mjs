#!/usr/bin/env node
/**
 * list-patches.mjs — inventário de todos os marcadores `// PATCH:` no monorepo.
 *
 * Uso:
 *   node scripts/list-patches.mjs                   # todos os stacks
 *   node scripts/list-patches.mjs --stack react     # filtra um stack
 *   node scripts/list-patches.mjs --category a11y   # filtra uma categoria
 *   node scripts/list-patches.mjs --json            # saída JSON (para pipe)
 *
 * Procura por:
 *   // PATCH: <categoria> — <motivo> (ver PATCHES.md#<anchor>)
 *
 * Formatos reconhecidos em: .ts .tsx .vue .svelte .js
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const STACKS = ['design-system-react', 'design-system-vue', 'design-system-svelte', 'nortear-design-system'];
const EXTS = new Set(['.ts', '.tsx', '.vue', '.svelte', '.js']);
const SKIP = new Set(['node_modules', '.storybook-static', 'storybook-static', 'dist', '.turbo', '.next', '.svelte-kit']);

// Formato: // PATCH: <categoria> — <motivo> (ver PATCHES.md#<anchor>)?
const PATCH_RE = /\/\/\s*PATCH:\s*(a11y|i18n|theme|security|bugfix)\s*[—\-]\s*(.+?)(?:\s*\(ver\s+PATCHES\.md#(\S+?)\))?\s*$/;

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { stack: null, category: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--stack') out.stack = argv[++i];
    else if (argv[i] === '--category') out.category = argv[++i];
    else if (argv[i] === '--json') out.json = true;
  }
  return out;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry) || entry.startsWith('.git')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXTS.has(extname(entry))) files.push(full);
  }
  return files;
}

function scanFile(file) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(PATCH_RE);
    if (!m) continue;
    hits.push({
      line: i + 1,
      category: m[1],
      reason: m[2].trim(),
      anchor: m[3] || null,
    });
  }
  return hits;
}

const targets = (args.stack ? [`design-system-${args.stack}`] : STACKS)
  .map((s) => join(ROOT, s))
  .filter((p) => {
    try { return statSync(p).isDirectory(); } catch { return false; }
  });

const report = [];
for (const root of targets) {
  const stack = root.split(/[\\/]/).pop().replace('design-system-', '');
  for (const file of walk(root)) {
    const hits = scanFile(file);
    for (const h of hits) {
      if (args.category && h.category !== args.category) continue;
      report.push({ stack, file: relative(ROOT, file).replaceAll('\\', '/'), ...h });
    }
  }
}

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (report.length === 0) {
  console.log('Nenhum patch encontrado.');
  process.exit(0);
}

const byStack = {};
for (const r of report) (byStack[r.stack] ||= []).push(r);

const CAT_COLOR = { a11y: '\x1b[36m', i18n: '\x1b[35m', theme: '\x1b[33m', security: '\x1b[31m', bugfix: '\x1b[32m' };
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}Patches ativos no monorepo: ${report.length}${RESET}\n`);

for (const stack of Object.keys(byStack).sort()) {
  console.log(`${BOLD}▸ ${stack}${RESET} (${byStack[stack].length})`);
  for (const r of byStack[stack]) {
    const color = CAT_COLOR[r.category] || '';
    const anchor = r.anchor ? ` #${r.anchor}` : ' ${BOLD}(sem anchor em PATCHES.md)${RESET}';
    console.log(`  ${color}[${r.category}]${RESET} ${r.file}:${r.line}${anchor}`);
    console.log(`    ${r.reason}`);
  }
  console.log('');
}

// Exit code != 0 se houver patches sem anchor registrado em PATCHES.md
const orphans = report.filter((r) => !r.anchor);
if (orphans.length > 0) {
  console.error(`\x1b[33m⚠ ${orphans.length} patch(es) sem anchor em PATCHES.md. Adicione entrada ou referência.${RESET}`);
  process.exit(1);
}
