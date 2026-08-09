// Auditoria de conteúdo compartilhado (docs/shared/content/*/translations.json).
//
// Quatro checagens, todas determinísticas:
//
//   1. literais      Referência literal a API de um stack em chave de TEXTO
//                    descritivo. Chaves de código (`*Code`) são isentas.
//   2. cobertura     Chave de código sem variante própria para um stack — o
//                    leitor daquele stack vê o snippet de outro (fallback).
//   3. plataforma    Termo preso à web em texto descritivo ("Token CSS",
//                    "hover"). Não é erro na web; é o que um consumidor
//                    não-navegador teria de reescrever.
//   4. tailwind      Resíduo de `@apply` em snippet de CSS documentado.
//
// Uso:
//   node scripts/audit-translation-literals.mjs [--json]
//   node scripts/audit-translation-literals.mjs --only literais|cobertura|plataforma|tailwind
//
// Código de saída: 2 se houver *literais* (as outras checagens são informativas
// e não quebram pipeline). `--strict` faz qualquer achado sair com 2.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'docs', 'shared', 'content');

const AS_JSON = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');
const ONLY = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : null;
})();
const wants = (section) => !ONLY || ONLY === section;

// Espelha `STACKS` / `WEB_STACKS` de docs/shared/primitives/code-variants.ts.
// Duplicado de propósito: este script é Node puro e não carrega TS.
const STACKS = ['react', 'vue', 'svelte', 'vanilla', 'angular', 'flutter'];
const WEB_STACKS = ['react', 'vue', 'svelte', 'vanilla', 'angular'];

// Chaves cujo valor é snippet de código. Só o sufixo `Code` — o regex antigo
// era largo (`^structure[A-Z]|^extensibility|^customization`) e isentava prosa:
// `structureLabel`, `extensibilityTitle`, `customizationTitle` e `customization`
// nunca chegaram a ser auditados.
const CODE_KEY_RX = /Code$/;

// `href` guarda URL — não é código nem prosa auditável.
const URL_KEY_RX = /^href$/;

// Subobjetos cujo valor é sempre tipo TS (não texto) — ignorar.
const TYPE_PATH_RX = /\.table\.[^.]+\.type$/;

// Caminhos cujo valor é o NOME de uma prop documentada — literal é legítimo.
const PROP_NAME_PATH_RX = /\.(items|table)\.[^.]+\.name$/;

// ─── 1. Literais de API em texto descritivo ───────────────────────────────────

const LITERAL_PATTERNS = [
  { name: 'type=\\"single|multiple\\"', rx: /type=\\?"(single|multiple|horizontal|vertical|automatic|manual|always|hover|scroll|auto)\\?"/ },
  { name: 'collapsible (prop literal)', rx: /\bcollapsible\b/ },
  { name: 'asChild / as-child', rx: /\b(asChild|as-child)\b/ },
  { name: 'modelValue / @update:', rx: /\b(modelValue|@update:)/ },
  { name: 'bind:value / bind:checked / bind:open', rx: /bind:(value|checked|open|pressed)/ },
  { name: 'onValueChange/onCheckedChange/onOpenChange (em texto)', rx: /\bon(Value|Checked|Open|Pressed|ValueCommit)/ },
  { name: 'defaultValue=\\"...\\" (string, não array)', rx: /defaultValue=\\?"[^"]+\\?"/ },
];

// ─── 3. Acoplamento de plataforma em texto descritivo ─────────────────────────
//
// Diferente de `LITERAL_PATTERNS`: não é erro hoje. Mede quanto do conteúdo
// pressupõe navegador — o custo de portar para um consumidor nativo. Termo que
// nomeia tecnologia web ou interação exclusiva de ponteiro.

const PLATFORM_PATTERNS = [
  { name: 'nomeia tecnologia web (CSS/HTML/DOM/TS/JSX)', rx: /\b(CSS|HTML|DOM|TypeScript|JavaScript|JSX)\b/ },
  { name: 'interação só de ponteiro (hover)', rx: /\bhover\b/i },
  { name: 'foco de teclado do navegador (focus-visible/outline)', rx: /\bfocus-visible\b/ },
  { name: 'API de elemento (className/innerHTML/tabindex)', rx: /\b(className|innerHTML|tabindex|tabIndex)\b/ },
  { name: 'unidade de viewport/px em texto', rx: /\b\d+\s?(px|rem|vh|vw)\b/ },
];

// Slugs cujo nome contém o próprio termo auditado — evita ruído estrutural.
const PLATFORM_SLUG_SKIP = { 'interação só de ponteiro (hover)': ['hover-card'] };

// ─── 4. Resíduo de Tailwind ───────────────────────────────────────────────────

const TAILWIND_RX = /@apply\b/;

// ─── 5. Snippet de código fora do conteúdo compartilhado ──────────────────────
//
// Um stack pode sobrescrever qualquer chave por `useTranslation(t, overrides)`.
// Para prop e rótulo isso é legítimo. Para chave `*Code` não: o snippet fica
// preso naquele stack, invisível para o conteúdo compartilhado e para qualquer
// consumidor novo. O lugar dele é uma variante em translations.json.

