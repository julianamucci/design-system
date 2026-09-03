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

/**
 * Slugs cujas classes NÃO começam por `.nds-<slug>`.
 *
 * A regra geral vale para 58 dos 58 componentes antigos, e o instrumento
 * dependia dela em silêncio: quando o prefixo divergia, ele não achava folha
 * nenhuma e imprimia "(nenhuma)" — que se lê como "não há token a conferir",
 * e não como "não sei onde procurar". Instrumento cego parecendo instrumento
 * limpo é o mesmo defeito de portão sem dentes.
 *
 * A divergência é legítima e vai crescer: a guideline 17 manda UMA FOLHA POR
 * FAMÍLIA, então o slug vem do catálogo (`composer-model-picker`) e a classe
 * vem da família (`.nds-composer-model`). As duas nomeações estão certas.
 *
 * Lista fechada de propósito — declarar é decidir; adivinhar por prefixo comum
 * faria `composer-voice` varrer as classes de `composer-context`.
 */
const PREFIXO_POR_SLUG = {
  'composer-model-picker': '.nds-composer-model',
  'draft-restore': '.nds-composer-draft',
  'message-queue': '.nds-composer-queue',
};

/** Os prefixos de classe que ESTE slug pode usar. */
const PREFIXOS = [`.nds-${slug}`, PREFIXO_POR_SLUG[slug]].filter(Boolean);
const usaPrefixo = (seletor) => PREFIXOS.some((p) => seletor.includes(p));

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
    if (usaPrefixo(sel)) temSlug = true;
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
    String.raw`[^{}]*?\b(?:value|target|parte|className):\s*(['"\`])((?:\\.|(?!\3)[^\\])*)\3`,
  'g',
);

/**
 * A MESMA linha, com a coluna do meio vindo do conteúdo compartilhado.
 *
 * Metade das docs pages não escreve o seletor como literal — escreve
 * `value: tContent('tokens.table.menubarBg.class')`, e o texto mora no
 * `translations.json`. O `LINHA_RX` acima só casa literal, então essas linhas
 * não eram lidas: **935 de 1899 linhas do repositório, e 121 das 236 docs pages
 * com tabela ficavam com ZERO linha legível**.
 *
 * O efeito é o pior possível num instrumento: as seções 1 e 3 imprimiam
 * "nenhuma" — não porque a tabela fecha, mas porque nada foi comparado. O
 * script já tinha o contador `naoLidos` para separar "não tem linha" de "não sei
 * ler", só que ele é impresso DENTRO da seção de divergência, que é justamente a
 * que emudece quando nada é lido. Guarda que só fala quando há outra coisa
 * falando não guarda nada.
 */
const LINHA_I18N_RX = new RegExp(
  String.raw`\{[^{}]*?\btoken:\s*(['"\`])(--[A-Za-z0-9-]+)\1` +
    // `[\w$.]+` e não `\w+`: o Svelte chama `$tStore(...)`, e `$` não é `\w`.
    // Era o que deixava aquela stack em zero linha depois de o resto já ler.
    String.raw`[^{}]*?\b(?:value|target|parte|className):\s*[\w$.]+\(\s*(['"\`])([^'"\`]+)\3\s*\)`,
  'g',
);

/**
 * A tupla POSICIONAL: `['--input', '.nds-input', 'border']`.
 *
 * Token e seletor são os dois primeiros elementos, e a terceira posição é a
 * chave da descrição. Exige `.nds-` no segundo para não casar array qualquer
 * que comece com um token.
 */
const LINHA_TUPLA_RX = new RegExp(
  String.raw`\[\s*(['"\`])(--[A-Za-z0-9-]+)\1\s*,\s*(['"\`])([^'"\`]*\.nds-[^'"\`]*)\3`,
  'g',
);

/**
 * A tupla `{ token: '--accent', k: 'accent' }`, resolvida no `.map()`.
 *
 * É a forma que o docblock do topo já dava por ilegível ("tupla + `.map()`"),
 * e ela não é rara: o token vem literal no código e a coluna vem do conteúdo,
 * por uma CHAVE. Sem casar as duas pontas, toggle, progress e irmãos ficavam em
 * zero linha. A chave resolve contra `tokens.table.<k>.<coluna>`.
 */
