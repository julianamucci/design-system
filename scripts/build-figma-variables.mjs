/**
 * Gera `docs/shared/tokens/figma-variables.json` a partir do CSS que é fonte de
 * verdade — nunca à mão.
 *
 * Por quê gerador e não arquivo escrito: `docs/shared/tokens/tokens.json` já é
 * um espelho parcial em DTCG que ninguém lê nem gera, e o próprio cabeçalho do
 * tokens.css avisa que editá-lo não muda nada. Um segundo arquivo estático
 * repetiria a dívida. Este roda de novo a cada mudança de token.
 *
 *   node scripts/build-figma-variables.mjs           # escreve o arquivo
 *   node scripts/build-figma-variables.mjs --check   # falha se estiver defasado
 *
 * ── Formato ──────────────────────────────────────────────────────────────────
 * Coleção → modos → árvore de tokens com `$type`/`$value`, que é o formato que
 * os importadores de variáveis do Figma consomem (plugin oficial
 * "variables-import-export" e equivalentes da comunidade). Os modos viram modos
 * da coleção no Figma; os grupos (`superficie/`, `marca/`…) viram grupos de
 * variável.
 *
 * ── Conversões ───────────────────────────────────────────────────────────────
 * - Cor: os tokens são triplets HSL sem `hsl()` (`0 0% 100%`) porque o CSS os
 *   compõe com alpha. O Figma quer cor resolvida → converte para hex.
 * - Dimensão: rem → px (base 16), `calc()` de spacing/radius resolvido.
 * - Duração: `200ms` → 200 (FLOAT). Easing e font-family → STRING.
 * - Sombra: STRING. O Figma não tem variável de efeito; o valor fica legível
 *   para quem for montar o estilo de efeito à mão.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = join(ROOT, 'docs/shared/tokens/figma-variables.json');

const SOURCES = [
  'docs/shared/tokens/tokens.css',
  'docs/shared/tokens/motion.css',
  'docs/shared/themes/default.css',
  'docs/shared/themes/warm.css',
  'docs/shared/themes/cold.css',
  'docs/shared/themes/densities.css',
  'docs/shared/themes/typescale.css',
];

// ─── Leitura do CSS ──────────────────────────────────────────────────────────

/** selector -> { '--token': 'valor' }. Ignora @media (reduced-motion zera tudo). */
function readBlocks(files) {
  const blocks = new Map();
  for (const file of files) {
    let css = readFileSync(join(ROOT, file), 'utf8');
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    // Fora de @media: o bloco de prefers-reduced-motion zera as durações e não
    // representa o token, é a preferência do usuário.
    css = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    // At-rules sem bloco (`@import "./motion.css";`) ficariam grudadas no
    // seletor seguinte — e o guard de `@` descartaria o bloco inteiro.
    css = css.replace(/@(?:import|charset|layer)[^;{]*;/g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      // O seletor é o que vem depois do último `;` do trecho capturado.
      const selector = m[1].slice(m[1].lastIndexOf(';') + 1).trim();
      if (!selector || selector.startsWith('@')) continue;
      const decls = blocks.get(selector) ?? {};
      for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
        decls[d[1]] = d[2].trim();
      }
      if (Object.keys(decls).length) blocks.set(selector, decls);
    }
  }
  return blocks;
}

// ─── Conversores ─────────────────────────────────────────────────────────────

const HSL = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/;

