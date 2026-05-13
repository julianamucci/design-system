// Varre todos os translations.json buscando referências literais a APIs específicas
// em chaves de TEXTO descritivo (ignora chaves de código tipo *Code, structureCode,
// extensibilityCode, customizationCode, codeImportBasic, props.table.*.type).
//
// Saída: tabela markdown agrupada por componente + chave + locale + trecho problemático.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'docs', 'shared', 'content');

// Chaves cujo valor é snippet de código — não auditadas.
const CODE_KEY_RX = /(Code|^code[A-Z]|^structure[A-Z]|^extensibility|^customization|^interface[A-Z]|href)/;

// Subobjetos cujo valor é sempre tipo TS (não texto) — ignorar.
const TYPE_PATH_RX = /\.table\.[^.]+\.type$/;

// Caminhos cujo valor é o NOME de uma prop documentada — literal é legítimo.
const PROP_NAME_PATH_RX = /\.(items|table)\.[^.]+\.name$/;

// Padrões problemáticos: prop literal em texto.
const LITERAL_PATTERNS = [
  { name: 'type=\\"single|multiple\\"', rx: /type=\\?"(single|multiple|horizontal|vertical|automatic|manual|always|hover|scroll|auto)\\?"/ },
  { name: 'collapsible (prop literal)', rx: /\bcollapsible\b/ },
  { name: 'asChild / as-child', rx: /\b(asChild|as-child)\b/ },
  { name: 'modelValue / @update:', rx: /\b(modelValue|@update:)/ },
  { name: 'bind:value / bind:checked / bind:open', rx: /bind:(value|checked|open|pressed)/ },
  { name: 'onValueChange/onCheckedChange/onOpenChange (em texto)', rx: /\bon(Value|Checked|Open|Pressed|ValueCommit)/ },
  { name: 'defaultValue=\\"...\\" (string, não array)', rx: /defaultValue=\\?"[^"]+\\?"/ },
];

const issues = [];

function visit(obj, keyPath, locale, component) {
  if (obj == null) return;
  if (typeof obj === 'string') {
    const lastKey = keyPath[keyPath.length - 1] || '';
    if (CODE_KEY_RX.test(lastKey)) return;
    const fullPath = keyPath.join('.');
    if (TYPE_PATH_RX.test(fullPath)) return;
    if (PROP_NAME_PATH_RX.test(fullPath)) return;
    // Ignorar chaves de label/badge curtas (já são neutras): "Single", "Multiple"
    if (obj.length < 12 && /^(Single|Multiple|Default|Outline|Vertical|Horizontal)$/i.test(obj.trim())) return;
    for (const { name, rx } of LITERAL_PATTERNS) {
      if (rx.test(obj)) {
        issues.push({ component, locale, key: keyPath.join('.'), pattern: name, snippet: obj.length > 110 ? obj.slice(0, 107) + '...' : obj });
      }
    }
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      visit(v, [...keyPath, k], locale, component);
    }
  }
}

const components = fs.readdirSync(CONTENT).filter((c) => fs.statSync(path.join(CONTENT, c)).isDirectory());

for (const comp of components) {
  const file = path.join(CONTENT, comp, 'translations.json');
  if (!fs.existsSync(file)) continue;
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [locale, tree] of Object.entries(json)) {
    visit(tree, [], locale, comp);
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(issues, null, 2));
  process.exit(issues.length > 0 ? 2 : 0);
}

// Output markdown agrupado por componente, pt-BR primeiro (representativo).
const ptBr = issues.filter((i) => i.locale === 'pt-BR');
const byComponent = ptBr.reduce((acc, i) => {
  (acc[i.component] = acc[i.component] || []).push(i);
  return acc;
}, {});

console.log(`# Translation literals audit\n`);
console.log(`Total issues (pt-BR only): **${ptBr.length}**`);
console.log(`Componentes afetados: **${Object.keys(byComponent).length}**\n`);

for (const [comp, list] of Object.entries(byComponent).sort()) {
  console.log(`## ${comp} (${list.length})\n`);
  for (const i of list) {
    console.log(`- \`${i.key}\` → **${i.pattern}**`);
    console.log(`  > ${i.snippet}`);
  }
  console.log('');
}

process.exit(issues.length > 0 ? 2 : 0);