// Sem ORDEM fixa e sem nome fixo: o `k` do toggle e o `key` do input-group são
// a mesma ideia, e o input-group ainda escreve a chave ANTES do token. Casar o
// bloco inteiro e extrair os dois campos separadamente é o que dispensa uma
// variante de regex por arquivo.
const BLOCO_RX = /\{[^{}]*\}/g;
const CAMPO_TOKEN_RX = /\btoken:\s*(['"`])(--[A-Za-z0-9-]+)\1/;
const CAMPO_CHAVE_RX = /\b(?:k|key):\s*(['"`])([A-Za-z0-9_]+)\1/;

/** Resolve `tokens.table.x.class` no conteúdo compartilhado do slug. */
const CONTEUDO = (() => {
  const p = join(ROOT, 'docs', 'shared', 'content', slug, 'translations.json');
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    return j['pt-BR'] ?? j.pt ?? Object.values(j)[0] ?? null;
  } catch {
    return null;
  }
})();

/**
 * As linhas que o próprio conteúdo compartilhado declara.
 *
 * Um filho de `tokens.table` (ou `tokens.items`) que carrega `token` E uma
 * coluna de seletor É uma linha da tabela — a docs page só a percorre. As
 * chaves de cabeçalho (`token`, `class`, `part`) são string, não objeto, e
 * caem fora por isso.
 */
function linhasDoConteudo() {
  // As DUAS, e não a primeira que existir: o accordion tem `tokens.table` com
  // só os rótulos de cabeçalho e as linhas em `tokens.items`, então parar na
  // primeira devolvia zero linha para uma tabela completa.
  const raizes = [CONTEUDO?.tokens?.table, CONTEUDO?.tokens?.items].filter(
    (r) => r && typeof r === 'object',
  );
  if (!raizes.length) return [];
  const saida = [];
  for (const v of raizes.flatMap((r) => Object.values(r))) {
    if (!v || typeof v !== 'object') continue;
    const token = v.token;
    const coluna = v.value ?? v.class ?? v.target ?? v.parte;
    if (typeof token !== 'string' || !token.startsWith('--')) continue;
    if (typeof coluna !== 'string') continue;
    saida.push({ token, coluna: coluna.trim() });
  }
  return saida;
}

function porChave(chave) {
  if (!CONTEUDO) return null;
  let no = CONTEUDO;
  for (const parte of chave.split('.')) {
    if (no == null || typeof no !== 'object') return null;
    no = no[parte];
  }
  return typeof no === 'string' ? no : null;
}

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
const chavesMortas = [];   // tContent que não resolve no conteúdo compartilhado
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
  const arquivoRel = relative(ROOT, join(dir, arq)).replace(/\\/g, '/');
  for (const m of src.matchAll(LINHA_RX)) {
    linhas.push({
      token: m[2],
      coluna: m[4].replace(/\\(['"`])/g, '$1').trim(),
      arquivo: arquivoRel,
    });
  }

  // Linhas cuja coluna do meio vem do conteúdo compartilhado. A chave que não
  // resolve entra como `null` e é CONTADA — chave errada num `tContent` é linha
  // que o leitor vê vazia, e silenciá-la aqui repetiria o defeito que este
  // bloco existe para corrigir.
  LINHA_I18N_RX.lastIndex = 0;
  for (const m of src.matchAll(LINHA_I18N_RX)) {
    const texto = porChave(m[4]);
    if (texto === null) { chavesMortas.push(`${stack}: ${m[4]}`); continue; }
    linhas.push({ token: m[2], coluna: texto.trim(), arquivo: arquivoRel });
  }

  LINHA_TUPLA_RX.lastIndex = 0;
  for (const m of src.matchAll(LINHA_TUPLA_RX)) {
    linhas.push({ token: m[2], coluna: m[4].trim(), arquivo: arquivoRel });
  }

  // Tupla `{ token, k }`: o token é literal no código, a coluna vem do conteúdo
  // por uma chave. Tenta as três colunas que o repositório usa.
  BLOCO_RX.lastIndex = 0;
  for (const bloco of src.match(BLOCO_RX) ?? []) {
    // O bloco que JÁ traz a coluna do meio — literal ou por chamada — foi lido
    // pelos dois caminhos acima, e a chave dele não é o que a página renderiza.
    // O Angular é o caso: ele mapeia `value: className` e ignora o `class` do
    // conteúdo, então resolver o `k` aqui inventava uma linha que ninguém vê.
    // Foi falso positivo introduzido nesta mesma rodada, pego pela contagem por
    // stack ter subido de 8 para 16.
    if (/\b(?:value|target|parte|className):\s*(?:['"`]|[\w$.]+\()/.test(bloco)) continue;
    const mt = CAMPO_TOKEN_RX.exec(bloco);
    const mk = CAMPO_CHAVE_RX.exec(bloco);
    if (!mt || !mk) continue;
    const chave = mk[2];
    const texto =
      porChave(`tokens.table.${chave}.class`) ??
      porChave(`tokens.table.${chave}.value`) ??
      porChave(`tokens.items.${chave}.class`) ??
      porChave(`tokens.items.${chave}.value`);
    if (texto === null || texto === undefined) { chavesMortas.push(`${stack}: tokens.*.${chave}`); continue; }
    linhas.push({ token: mt[2], coluna: texto.trim(), arquivo: arquivoRel });
  }

  // TERCEIRA forma: a docs page não escreve linha nenhuma — ela faz `.map()`
  // sobre uma lista de chaves e monta cada linha com
  // `tContent(`tokens.table.${k}.token`)`. Aí o NOME do token também mora no
  // conteúdo compartilhado, e não há o que casar no código.
  //
  // Nesses casos a tabela inteira é legível direto do JSON, e é de lá que ela
  // sai. Eram 43 slugs — accordion, composer inteiro, chat-thread, editor — em
  // que este instrumento lia ZERO linhas e imprimia "nenhuma" nas duas seções
  // de defeito.
  if (/tokens\.(?:table|items)\.\$\{/.test(src) || /\btokens\?\.items\b/.test(src)) {
    for (const l of linhasDoConteudo()) linhas.push({ ...l, arquivo: arquivoRel });
  }

  // DEDUPE por (token, coluna). Uma mesma linha pode casar em mais de um
  // caminho — o Angular escreve `className` literal E `k`, e sem isto ela era
  // contada duas vezes, dobrando o total daquela stack e podendo mascarar
  // divergência real com volume.
  const vistas = new Set();
  linhasPorStack[stack] = linhas.filter((l) => {
    const chave = `${l.token} ${l.coluna}`;
    if (vistas.has(chave)) return false;
    vistas.add(chave);
    return true;
  });

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
    if (!usaPrefixo(peca)) continue;
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
console.log(`folha(s) com seletor ${PREFIXOS.join(' ou ')}: ${folhasDoSlug.join(', ') || '(nenhuma)'}`);

// Quantas linhas ENTRARAM na comparação, por stack. Vem antes de tudo porque é
// o número que diz se "nenhuma" abaixo significa "fecha" ou "não comparei
// nada" — e por meio ano significou a segunda coisa em metade das docs pages,
// em silêncio.
const totalLinhas = Object.values(linhasPorStack).reduce((s, l) => s + l.length, 0);
console.log(
  `linhas comparadas: ${totalLinhas} — ` +
    STACKS.map((s) => `${s}:${(linhasPorStack[s] ?? []).length}`).join(' '),
);
if (!totalLinhas) {
  console.log('   ⚠ ZERO linhas lidas. As seções abaixo estão vazias por AUSÊNCIA,');
  console.log('     não por acerto — este slug não foi verificado.');
}
if (chavesMortas.length) {
  console.log(`   ⚠ ${chavesMortas.length} chave(s) de conteúdo que não resolvem: ${chavesMortas.slice(0, 5).join(' · ')}`);
}

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