const STACK_DIRS = {
  react: 'nortear-design-system-react',
  vue: 'nortear-design-system-vue',
  svelte: 'nortear-design-system-svelte',
  vanilla: 'nortear-design-system-vanilla',
};
// Chave de objeto entre aspas: `'anatomy.structureCode':`. O lookbehind evita
// casar com binding de template Vue — `:x="algoCode"` seguido de `:y=` na linha
// seguinte formaria `"algoCode"\n  :` sem ele.
const OVERRIDE_CODE_RX = /(?<![=<])(['"])([\w.]*Code)\1\s*:/g;

// ─── Coleta ───────────────────────────────────────────────────────────────────

const literals = [];
const platform = [];
const tailwind = [];
/** codeKeys[`${slug}|${locale}|${path}`] = { form: 'string'|'object', variants: [] } */
const codeKeys = [];

function auditText(value, keyPath, locale, component) {
  const fullPath = keyPath.join('.');
  if (TYPE_PATH_RX.test(fullPath)) return;
  if (PROP_NAME_PATH_RX.test(fullPath)) return;
  // Ignorar chaves de label/badge curtas (já são neutras): "Single", "Multiple"
  if (value.length < 12 && /^(Single|Multiple|Default|Outline|Vertical|Horizontal)$/i.test(value.trim())) return;

  const snippet = value.length > 110 ? value.slice(0, 107) + '...' : value;

  for (const { name, rx } of LITERAL_PATTERNS) {
    if (rx.test(value)) literals.push({ component, locale, key: fullPath, pattern: name, snippet });
  }
  for (const { name, rx } of PLATFORM_PATTERNS) {
    if ((PLATFORM_SLUG_SKIP[name] || []).includes(component)) continue;
    if (rx.test(value)) platform.push({ component, locale, key: fullPath, pattern: name, snippet });
  }
}

function visit(value, keyPath, locale, component) {
  if (value == null) return;
  const lastKey = keyPath[keyPath.length - 1] || '';

  // Chave de código: registra a forma (string ou variantes) e NÃO desce — o
  // conteúdo é snippet, não texto auditável. Sem este corte, a forma de objeto
  // exporia cada variante como se fosse texto descritivo.
  if (URL_KEY_RX.test(lastKey)) return;

  if (CODE_KEY_RX.test(lastKey)) {
    const fullPath = keyPath.join('.');
    if (typeof value === 'string') {
      codeKeys.push({ component, locale, key: fullPath, form: 'string', variants: [] });
      if (TAILWIND_RX.test(value)) tailwind.push({ component, locale, key: fullPath, variant: '—' });
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      const variants = Object.keys(value);
      codeKeys.push({ component, locale, key: fullPath, form: 'object', variants });
      for (const [variant, snippet] of Object.entries(value)) {
        if (typeof snippet === 'string' && TAILWIND_RX.test(snippet)) {
          tailwind.push({ component, locale, key: fullPath, variant });
        }
      }
    }
    return;
  }

  if (typeof value === 'string') return auditText(value, keyPath, locale, component);

  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) visit(v, [...keyPath, k], locale, component);
  }
}

const components = fs
  .readdirSync(CONTENT)
  .filter((c) => fs.statSync(path.join(CONTENT, c)).isDirectory());

for (const comp of components) {
  const file = path.join(CONTENT, comp, 'translations.json');
  if (!fs.existsSync(file)) continue;
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [locale, tree] of Object.entries(json)) visit(tree, [], locale, comp);
}

// ─── 5. Coleta: overrides de código nos stacks ────────────────────────────────

const strandedSnippets = [];

