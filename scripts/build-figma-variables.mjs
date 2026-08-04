/**
 * Gera `docs/shared/tokens/figma-variables.json` a partir do CSS que é fonte de
 * verdade — nunca à mão.
 *
 * Por quê gerador e não arquivo escrito: `docs/shared/tokens/tokens.json` já é
 * um espelho parcial em DTCG que ninguém lê nem gera, e o próprio cabeçalho do
 * tokens.css avisa que editá-lo não muda nada. Um segundo arquivo estático
 * repetiria a dívida. Este roda de novo a cada mudança de token.
 *
 *   node scripts/build-figma-variables.mjs             # arquivo agregado
 *   node scripts/build-figma-variables.mjs --split    # pasta por coleção (IMPORTAR ESTES)
 *   node scripts/build-figma-variables.mjs --validate # simula o import
 *   node scripts/build-figma-variables.mjs --check    # falha se estiver defasado
 *
 * ── Como importar no Figma ───────────────────────────────────────────────────
 * Uma pasta de `docs/shared/tokens/figma/` por vez, selecionando TODOS os
 * arquivos dela de uma vez. Cada arquivo vira um modo da coleção; o nome da
 * coleção não vem do arquivo, então renomeie "Collection" depois do primeiro
 * import. NUNCA misture pastas na mesma seleção: arquivos de coleções
 * diferentes declaram variáveis diferentes, e cada nome ausente num dos modos
 * conta um erro.
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
 *   compõe com alpha. Viram o OBJETO DTCG que o import nativo do Figma exige —
 *   `{ colorSpace: "srgb", components: [r,g,b], alpha, hex }`. String hex pura é
 *   recusada, uma falha por cor.
 * - Dimensão: rem → px (base 16), `calc()` de spacing/radius resolvido.
 * - Duração: `200ms` → 200 (FLOAT). Easing e font-family → STRING.
 * - Sombra: STRING. O Figma não tem variável de efeito; o valor fica legível
 *   para quem for montar o estilo de efeito à mão.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = join(ROOT, 'docs/shared/tokens/figma-variables.json');
const OUT_SPLIT = join(ROOT, 'docs/shared/tokens/figma');

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

/**
 * Valor de cor no formato que o import NATIVO de variáveis do Figma exige:
 * objeto DTCG com colorSpace + components (0..1) + alpha + hex. String hex pura
 * é recusada — foi a causa de "Encountered errors importing 40 tokens", uma
 * falha por cor, com number e string passando.
 */
function hslToDtcg(triplet) {
  const rgb = hslToRgb(triplet);
  if (!rgb) return null;
  const q = (v) => Math.round(v * 1e6) / 1e6;
  const hex = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return {
    colorSpace: 'srgb',
    components: [q(rgb.r), q(rgb.g), q(rgb.b)],
    alpha: 1,
    hex: `#${hex(rgb.r)}${hex(rgb.g)}${hex(rgb.b)}`,
  };
}

function hslToRgb(triplet) {
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
  return { r, g, b };
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
      const cor = hslToDtcg(raw);
      if (!cor) continue;
      const name = token.slice(2);
      put(tree, `${colorGroupOf(name)}/${name}`, { $type: 'color', $value: cor });
    }
    corModes[modo] = tree;
  }

  // Token de cor que existe no claro e some no escuro seria buraco de modo.
  const claras = Object.keys(light).filter((t) => hslToDtcg(light[t]));
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

/**
 * `--split`: um arquivo por coleção×modo, nomeado `<Colecao>.<modo>.json`, com
 * a árvore de tokens NA RAIZ — sem `modes`, sem `$description`, sem `$sources`.
 * É o formato que o plugin oficial de import/export de variáveis consome: ele
 * tira coleção e modo do NOME DO ARQUIVO e espera token puro dentro.
 */
if (process.argv.includes('--split')) {
  rmSync(OUT_SPLIT, { recursive: true, force: true });
  let n = 0;
  for (const [colecao, col] of Object.entries(doc)) {
    if (colecao.startsWith('$')) continue;
    // UMA PASTA POR COLEÇÃO. No import nativo cada arquivo vira um MODO da
    // coleção — então só faz sentido importar junto o que pertence à mesma
    // coleção. Solto num diretório só, selecionar tudo mistura as 7 coleções
    // numa. Com a pasta, "selecionar todos os arquivos de Cor/" é a operação
    // certa por construção, e o nome do arquivo vira o nome do modo.
    const dir = join(OUT_SPLIT, colecao);
    mkdirSync(dir, { recursive: true });
    for (const [modo, tree] of Object.entries(col.modes)) {
      writeFileSync(join(dir, `${modo}.json`), JSON.stringify(tree, null, 2) + '\n');
      n++;
    }
  }
  console.log(`✓ ${relative(ROOT, OUT_SPLIT)} — ${n} arquivos em pastas por coleção`);
  process.exit(0);
}

/**
 * `--probe`: dois arquivos mínimos para isolar, no próprio Figma, por que uma
 * importação em lote acusa erro. Cada um tem 2 tokens; a contagem de erro que o
 * Figma devolver diz qual das hipóteses é a verdadeira, sem depender de eu
 * adivinhar de fora.
 */