function hslToHex(triplet) {
  const m = HSL.exec(triplet.trim());
  if (!m) return null;
  const h = parseFloat(m[1]) / 360;
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const hex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

/** Resolve dimensão para px. Aceita rem, px, 0, var() e o calc() usado nos tokens. */
function toPx(raw, lookup, seen = new Set()) {
  const v = String(raw).trim();
  if (v === '0') return 0;

  let m = /^([\d.]+)rem$/.exec(v);
  if (m) return parseFloat(m[1]) * 16;
  m = /^([\d.]+)px$/.exec(v);
  if (m) return parseFloat(m[1]);

  m = /^var\((--[\w-]+)\)$/.exec(v);
  if (m) {
    if (seen.has(m[1])) return null;
    seen.add(m[1]);
    const next = lookup(m[1]);
    return next === undefined ? null : toPx(next, lookup, seen);
  }

  m = /^calc\(\s*var\((--[\w-]+)\)\s*([*+-])\s*([\d.]+)(px)?\s*\)$/.exec(v);
  if (m) {
    if (seen.has(m[1])) return null;
    seen.add(m[1]);
    const base = lookup(m[1]);
    if (base === undefined) return null;
    const b = toPx(base, lookup, seen);
    if (b === null) return null;
    const n = parseFloat(m[3]);
    return m[2] === '*' ? b * n : m[2] === '+' ? b + n : b - n;
  }
  return null;
}

const round = (n) => Math.round(n * 1000) / 1000;

// ─── Montagem ────────────────────────────────────────────────────────────────

const blocks = readBlocks(SOURCES);
const get = (sel) => blocks.get(sel) ?? {};

/** Empilha declarações na ordem dada; a última vence. */
function layer(...selectors) {
  return Object.assign({}, ...selectors.map(get));
}

/** Agrupamento das cores — espelha os comentários de seção do tokens.css. */
const COLOR_GROUPS = [
  ['superficie', ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground']],
  ['marca', ['primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground']],
  ['feedback', ['destructive', 'destructive-foreground', 'success', 'success-foreground', 'warning', 'warning-foreground', 'info', 'info-foreground']],
  ['estrutura', ['border', 'input', 'input-background', 'ring', 'ring-offset-color']],
];

function colorGroupOf(name) {
  for (const [group, names] of COLOR_GROUPS) if (names.includes(name)) return group;
  if (name.startsWith('chart-')) return 'grafico';
  if (name.startsWith('sidebar')) return 'sidebar';
  return 'outros';
}

/** Insere `grupo/nome` na árvore aninhada do modo. */
function put(tree, path, node) {
  const parts = path.split('/');
  let cur = tree;
  for (const p of parts.slice(0, -1)) cur = cur[p] ??= {};
  cur[parts.at(-1)] = node;
}

const avisos = [];

// ── Coleção: Cor ─────────────────────────────────────────────────────────────

const TEMAS = ['default', 'warm', 'cold'];
const corModes = {};

for (const tema of TEMAS) {
  const light = layer(':root', `.tema-${tema}`);
  // `.dark.tema-X` (0,2,0) vence `.dark` e `.tema-X` (0,1,0) — sem depender da
  // ordem de import. Onde ele não declara, cai no `.dark` e depois no tema.
  const dark = layer(':root', `.tema-${tema}`, '.dark', `.dark.tema-${tema}`);

  for (const [modo, decls] of [[`${tema}-light`, light], [`${tema}-dark`, dark]]) {
    const tree = {};
    for (const [token, raw] of Object.entries(decls)) {
      const hex = hslToHex(raw);
      if (!hex) continue;
      const name = token.slice(2);
      put(tree, `${colorGroupOf(name)}/${name}`, { $type: 'color', $value: hex });
    }
    corModes[modo] = tree;
  }

  // Token de cor que existe no claro e some no escuro seria buraco de modo.
  const claras = Object.keys(light).filter((t) => hslToHex(light[t]));
  const escuras = new Set(Object.keys(layer(':root', `.tema-${tema}`, '.dark', `.dark.tema-${tema}`)));
  for (const t of claras) if (!escuras.has(t)) avisos.push(`${t} existe em ${tema}-light e não em ${tema}-dark`);
}

// ── Coleção: Dimensão (modos = densidades) ───────────────────────────────────

const DENSIDADES = [['default', '.densidade-default'], ['condensado', '.densidade-condensado'], ['confortavel', '.densidade-confortavel']];
const dimModes = {};

for (const [modo, sel] of DENSIDADES) {
  const decls = layer(':root', sel);
  const lookup = (t) => decls[t];
  const tree = {};
  for (const [token, raw] of Object.entries(decls)) {
    const name = token.slice(2);
    const grupo =
      name.startsWith('spacing-') ? 'espacamento'
      : name.startsWith('height-') ? 'altura'
      : name.startsWith('size-') ? 'tamanho'
      : name.startsWith('border-width') ? 'traco'
      : null;
    if (!grupo) continue;
    const px = toPx(raw, lookup);
    if (px === null) continue;
    put(tree, `${grupo}/${name}`, { $type: 'number', $value: round(px) });
  }
  dimModes[modo] = tree;
}

// ── Coleção: Raio ────────────────────────────────────────────────────────────
// Nenhum tema sobrescreve raio (verificado): modo único.

const raizRaio = layer(':root', '.tema-default');
const raioTree = {};
for (const [token, raw] of Object.entries(raizRaio)) {
  if (!token.startsWith('--radius')) continue;
  const px = toPx(raw, (t) => raizRaio[t]);
  if (px === null) continue;
  put(raioTree, token.slice(2), { $type: 'number', $value: round(px) });
}

// ── Coleção: Tipografia (modos = escalas) ────────────────────────────────────

const ESCALAS = ['minor-second', 'minor-third', 'major-second', 'major-third', 'perfect-fourth', 'augmented-fourth', 'perfect-fifth', 'golden'];
const tipoModes = {};

for (const escala of ESCALAS) {
  const decls = layer(':root', `.escala-${escala}`);
  const base = toPx(decls['--type-base'], (t) => decls[t]);
  const ratio = parseFloat(decls['--type-scale']);
  const passos = {
    label: base / ratio,
    p: base,
    h4: base * ratio,
    h3: base * ratio ** 2,
    h2: base * ratio ** 3,
    h1: base * ratio ** 4,
  };
  const tree = {};
  for (const [nome, px] of Object.entries(passos)) {
    put(tree, `tamanho/text-${nome}`, { $type: 'number', $value: round(px) });
  }
  put(tree, 'escala/type-base', { $type: 'number', $value: round(base) });
  put(tree, 'escala/type-scale', { $type: 'number', $value: ratio });
  for (const [token, raw] of Object.entries(decls)) {
    const name = token.slice(2);
    if (name.startsWith('font-weight-')) put(tree, `peso/${name}`, { $type: 'number', $value: Number(raw) });
    if (name.startsWith('line-height-')) put(tree, `entrelinha/${name}`, { $type: 'number', $value: Number(raw) });
    if (name.startsWith('letter-spacing-')) put(tree, `espacamento-letra/${name}`, { $type: 'string', $value: raw });
  }
  tipoModes[escala] = tree;
}

// ── Coleção: Movimento ───────────────────────────────────────────────────────

const motion = get(':root');
const motionTree = {};
for (const [token, raw] of Object.entries(motion)) {
  const name = token.slice(2);
  if (name.startsWith('duration-')) {
    const ms = /^([\d.]+)ms$/.exec(raw);
    if (ms) put(motionTree, `duracao/${name}`, { $type: 'number', $value: parseFloat(ms[1]) });
  } else if (name.startsWith('ease-')) {
    put(motionTree, `curva/${name}`, { $type: 'string', $value: raw });
  } else if (name.startsWith('motion-offset-')) {
    const px = toPx(raw, (t) => motion[t]);
    if (px !== null) put(motionTree, `deslocamento/${name}`, { $type: 'number', $value: round(px) });
  }
}

// ── Coleção: Elevação (modos = light/dark) ───────────────────────────────────

const elevModes = {};
for (const [modo, sel] of [['light', ':root'], ['dark', '.dark']]) {
  const decls = layer(':root', sel);
  const tree = {};
  for (const [token, raw] of Object.entries(decls)) {
    if (!token.startsWith('--elevation-')) continue;
    // STRING: o Figma não tem variável de efeito. O valor fica legível para
    // montar o estilo de sombra à mão.
    put(tree, token.slice(2), { $type: 'string', $value: raw.replace(/\s+/g, ' ') });
  }
  elevModes[modo] = tree;
}

// ── Coleção: Camada (z-index) ────────────────────────────────────────────────

const camadaTree = {};
for (const [token, raw] of Object.entries(get(':root'))) {
  if (!token.startsWith('--z-')) continue;
  put(camadaTree, token.slice(2), { $type: 'number', $value: Number(raw) });
}

// ─── Saída ───────────────────────────────────────────────────────────────────

const doc = {
  $description:
    'Variáveis do Nortear Design System para importação no Figma. GERADO por scripts/build-figma-variables.mjs a partir do CSS — não editar à mão.',
  $sources: SOURCES,
  Cor: { modes: corModes },
  Dimensao: { modes: dimModes },
  Raio: { modes: { default: raioTree } },
  Tipografia: { modes: tipoModes },
  Movimento: { modes: { default: motionTree } },
  Elevacao: { modes: elevModes },
  Camada: { modes: { default: camadaTree } },
};

const json = JSON.stringify(doc, null, 2) + '\n';

if (process.argv.includes('--check')) {
  const atual = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (atual !== json) {
    console.error(`✗ ${relative(ROOT, OUT)} está defasado. Rode: node scripts/build-figma-variables.mjs`);
    process.exit(1);
  }
  console.log('✓ figma-variables.json em dia com o CSS');
  process.exit(0);
}

writeFileSync(OUT, json);

const conta = (m) =>
  Object.values(m).reduce((n, t) => n + (JSON.stringify(t).match(/"\$type"/g) ?? []).length, 0) /
  Math.max(1, Object.keys(m).length);
console.log(`✓ ${relative(ROOT, OUT)}`);
for (const [nome, col] of Object.entries(doc)) {
  if (nome.startsWith('$')) continue;
  const modos = Object.keys(col.modes);
  console.log(`  ${nome.padEnd(11)} ${String(Math.round(conta(col.modes))).padStart(3)} variáveis × ${modos.length} modo(s): ${modos.join(', ')}`);
}
for (const a of avisos) console.log(`  aviso: ${a}`);