for (const [stack, dir] of Object.entries(STACK_DIRS)) {
  const docsDir = path.join(ROOT, dir, 'src', 'components', 'docs');
  if (!fs.existsSync(docsDir)) continue;
  for (const entry of fs.readdirSync(docsDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const source = fs.readFileSync(path.join(docsDir, entry.name), 'utf8');
    for (const m of source.matchAll(OVERRIDE_CODE_RX)) {
      strandedSnippets.push({ stack, file: `${dir}/src/components/docs/${entry.name}`, key: m[2] });
    }
  }
}

// ─── 2. Cobertura de variantes por stack ──────────────────────────────────────
//
// Uma chave "cobre" um stack quando tem variante própria, ou variante `web` e o
// stack roda em navegador. String crua não cobre ninguém em particular: ela é
// servida a todos por fallback, tenha sido escrita para todos ou não.

function coversStack(entry, stack) {
  if (entry.form === 'string') return false;
  if (entry.variants.includes(stack)) return true;
  if (entry.variants.includes('web') && WEB_STACKS.includes(stack)) return true;
  return false;
}

const coverage = STACKS.map((stack) => {
  const missing = codeKeys.filter((e) => !coversStack(e, stack));
  // Agrupa por componente+chave (os 3 locales contam como um buraco só).
  const byKey = new Set(missing.map((m) => `${m.component}|${m.key}`));
  return {
    stack,
    total: new Set(codeKeys.map((e) => `${e.component}|${e.key}`)).size,
    missing: byKey.size,
    keys: [...byKey].map((k) => ({ component: k.split('|')[0], key: k.split('|')[1] })),
  };
});

// ─── Saída ────────────────────────────────────────────────────────────────────

const ptOnly = (list) => list.filter((i) => i.locale === 'pt-BR');

if (AS_JSON) {
  console.log(
    JSON.stringify(
      {
        literais: literals,
        cobertura: coverage,
        plataforma: platform,
        tailwind,
        soltos: strandedSnippets,
      },
      null,
      2,
    ),
  );
  process.exit(literals.length > 0 || (STRICT && (platform.length || tailwind.length)) ? 2 : 0);
}

const groupByComponent = (list) =>
  list.reduce((acc, i) => {
    (acc[i.component] = acc[i.component] || []).push(i);
    return acc;
  }, {});

console.log(`# Auditoria de conteúdo compartilhado\n`);

if (wants('literais')) {
  const list = ptOnly(literals);
  const byComp = groupByComponent(list);
  console.log(`## 1. Literais de API em texto descritivo\n`);
  console.log(`Achados (só pt-BR): **${list.length}** · componentes: **${Object.keys(byComp).length}**\n`);
  for (const [comp, items] of Object.entries(byComp).sort()) {
    console.log(`### ${comp} (${items.length})\n`);
    for (const i of items) {
      console.log(`- \`${i.key}\` → **${i.pattern}**`);
      console.log(`  > ${i.snippet}`);
    }
    console.log('');
  }
  if (!list.length) console.log('Nenhum.\n');
}

if (wants('cobertura')) {
  console.log(`## 2. Cobertura de variantes de código por stack\n`);
  const total = coverage[0]?.total ?? 0;
  console.log(`Chaves de código distintas: **${total}**\n`);
  console.log('| Stack | Com variante própria | Sem (servido por fallback) |');
  console.log('|---|---|---|');
  for (const c of coverage) {
    console.log(`| ${c.stack} | ${c.total - c.missing} | ${c.missing} |`);
  }
  console.log('');
  const strings = codeKeys.filter((e) => e.form === 'string');
  const strKeys = new Set(strings.map((e) => `${e.component}|${e.key}`));
  if (strKeys.size) {
    console.log(`Ainda em forma de string (sem variante declarada): **${strKeys.size}**`);
    for (const k of [...strKeys].sort()) console.log(`- \`${k.replace('|', '\` · \`')}\``);
    console.log('');
  }
}

if (wants('plataforma')) {
  const list = ptOnly(platform);
  const byComp = groupByComponent(list);
  console.log(`## 3. Acoplamento de plataforma em texto descritivo\n`);
  console.log(
    `Achados (só pt-BR): **${list.length}** · componentes: **${Object.keys(byComp).length}**\n`,
  );
  console.log(
    `Não é erro na web — é o texto que um consumidor não-navegador teria de reescrever.\n`,
  );
  const byPattern = list.reduce((acc, i) => ((acc[i.pattern] = (acc[i.pattern] || 0) + 1), acc), {});
  console.log('| Padrão | Ocorrências |');
  console.log('|---|---|');
  for (const [p, n] of Object.entries(byPattern).sort((a, b) => b[1] - a[1])) {
    console.log(`| ${p} | ${n} |`);
  }
  console.log('');
}

if (wants('tailwind')) {
  const list = ptOnly(tailwind);
  console.log(`## 4. Resíduo de Tailwind em snippets\n`);
  console.log(`Ocorrências de \`@apply\` (só pt-BR): **${list.length}**\n`);
  for (const i of list) console.log(`- \`${i.component}\` · \`${i.key}\` (variante: ${i.variant})`);
  console.log('');
}

if (wants('soltos')) {
  console.log(`## 5. Snippet de código preso em override de stack\n`);
  console.log(`Ocorrências: **${strandedSnippets.length}**\n`);
  if (strandedSnippets.length) {
    console.log(`Devem virar variante em \`translations.json\` — em override, o snippet fica`);
    console.log(`invisível para o conteúdo compartilhado e para consumidores novos.\n`);
    const byFile = strandedSnippets.reduce((acc, s) => {
      (acc[s.file] = acc[s.file] || []).push(s.key);
      return acc;
    }, {});
    for (const [file, keys] of Object.entries(byFile).sort()) {
      console.log(`- \`${file}\` → ${[...new Set(keys)].map((k) => `\`${k}\``).join(', ')}`);
    }
  } else {
    console.log('Nenhum.');
  }
  console.log('');
}

const failed = literals.length > 0 || (STRICT && (platform.length > 0 || tailwind.length > 0));
process.exit(failed ? 2 : 0);
