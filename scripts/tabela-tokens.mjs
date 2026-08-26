#!/usr/bin/env node
/**
 * `tabela-tokens.mjs <slug>` — cruza a TABELA DE TOKENS das cinco docs pages
 * com as folhas de `docs/shared/styles/nds/`, nos dois sentidos.
 *
 * Existe porque o parser foi reconstruído três vezes numa sessão só, cada vez
 * com um erro diferente — e cada erro custou uma medição publicada e depois
 * desmentida. As armadilhas estão resolvidas aqui, uma vez:
 *
 * 1. A coluna do meio CONTÉM aspas (`.nds-checkbox[data-state="checked"]`).
 *    Fechar a captura em qualquer aspa trunca o seletor no meio do atributo, e
 *    a linha vira "seletor inexistente". Foram 40 falsos positivos iguais.
 * 2. A classe pode estar em QUALQUER posição do seletor: quem lê
 *    `--sidebar-border` é `.nds-sidebar-root[…] .nds-sidebar-panel`. Casar só
 *    pelo início reprovava quatro linhas corretas de uma vez.
 * 3. `--radius-md: calc(var(--radius) - 2px)`. Sobrescrever `--radius` MOVE o
 *    raio, então a linha que nomeia `--radius` é verdadeira mesmo que o
 *    seletor leia `--radius-md`. Sem resolver a derivação, o portão manda
 *    trocar o token de cima pelo de baixo — o ponto de customização pior.
 * 4. `.nds-card` NÃO casa com `.nds-card-footer`. O casamento é por compound
 *    inteiro, delimitado por combinador, `:` ou `[`.
 *
 * O que ele NÃO vê, e por isso reporta em vez de reprovar:
 *
 * - token que chega por JS (a paleta do chart sai de `getComputedStyle`) ou por
 *   atributo de SVG — não há regra CSS para conferir;
 * - token que chega por peça COMPOSTA (a seta do carrossel é um `.nds-button`,
 *   e quem lê é `button.css`). Aqui a linha é legítima, e o relatório mostra em
 *   QUAL folha o seletor foi encontrado, para quem lê julgar;
 * - se a DESCRIÇÃO da linha diz a verdade. Isso é leitura, não varredura.
 *
 * Uso:
 *   node scripts/tabela-tokens.mjs button
 *   node scripts/tabela-tokens.mjs button --json
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIR_CSS = join(ROOT, 'docs', 'shared', 'styles', 'nds');
const STACKS = ['react', 'vue', 'svelte', 'vanilla', 'angular'];

const slug = process.argv[2];
const comoJson = process.argv.includes('--json');
if (!slug || slug.startsWith('--')) {
  console.error('uso: node scripts/tabela-tokens.mjs <slug> [--json]');
  process.exit(2);
}

/* ── Índice das folhas ─────────────────────────────────────────────────────
 * Divide o CSS em regras folha e guarda, por peça de seletor, os tokens que a
 * regra lê (`var(--x)`) ou declara (`--x:`), com o arquivo e a linha. */

function regrasDe(css) {
  const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const regras = [];
  const pilha = [];
  let buf = '';
  let linha = 1;
  let linhaAbertura = 1;
  for (const ch of semComentario) {
    if (ch === '\n') linha++;
    if (ch === '{') {
      pilha.push({ sel: buf.trim(), linha: linhaAbertura });
      buf = '';
      linhaAbertura = linha;
    } else if (ch === '}') {
      const topo = pilha.pop() ?? { sel: '', linha };
      regras.push({ sel: topo.sel, linha: topo.linha, body: buf });
      buf = '';
      linhaAbertura = linha;
    } else {
      if (!buf.trim()) linhaAbertura = linha;
      buf += ch;
    }
  }
  return regras;
}

const porSeletor = new Map();  // '.nds-x' -> [{ token, arquivo, linha }]
const folhasDoSlug = [];

for (const arquivo of readdirSync(DIR_CSS).filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(join(DIR_CSS, arquivo), 'utf8');
  let temSlug = false;
  for (const { sel, linha, body } of regrasDe(css)) {
    if (!sel || sel.startsWith('@')) continue;
    if (sel.includes(`.nds-${slug}`)) temSlug = true;
    const tokens = new Set();
    for (const m of body.matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)) tokens.add(m[1]);
    for (const m of body.matchAll(/(?:^|[;{\s])(--[A-Za-z0-9-]+)\s*:/g)) tokens.add(m[1]);
    if (!tokens.size) continue;
    for (const peca of sel.split(',')) {
      const p = peca.trim();
      if (!p) continue;
      if (!porSeletor.has(p)) porSeletor.set(p, []);
      for (const t of tokens) porSeletor.get(p).push({ token: t, arquivo, linha });
    }
  }
  if (temSlug) folhasDoSlug.push(arquivo);
}