if (process.argv.includes('--probe')) {
  const dir = join(ROOT, 'docs/shared/tokens/figma-probe');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'numero.json'),
    JSON.stringify(
      {
        teste: {
          inteiro: { $type: 'number', $value: 16 },
          decimal: { $type: 'number', $value: 12.8 },
        },
      },
      null,
      2,
    ) + '\n',
  );
  writeFileSync(
    join(dir, 'texto.json'),
    JSON.stringify(
      {
        teste: {
          texto: { $type: 'string', $value: 'cubic-bezier(0.2, 0, 0, 1)' },
        },
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`✓ ${relative(ROOT, dir)} — numero.json (1 inteiro + 1 decimal), texto.json (1 string)`);
  process.exit(0);
}

/**
 * `--validate`: reproduz a travessia do plugin oficial sobre os arquivos de
 * --split e relata o que o Figma criaria. Existe porque a primeira entrega
 * saiu num formato que o plugin lia sem erro nenhum e mesmo assim nao produzia
 * variavel de cor — "gerou sem falhar" nao prova que importa.
 */
if (process.argv.includes('--validate')) {
  const TIPO = { color: 'COLOR', number: 'FLOAT', string: 'STRING', boolean: 'BOOLEAN' };
  const HEX = /^#([0-9a-f]{6})$/i;
  const problemas = [];
  const colecoes = new Map();

  const walk = (obj, key, herdado, out) => {
    const tipo = herdado || obj.$type;
    if (obj.$value !== undefined) {
      const figma = TIPO[tipo];
      if (!figma) return problemas.push(`${key}: $type "${tipo}" nao suportado`);
      if (figma === 'COLOR') {
        // O import nativo exige o objeto DTCG; string hex é recusada.
        const v = obj.$value;
        if (!v || typeof v !== 'object') return problemas.push(`${key}: cor precisa ser objeto DTCG, veio ${typeof v}`);
        if (v.colorSpace !== 'srgb') return problemas.push(`${key}: colorSpace "${v.colorSpace}"`);
        if (!Array.isArray(v.components) || v.components.length !== 3) return problemas.push(`${key}: components inválido`);
        if (v.components.some((c) => typeof c !== 'number' || c < 0 || c > 1)) return problemas.push(`${key}: components fora de 0..1`);
        if (typeof v.alpha !== 'number') return problemas.push(`${key}: alpha ausente`);
        if (!HEX.test(String(v.hex))) return problemas.push(`${key}: hex "${v.hex}" inválido`);
      }
      if (figma === 'FLOAT' && typeof obj.$value !== 'number') return problemas.push(`${key}: number nao-numerico`);
      return out.push([key, figma]);
    }
    for (const k of Object.keys(obj)) {
      if (k.charAt(0) === '$') continue;
      walk(obj[k], key ? `${key}/${k}` : k, tipo, out);
    }
  };

  // Pasta = coleção, arquivo = modo (ver --split).
  for (const colecao of readdirSync(OUT_SPLIT)) {
    for (const file of readdirSync(join(OUT_SPLIT, colecao)).filter((f) => f.endsWith('.json'))) {
    const modo = file.replace(/\.json$/, '');
    const out = [];
    walk(JSON.parse(readFileSync(join(OUT_SPLIT, colecao, file), 'utf8')), '', undefined, out);
    const c = colecoes.get(colecao) ?? { modos: [], porModo: new Map() };
    c.modos.push(modo);
    c.porModo.set(modo, out);
    colecoes.set(colecao, c);
    }
  }

  for (const [nome, c] of colecoes) {
    const base = c.porModo.get(c.modos[0]);
    const tipos = base.reduce((a, [, t]) => ((a[t] = (a[t] || 0) + 1), a), {});
    console.log(`  ${nome.padEnd(11)} ${String(base.length).padStart(3)} variáveis × ${c.modos.length} modo(s)  ${JSON.stringify(tipos)}`);
    // INVARIANTE CRÍTICO — os modos de uma coleção precisam declarar EXATAMENTE
    // o mesmo conjunto de nomes. O import nativo trata cada arquivo como um
    // modo; nome presente num arquivo e ausente noutro fica sem valor naquele
    // modo e o Figma acusa erro, um por lacuna. Medido com duas sondas de 2 e 1
    // token: separadas importam limpo, juntas dão 3 erros — exatamente as 3
    // lacunas. É por isso que --split agrupa em pasta por coleção: a pasta é o
    // conjunto que pode ser importado de uma vez.
    const nomes = new Set(base.map(([k]) => k));
    for (const m of c.modos.slice(1)) {
      const outros = c.porModo.get(m).map(([k]) => k);
      const faltam = [...nomes].filter((k) => !outros.includes(k));
      const sobram = outros.filter((k) => !nomes.has(k));
      if (faltam.length || sobram.length) {
        problemas.push(
          `${nome}: modo "${m}" diverge de "${c.modos[0]}" — ` +
            `${faltam.length} lacuna(s) [${faltam.slice(0, 3).join(', ')}], ` +
            `${sobram.length} extra(s) [${sobram.slice(0, 3).join(', ')}]`,
        );
      }
    }
  }

  console.log(`\nProblemas: ${problemas.length}`);
  for (const p of problemas) console.log('  ! ' + p);
  process.exit(problemas.length ? 1 : 0);
}

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
