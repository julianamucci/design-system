#!/usr/bin/env node
/**
 * diff-shadcn.mjs — compara um componente local com o upstream do shadcn e exibe
 * um diff unificado, destacando onde há marcadores `// PATCH:` envolvidos.
 *
 * Uso:
 *   node scripts/diff-shadcn.mjs --stack react --component alert
 *   node scripts/diff-shadcn.mjs --stack vue --component button
 *   node scripts/diff-shadcn.mjs --stack svelte --component card
 *
 * Fluxo:
 *   1. Baixa o registry JSON público do shadcn (react/vue/svelte).
 *   2. Extrai o arquivo do componente solicitado.
 *   3. Compara com o arquivo local (mostra diff linha a linha).
 *   4. Destaca linhas com `// PATCH:` para revisão manual.
 *
 * Não modifica nenhum arquivo. Útil antes de re-gerar via `shadcn@latest add`.
 *
 * Requer: Node 18+ (usa fetch nativo).
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const REGISTRIES = {
  react:  (c) => `https://ui.shadcn.com/r/styles/new-york/${c}.json`,
  vue:    (c) => `https://www.shadcn-vue.com/r/styles/default/${c}.json`,
  svelte: (c) => `https://next.shadcn-svelte.com/registry/new-york/${c}.json`,
};

const args = parseArgs(process.argv.slice(2));

function parseArgs(argv) {
  const out = { stack: null, component: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--stack') out.stack = argv[++i];
    else if (argv[i] === '--component') out.component = argv[++i];
  }
  return out;
}

if (!args.stack || !args.component) {
  console.error('Uso: node scripts/diff-shadcn.mjs --stack <react|vue|svelte> --component <slug>');
  process.exit(1);
}

if (args.stack === 'basecoat') {
  console.error('Stack basecoat não tem registry shadcn. Compare manualmente com node_modules/basecoat-css/dist/basecoat.css.');
  process.exit(1);
}

const registryFn = REGISTRIES[args.stack];
if (!registryFn) {
  console.error(`Stack desconhecido: ${args.stack}. Válidos: ${Object.keys(REGISTRIES).join(', ')}`);
  process.exit(1);
}

// ── 1. Fetch registry ────────────────────────────────────────────────────────
const url = registryFn(args.component);
console.log(`→ Baixando ${url}...\n`);

let registry;
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  registry = await res.json();
} catch (err) {
  console.error(`Falha ao baixar registry: ${err.message}`);
  process.exit(1);
}

const files = registry.files || [];
if (files.length === 0) {
  console.error('Registry não retornou arquivos.');
  process.exit(1);
}

// ── 2. Localizar arquivo local correspondente ────────────────────────────────
const stackDir = join(ROOT, `design-system-${args.stack}`, 'src', 'components', 'ui');

for (const f of files) {
  const upstreamName = f.name || f.path?.split('/').pop();
  if (!upstreamName) continue;

  const localPath = findLocal(stackDir, upstreamName);
  if (!localPath) {
    console.warn(`⚠ Arquivo upstream "${upstreamName}" não encontrado localmente em ${relative(ROOT, stackDir)}`);
    continue;
  }

  const localContent = readFileSync(localPath, 'utf8');
  const upstreamContent = f.content;

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`arquivo: ${relative(ROOT, localPath).replaceAll('\\', '/')}`);
  console.log(`upstream: ${upstreamName}`);
  console.log('═'.repeat(70));

  printDiff(upstreamContent, localContent);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findLocal(dir, name) {
  if (!existsSync(dir)) return null;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else if (entry === name) return full;
    }
  }
  return null;
}

function printDiff(upstream, local) {
  // Diff muito simples por linha (LCS seria melhor, mas aqui é só para orientar
  // revisão manual — não é um merge tool).
  const up = upstream.split(/\r?\n/);
  const lo = local.split(/\r?\n/);
  const max = Math.max(up.length, lo.length);

  let patches = 0;
  let diffs = 0;
  for (let i = 0; i < max; i++) {
    const u = up[i] ?? '';
    const l = lo[i] ?? '';
    if (u === l) continue;

    diffs++;
    const hasPatch = /\/\/\s*PATCH:/.test(l) || (i > 0 && /\/\/\s*PATCH:/.test(lo[i - 1] ?? ''));
    if (hasPatch) patches++;

    const marker = hasPatch ? '\x1b[36m●\x1b[0m' : ' ';
    console.log(`${marker} L${String(i + 1).padStart(4)}`);
    console.log(`  \x1b[31m- upstream:\x1b[0m ${u}`);
    console.log(`  \x1b[32m+ local:   \x1b[0m ${l}`);
  }

  console.log('');
  console.log(`  total de linhas divergentes: ${diffs}`);
  console.log(`  linhas cobertas por // PATCH: ${patches}`);
  console.log(`  linhas sem marker explícito:  ${diffs - patches}${diffs - patches > 0 ? ' ← revisar' : ''}`);
}