// Derivação de token, para a armadilha 3.
const derivaDe = new Map();
const tokensCss = join(ROOT, 'docs', 'shared', 'tokens', 'tokens.css');
if (existsSync(tokensCss)) {
  const css = readFileSync(tokensCss, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const pais = [...m[2].matchAll(/var\(\s*(--[A-Za-z0-9-]+)/g)].map((x) => x[1]);
    if (!pais.length) continue;
    if (!derivaDe.has(m[1])) derivaDe.set(m[1], new Set());
    for (const pai of pais) derivaDe.get(m[1]).add(pai);
  }
}

const COMBINADOR = [' ', '>', '+', '~'];
function seletorCasa(peca, nomeado) {
  let i = peca.indexOf(nomeado);
  while (i !== -1) {
    const antes = i === 0 ? '' : peca[i - 1];
    const depois = peca[i + nomeado.length] ?? '';
    const abre = antes === '' || COMBINADOR.includes(antes);
    const fecha = depois === '' || depois === ':' || depois === '[' || COMBINADOR.includes(depois);
    if (abre && fecha) return true;
    i = peca.indexOf(nomeado, i + 1);
  }
  return false;
}

function leiturasDe(nomeado) {
  const saida = [];
  for (const [peca, itens] of porSeletor) {
    if (!seletorCasa(peca, nomeado)) continue;
    saida.push(...itens);
  }
  return saida;
}

function comAncestrais(tokens) {
  const saida = new Set(tokens);
  const fila = [...tokens];
  while (fila.length) {
    const t = fila.pop();
    for (const pai of derivaDe.get(t) || []) {
      if (saida.has(pai)) continue;
      saida.add(pai);
      fila.push(pai);
    }
  }
  return saida;
}

/* ── Linhas declaradas nas cinco docs pages ────────────────────────────── */

// `parte` entra ao lado de `value` e `target`: cada stack batizou a coluna do
// meio à sua maneira, e faltando um nome o script dá a linha por inexistente.
const LINHA_RX = new RegExp(
  String.raw`\{[^{}]*?\btoken:\s*(['"\`])(--[A-Za-z0-9-]+)\1` +
    String.raw`[^{}]*?\b(?:value|target|parte):\s*(['"\`])((?:\\.|(?!\3)[^\\])*)\3`,
  'g',
);

/**
 * Há uma forma que este script NÃO lê, e é melhor declarar do que fingir: a
 * tabela montada a partir de TUPLAS (`['--chart-1', 'chart1']`) que só viram
 * objeto depois, num `.map()`. Ali a linha existe e o seletor nasce fora do
 * literal, então não há o que casar.
 *
 * Sem esta distinção o relatório dizia "sem linha" para stacks que listam o
 * token — ou seja, "não sei ler" saía como "não tem". É a mesma classe de
 * defeito que este script existe para pegar, e ele a cometia.
 */
const TOKEN_SOLTO_RX = /(['"`])(--[A-Za-z0-9-]+)\1/g;

const pascal = slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
const linhasPorStack = {};
const naoLidos = {};   // stack -> quantos tokens ficaram fora do alcance do regex

for (const stack of STACKS) {
  const dir = join(ROOT, `nortear-design-system-${stack}`, 'src', 'components', 'docs');
  if (!existsSync(dir)) continue;
  const arq = readdirSync(dir).find(
    (f) => statSync(join(dir, f)).isFile() && new RegExp(`^${pascal}Docs\\.`).test(f),
  );
  if (!arq) continue;
  const src = readFileSync(join(dir, arq), 'utf8');
  const linhas = [];
  LINHA_RX.lastIndex = 0;
  for (const m of src.matchAll(LINHA_RX)) {
    linhas.push({
      token: m[2],
      coluna: m[4].replace(/\\(['"`])/g, '$1').trim(),
      arquivo: relative(ROOT, join(dir, arq)).replace(/\\/g, '/'),
    });
  }
  linhasPorStack[stack] = linhas;

  // Se o arquivo NOMEIA tokens que a varredura de linha não alcançou, a forma
  // dele é uma que este script não lê (tupla + `.map()`). Registrar isso é o que
  // separa "não tem linha" de "não sei ler" — sem a distinção, o relatório
  // acusava de ausente uma tabela completa.
  TOKEN_SOLTO_RX.lastIndex = 0;
  const nomeados = new Set([...src.matchAll(TOKEN_SOLTO_RX)].map((m) => m[2]));
  const lidos = new Set(linhas.map((l) => l.token));
  const foraDeAlcance = [...nomeados].filter((t) => !lidos.has(t) && /^--(chart|primary|muted|border|foreground|background|card|ring)/.test(t));
  if (foraDeAlcance.length > 2 && linhas.length < foraDeAlcance.length) {
    naoLidos[stack] = foraDeAlcance.length;
  }
}

/* ── Sentido 1: cada linha declarada fecha com a folha? ────────────────── */

const veredito = (linha) => {
  const { token, coluna } = linha;
  if (!coluna || coluna === '—' || coluna === '-') return { estado: 'ausencia-declarada' };
  if (!coluna.includes('.nds-')) return { estado: 'coluna-nao-e-seletor' };

  const nomeados = coluna.split(/·|,/).map((s) => s.trim()).filter((s) => s.startsWith('.nds-'));
  if (!nomeados.length) return { estado: 'coluna-nao-e-seletor' };

  const todas = nomeados.flatMap((n) => leiturasDe(n));
  if (!todas.length) return { estado: 'seletor-inexistente', nomeados };

  const lidos = comAncestrais(new Set(todas.map((x) => x.token)));
  if (!lidos.has(token)) {
    return {
      estado: 'nao-le',
      nomeados,
      folhas: [...new Set(todas.map((x) => x.arquivo))],
      leTambem: [...new Set(todas.map((x) => x.token))].slice(0, 8),
    };
  }
  const onde = todas.filter((x) => x.token === token);
  return {
    estado: 'ok',
    // Folha DIFERENTE da do componente significa peça composta — legítimo, e
    // vale saber, porque a coluna precisa nomear o seletor daquela peça.
    origem: [...new Set((onde.length ? onde : todas).map((x) => `${x.arquivo}:${x.linha}`))].slice(0, 3),
  };
};

/* ── Sentido 2: token que a folha do slug lê e nenhuma tabela lista ────── */

const lidosPelaFolha = new Map(); // token -> Set(seletor)
for (const [peca, itens] of porSeletor) {
  for (const { token, arquivo } of itens) {
    if (!folhasDoSlug.includes(arquivo)) continue;
    if (!peca.includes(`.nds-${slug}`)) continue;
    if (!lidosPelaFolha.has(token)) lidosPelaFolha.set(token, new Set());
    lidosPelaFolha.get(token).add(peca);
  }
}
const declarados = new Set(Object.values(linhasPorStack).flat().map((l) => l.token));
const semLinhaTudo = [...lidosPelaFolha.keys()].filter((t) => !declarados.has(t));

/**
 * Separar a lista é o que decide se esta seção é instrumento ou ruído. Sem
 * separar, o sidebar devolve 27 itens e o que importa some no meio — foi
 * exatamente por isso que a primeira versão desta varredura, com 46 achados e
 * 25% de precisão, foi descartada.
 *
 * ESCALA GLOBAL (`--spacing-*`, `--text-*`, `--font-*`, `--duration-*`,
 * `--ease-*`, `--z-*`, `--shadow-*`) é lida por quase todo componente, e
 * redefinir qualquer uma muda o sistema inteiro, não a peça. Listar ou não na
 * tabela é decisão de CONTEÚDO, uniforme para as ~50 páginas — não é defeito
 * deste componente, e hoje o repositório faz as duas coisas em páginas
 * diferentes.
 *
 * O resto — semântico de cor e var do próprio componente, como
 * `--radius-badge` ou `--alert-bg-alpha` — é ponto de customização DA PEÇA.
 * Token desses lido pela folha e ausente da tabela costuma ser linha que
 * faltou: foi o caso das duas alfas do alert, que tinham descrição escrita,
 * com o registro de por que o valor muda entre claro e escuro, e nenhuma
 * página as renderizava.
 */
const ESCALA_GLOBAL_RX = /^--(spacing|text|font|duration|ease|z|shadow|leading|tracking|box|size)-/;
const especificoDoComponente = (t) =>
  t.includes(slug.replace(/-/g, '')) || t.includes(slug) || !ESCALA_GLOBAL_RX.test(t);

const semLinha = semLinhaTudo.filter((t) => especificoDoComponente(t));
const semLinhaEscala = semLinhaTudo.filter((t) => !especificoDoComponente(t));

/* ── Sentido 3: as cinco dizem a mesma coisa? ──────────────────────────── */

const porToken = new Map();
for (const [stack, linhas] of Object.entries(linhasPorStack)) {
  for (const l of linhas) {
    if (!porToken.has(l.token)) porToken.set(l.token, new Map());
    porToken.get(l.token).set(stack, l.coluna);
  }
}
const divergentes = [];
for (const [token, porStack] of porToken) {
  const valores = new Set(porStack.values());
  const faltando = STACKS.filter((s) => linhasPorStack[s] && !porStack.has(s));
  if (valores.size > 1 || faltando.length) {
    divergentes.push({ token, porStack: Object.fromEntries(porStack), faltando });
  }
}

/* ── Saída ─────────────────────────────────────────────────────────────── */

const problemas = [];
for (const [stack, linhas] of Object.entries(linhasPorStack)) {
  for (const l of linhas) {
    const v = veredito(l);
    if (v.estado === 'nao-le' || v.estado === 'seletor-inexistente') {
      problemas.push({ stack, ...l, ...v });
    }
  }
}

if (comoJson) {
  console.log(JSON.stringify({ slug, folhasDoSlug, problemas, semLinha, divergentes }, null, 2));
  process.exit(problemas.length ? 1 : 0);
}

console.log(`\n# tabela de tokens — ${slug}`);
console.log(`folha(s) com seletor .nds-${slug}: ${folhasDoSlug.join(', ') || '(nenhuma)'}`);

console.log(`\n## 1. linhas que NÃO fecham com a folha (${problemas.length})`);
if (!problemas.length) console.log('   nenhuma');
for (const p of problemas) {
  if (p.estado === 'seletor-inexistente') {
    console.log(`   ${p.stack.padEnd(8)} ${p.token.padEnd(24)} ${p.coluna}`);
    console.log(`   ${''.padEnd(8)} └─ esse seletor não existe em folha nenhuma`);
  } else {
    console.log(`   ${p.stack.padEnd(8)} ${p.token.padEnd(24)} ${p.coluna}`);
    console.log(`   ${''.padEnd(8)} └─ a regra existe (${p.folhas.join(', ')}) e lê: ${p.leTambem.join(' ')}`);
  }
}

console.log(`\n## 2. tokens DO COMPONENTE que a folha lê e nenhuma tabela lista (${semLinha.length})`);
if (!semLinha.length) console.log('   nenhum');
for (const t of semLinha) {
  console.log(`   ${t.padEnd(26)} ${[...lidosPelaFolha.get(t)].slice(0, 3).join(' · ')}`);
}
if (semLinha.length) {
  console.log('   └─ candidato a linha que faltou. Confirme lendo a regra antes de');
  console.log('      acrescentar: nem todo token lido é ponto de customização útil.');
}

console.log(`\n## 2b. escala global lida por este componente (${semLinhaEscala.length})`);
if (!semLinhaEscala.length) console.log('   nenhuma');
else {
  console.log(`   ${semLinhaEscala.join(' ')}`);
  console.log('   └─ NÃO é defeito. Redefinir qualquer uma muda o sistema inteiro, não a');
  console.log('      peça. Listar ou não é decisão de conteúdo, uniforme para todas as');
  console.log('      páginas — e hoje o repositório faz as duas coisas em páginas diferentes.');
}

console.log(`\n## 3. divergência entre stacks (${divergentes.length})`);
if (!divergentes.length) console.log('   nenhuma');
for (const d of divergentes) {
  console.log(`   ${d.token}`);
  for (const [s, v] of Object.entries(d.porStack)) console.log(`      ${s.padEnd(8)} ${v}`);
  const semLeitura = d.faltando.filter((s) => naoLidos[s]);
  const semLinha = d.faltando.filter((s) => !naoLidos[s]);
  if (semLinha.length) console.log(`      sem linha: ${semLinha.join(", ")}`);
  if (semLeitura.length) console.log(`      forma não lida por este script: ${semLeitura.join(", ")}`);
}

console.log('\nnão coberto por este script: token que chega por JS ou atributo SVG,');
console.log('e se a DESCRIÇÃO da linha diz a verdade — isso é leitura, não varredura.\n');

process.exit(problemas.length ? 1 : 0);
