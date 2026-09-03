/**
 * Guarda transversal das transforms do painel Code.
 *
 * Cada `*.source.ts` exporta funções chamáveis SEM argumento (os args da story
 * são opcionais e caem no padrão). Isso é o que permite varrer todas de uma vez
 * e cobrar o que vale para o repositório inteiro: o snippet ensina o design
 * system, não o andaime da story.
 */
import { describe, expect, it } from 'vitest';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });

const caminhos = Object.keys(modulos).sort();

/**
 * Andaime: o que existe só para a story montar. O invólucro `*Story`, o
 * `wrapper`, o `caso` das tabelas de variação e — específico desta stack — o
 * módulo de fixtures, de onde as stories importam helpers de medição e massa de
 * dados. Nada disso é importável por quem consome o design system.
 */
const SCAFFOLD = /\b[A-Z][A-Za-z0-9]*Story\b|\bwrapper\b|\bcaso\b|\.fixtures\b/;

/**
 * Exports que legitimamente NÃO constroem snippet: constante de medida e
 * helpers de atributo, que devolvem um pedaço e não um trecho copiável.
 *
 * Lista fechada de propósito. Acrescentar um nome aqui é declarar a exceção;
 * deixar de fora é reprovar — que é como o portão volta a ter dentes.
 */
const HELPERS = new Set(['HEIGHT_PLAYGROUND', 'attrRatio', 'ratioExpression']);

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OTHER_STACK = /\b(React|Svelte|Angular|Vanilla|bits-ui|base-ui|radix)\b/i;

/**
 * Valor de design cravado em `style` inline — a regra `inline_style_design_value`
 * do `scripts/audit.mjs`, reimplantada aqui porque o auditor NÃO alcança este
 * código.
 *
 * A guarda de snippet dele (`snippetMask`) trata tudo que está entre crases como
 * "trecho exibido ao leitor" e mascara. O markup de story desta stack vive em
 * template string, e o destas transforms também: medido, são 228 declarações em
 * 56 arquivos de story que a máscara já esconde hoje. Escrever os snippets
 * dentro de crases herdaria o mesmo ponto cego, e o snippet é justamente o
 * markup que alguém COPIA. A guarda mora onde o código mora.
 */
const PROPS_DE_DESIGN = new Set([
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-inline',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-inline', 'gap', 'row-gap', 'column-gap',
  'font-size', 'line-height', 'font-weight', 'letter-spacing',
  'color', 'background', 'background-color', 'border-color', 'fill', 'stroke',
  'border', 'border-width', 'border-radius', 'box-shadow', 'opacity',
]);
const VALUE_MECANICO =
  /^(0|0px|0rem|auto|none|inherit|initial|unset|revert|100%|fit-content|max-content|min-content|currentcolor|transparent)$/i;
const QUANTIDADE = /(^|[\s(])-?\d*\.?\d+(px|rem|em|ch|vh|vw|%)|^#[0-9a-f]{3,8}$|^(rgb|hsl)a?\(/i;

/** Declarações de design cravadas em `style="…"` dentro do snippet. */
function designStyles(snippet: string): string[] {
  const findings: string[] = [];
  for (const m of snippet.matchAll(/(?<!:)style="([^"]*)"/g)) {
    for (const decl of m[1].split(';')) {
      const [prop, ...remainder] = decl.split(':');
      if (!prop || !remainder.length) continue;
      const name = prop.trim().toLowerCase();
      const value = remainder.join(':').trim();
      if (!PROPS_DE_DESIGN.has(name)) continue;
      if (VALUE_MECANICO.test(value)) continue;
      if (value.includes('var(')) continue; // token, não valor cravado
      if (!QUANTIDADE.test(value)) continue;
      findings.push(`${name}: ${value}`);
    }
  }
  return findings;
}

/**
 * O TEXTO de cada módulo, para alcançar os ramos que a chamada não alcança.
 *
 * Lido como texto, e não importado: a pergunta é sobre o que o arquivo
 * PUBLICA, e o que ele publica não depende de qual argumento chegou.
 */
const fontes = import.meta.glob<string>('./**/*.source.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * O texto que o módulo PUBLICA: o conteúdo de todo literal de string, e nada
 * mais.
 *
 * É um tokenizador, e não um par de crases, e a diferença foi medida. Extrair
 * por `/` + crase + `([\s\S]*?)` + crase pega a crase de DOCBLOCK — nesta stack
 * quase todo módulo cita o nome de uma constante entre crases na prosa —, e
 * prosa lida como código publicado inventa achado. Aqui o comentário é PULADO,
 * e só literal de string entra: é onde o snippet desta stack mora, seja em
 * `'  <div>'` de lista de linhas, em `"import { X } from '…'"` ou em template
 * literal.
 *
 * `${…}` fica de fora de propósito: o que está lá dentro é nome do CONSTRUTOR,
 * e não do exemplo — contá-lo inventaria declaração e laço em todo módulo.
 *
 * LITERAL DE EXPRESSÃO REGULAR precisa ser reconhecido, e não é firula: o
 * `terminal-block` tem `.replace(/'/g, …)`, e a aspa DENTRO da expressão
 * regular abria uma string que só fechava páginas adiante — o módulo inteiro
 * saía da varredura, com um laço solto dentro dele, e sem uma palavra. Portão
 * que exclui em silêncio é o defeito que este repositório já pagou caro duas
 * vezes. A heurística é a clássica: `/` só abre expressão regular depois de um
 * caractere que não pode terminar valor, então `(a + b) / 2` continua sendo
 * divisão.
 *
 * ESCAPE VIRA O CARACTERE QUE ELE NOMEIA, e a versão anterior desta função
 * guardava a LETRA. Um `\n` publicado virava a letra `n`, então
 * `` `import {\n${nomes}\n} from '…'` `` chegava à varredura como
 * `import {nn} from '…'` — e a checagem de origem lia `nn` como o nome que o
 * snippet manda importar, acusando ONZE módulos corretos de uma vez. Com o
 * escape traduzido, a lista interpolada some limpa e a declaração fica vazia,
 * que é a resposta honesta: o nome estava dentro do `${…}`, e ali ele é do
 * construtor.
 */
const ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r' };
const unescape = (c: string): string => ESCAPES[c] ?? c;

function publishedText(source: string): string {
  const parts: string[] = [];
  let i = 0;
  const n = source.length;

  /** Depois destes, `/` abre expressão regular; depois de `)` ou nome, divide. */
  const BEFORE_REGEX = new Set([
    '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '*', '%', '-', '<', '>', '~', '^',
  ]);
  const looksLikeRegex = (): boolean => {
    let j = i - 1;
    while (j >= 0 && /\s/.test(source[j] ?? '')) j -= 1;
    return j < 0 || BEFORE_REGEX.has(source[j] ?? '');
  };
  const readRegex = (): void => {
    i += 1;
    let inClass = false;
    while (i < n) {
      const c = source[i];
      if (c === '\\') { i += 2; continue; }
      if (c === '[') { inClass = true; i += 1; continue; }
      if (c === ']') { inClass = false; i += 1; continue; }
      if (c === '/' && !inClass) { i += 1; return; }
      if (c === '\n') return;
      i += 1;
    }
  };
  const readQuoted = (quote: string): void => {
    let out = '';
    i += 1;
    while (i < n) {
      const c = source[i];
      if (c === '\\') { out += unescape(source[i + 1] ?? ''); i += 2; continue; }
      if (c === quote) { i += 1; break; }
      out += c;
      i += 1;
    }
    parts.push(out);
  };
  const readTemplate = (): void => {
    let out = '';
    i += 1;
    while (i < n) {
      const c = source[i];
      if (c === '\\') { out += unescape(source[i + 1] ?? ''); i += 2; continue; }
      if (c === '`') { i += 1; break; }
      if (c === '$' && source[i + 1] === '{') {
        i += 2;
        let depth = 1;
        while (i < n && depth > 0) {
          const d = source[i];
          if (d === '{') { depth += 1; i += 1; continue; }
          if (d === '}') { depth -= 1; i += 1; continue; }
          if (d === "'" || d === '"') { readQuoted(d); continue; }
          if (d === '`') { readTemplate(); continue; }
          if (d === '/' && source[i + 1] === '/') { while (i < n && source[i] !== '\n') i += 1; continue; }
          if (d === '/' && source[i + 1] === '*') {
            i += 2;
            while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
            i += 2;
            continue;
          }
          if (d === '/' && looksLikeRegex()) { readRegex(); continue; }
          i += 1;
        }
        continue;
      }
      out += c;
      i += 1;
    }
    parts.push(out);
  };

  while (i < n) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') { while (i < n && source[i] !== '\n') i += 1; continue; }
    if (c === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') { readQuoted(c); continue; }
    if (c === '`') { readTemplate(); continue; }
    if (c === '/' && looksLikeRegex()) { readRegex(); continue; }
    i += 1;
  }

  // Uma linha por pedaço: as listas desta stack montam o snippet com
  // `[...].join('\n')`, e um `import { …\n  X,\n }` só volta a ser uma
  // declaração se as partes forem remontadas em linhas.
  return parts.join('\n');
}

/** Fonte de laço que não é nome a declarar. */
const NOT_A_LOOP_SOURCE = new Set(['true', 'false', 'null', 'undefined']);

/**
 * O que algum ramo do snippet ITERA e o próprio snippet não declara.
 *
 * POR QUE ESTA SEGUNDA PASSAGEM EXISTE. A primeira chama cada construtor UMA
 * vez, com os args padrão, e analisa a string que sai: snippet cuja forma muda
 * conforme o argumento tem só o ramo padrão conferido, e medido em 2026-09-03
 * são 56 dos 82 módulos desta stack que ramificam. Ler o TEXTO vê todos os
 * ramos de uma vez, ao custo de uma mudança por stack — declarar caso a caso
 * custaria centenas de arquivos, e cada caso esquecido voltaria a ser silêncio.
 *
 * "Declarado" é dentro do que o leitor COPIA: `const`/`let`/`var`, `function`,
 * `import` publicado, desestruturação, apelido de outro `v-for` e prop de slot.
 * Uma constante importada no topo do arquivo de módulo NÃO conta — ela não
 * viaja com o snippet, e quem copiar recebe um laço sobre um nome que não
 * existe. Foi assim que quatro módulos publicavam `choices`, `medicoes`,
 * `trabalhos` e `sequencia` sem nunca os declarar.
 *
 * Só a RAIZ da fonte é conferida: em `v-for="i in m.itens"` quem precisa
 * existir é `m`. E só `v-for` é conferido — binding comum (`:labels="rotulos"`)
 * fica de fora de propósito, porque nomear o que é de quem consome é a
 * convenção destes exemplos, e cobrá-lo acusaria o repositório inteiro.
 *
 * O QUE ELA NÃO VÊ, e por isso a primeira passagem continua:
 *
 *  · fonte de laço INTERPOLADA (`v-for="x in ${nome}"`) — o `${…}` não entra no
 *    texto publicado, porque ali o nome é do construtor e não do exemplo;
 *  · nome declarado no ramo ERRADO: as declarações e os laços de TODOS os
 *    construtores do módulo caem num balaio só, então um `const` publicado pelo
 *    ramo A cobre um laço do ramo B. O membro ao menos existe em algum exemplo,
 *    e o caso é mais raro que o que isto passa a pegar;
 *  · fonte que não é identificador (`v-for="i in 5"`, `v-for="q in [4, 3]"`) —
 *    não há nome a declarar, e conferir literal seria conferir aritmética;
 *  · o que o `v-for` faz com o item depois: `{{ item.naoExiste }}` continua
 *    invisível às duas passagens.
 */
function loopsWithoutSource(source: string): string[] {
  const texto = publishedText(source);
  const declared = declaredNames(texto);

  const loose = new Set<string>();
  for (const m of texto.matchAll(/v-for="[^"]*?\b(?:in|of)\s+([A-Za-z_$][\w$]*)/g)) {
    const name = m[1]!;
    if (!NOT_A_LOOP_SOURCE.has(name) && !declared.has(name)) loose.add(name);
  }
  return [...loose].sort();
}

/**
 * Tudo que o texto publicado DECLARA — a base das duas checagens de ligação.
 *
 * Uma função só, e não duas cópias, porque a lista do que conta como declaração
 * é a parte que mais cresce: `import type`, apelido de `v-for`, prop de slot,
 * desestruturação. Duas cópias divergem, e a que ficasse para trás passaria a
 * acusar o que a outra aceita.
 *
 * O QUE ELA NÃO VÊ:
 *
 *  · declaração cujo NOME chega por interpolação (`` `function ${nome}() {` ``)
 *    — o `${…}` sai antes da varredura, e o que sobra é um `function () {` sem
 *    nome. O `sonner` escrevia assim e por isso o `notificar` dele parecia
 *    solto; o conserto foi escrever o nome literal no construtor, e é o que se
 *    faz quando isto reaparecer;
 *  · parâmetro de função declarada no `script setup` — só o parâmetro de arrow
 *    ESCRITA DENTRO da expressão do template é reconhecido, mais abaixo.
 */
function declaredNames(texto: string): Set<string> {
  const declared = new Set<string>();
  const add = (name: string | undefined): void => {
    if (name && /^[A-Za-z_$][\w$]*$/.test(name)) declared.add(name);
  };

  // O que o `script setup` publicado declara.
  for (const m of texto.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  for (const m of texto.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(',')) add(part.split(':').pop()?.split('=')[0]?.trim());
  }
  for (const m of texto.matchAll(/\b(?:const|let|var)\s*\[([^\]]*)\]/g)) {
    for (const part of m[1]!.split(',')) add(part.split('=')[0]?.trim());
  }
  for (const m of texto.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) add(m[1]);
  // Import publicado conta, e é o caso de `RUN_STATUSES` e `CONNECTION_STATES`:
  // o snippet ensina a iterar o vocabulário compartilhado, e ensina a importá-lo
  // na linha de cima. `import type` também entra — deixá-lo de fora seria pular
  // em silêncio, que é o modo de falhar que este arquivo existe para fechar.
  for (const m of texto.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(',')) {
      add(part.trim().split(/\s+as\s+/).pop()?.replace(/^type\s+/, '').trim());
    }
  }
  for (const m of texto.matchAll(/import\s+([A-Za-z_$][\w$]*)\s*(?:,|from\b)/g)) add(m[1]);

  // E o que o próprio TEMPLATE introduz: apelido de laço e prop de slot. Sem
  // isto, `v-for="i in m.itens"` acusaria `m`, que é o item do laço de fora.
  for (const m of texto.matchAll(
    /v-for="\s*\(?\s*([A-Za-z_$][\w$]*)\s*(?:,\s*([A-Za-z_$][\w$]*))?\s*(?:,\s*([A-Za-z_$][\w$]*))?\s*\)?\s+(?:in|of)\s/g,
  )) {
    add(m[1]);
    add(m[2]);
    add(m[3]);
  }
  for (const m of texto.matchAll(/(?:v-slot(?::[\w.-]+)?|#[\w.-]+)="\s*\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(',')) add(part.split(':').pop()?.split('=')[0]?.trim());
  }
  for (const m of texto.matchAll(/(?:v-slot(?::[\w.-]+)?|#[\w.-]+)="\s*([A-Za-z_$][\w$]*)\s*"/g)) {
    add(m[1]);
  }

  return declared;
}

/**
 * Palavras que aparecem numa expressão de template e NÃO são nome a declarar.
 *
 * Palavra reservada, o que o Vue injeta no template e o global que qualquer
 * página tem. Lista fechada de propósito: o que não estiver aqui e não for
 * declarado é acusado, porque o silêncio é o modo de falhar que estas checagens
 * existem para fechar.
 */
const NOT_A_REFERENCE = new Set([
  'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'in', 'of', 'new', 'void',
  'delete', 'return', 'await', 'yield', 'function', 'this', 'const', 'let', 'var', 'if', 'else',
  'as', 'satisfies',
  '$event', '$el', '$refs', '$emit', '$attrs', '$slots', '$props', '$parent', '$data',
  'console', 'Math', 'JSON', 'Date', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Symbol',
  'Set', 'Map', 'Promise', 'Intl', 'URL', 'Error', 'RegExp', 'NaN', 'Infinity',
  'window', 'document', 'navigator', 'globalThis', 'localStorage',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
  'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent', 'structuredClone',
]);

/**
 * Os parâmetros de arrow escrita DENTRO da expressão do template.
 *
 * `@withdraw="(message) => withdraw(message.id)"` declara `message` ali mesmo, e
 * a primeira versão desta função o perdia: o casamento `\(([^)]*)\)` começava no
 * parêntese do `.map(` e devolvia `(state, index` com o parêntese colado, que
 * não passa no teste de identificador. `[^()]*` prende o casamento ao par mais
 * interno, e é o que faz `PLAN_STEP_STATES.map((state, index) => …)` parar de
 * acusar `state` — um falso positivo medido em módulo correto.
 */
function arrowParams(expr: string): string[] {
  const out: string[] = [];
  for (const m of expr.matchAll(/\(\s*([^()]*)\)\s*=>/g)) {
    for (const part of m[1]!.split(',')) out.push(part.trim().split(':')[0]!.trim());
  }
  for (const m of expr.matchAll(/(?:^|[^.\w$)])\s*([A-Za-z_$][\w$]*)\s*=>/g)) out.push(m[1]!);
  return out.filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
}

/**
 * As RAÍZES que uma expressão de template referencia.
 *
 * Só a raiz: em `usuario.nome` quem precisa existir é `usuario`, e em `contar()`
 * é `contar`. O que vem depois do ponto é do tipo, não do escopo do template.
 *
 * Duas limpezas acontecem antes da varredura, e as duas foram falso positivo em
 * outra stack antes de virarem linha aqui:
 *
 *  · TEXTO DENTRO DA EXPRESSÃO NÃO É REFERÊNCIA — `:aria-label="'Ir para ' + n"`
 *    acusaria `Ir` e `para`;
 *  · CHAVE DE OBJETO LITERAL NÃO É REFERÊNCIA — `:usage="{ input: 18000 }"`
 *    acusaria `input`. O que distingue chave de ramo de ternário é o que vem
 *    ANTES: chave é precedida de `{` ou `,`, e o ramo, de `?` ou `:`.
 */
function bindingRoots(expr: string): string[] {
  const semTexto = expr.replace(/'[^']*'/g, "''").replace(/`[^`]*`/g, '``');
  const semChave = semTexto.replace(/([{,]\s*)[A-Za-z_$][\w$]*(\s*:)/g, '$1$2');
  const locais = new Set(arrowParams(semChave));

  const out: string[] = [];
  for (const m of semChave.matchAll(/(?:^|[^.\w$'"`?])([A-Za-z_$][\w$]*)/g)) {
    const name = m[1]!;
    if (NOT_A_REFERENCE.has(name) || locais.has(name)) continue;
    out.push(name);
  }
  return out;
}

/**
 * Os quatro lugares em que uma expressão do template é avaliada contra o escopo.
 *
 * `v-for` fica de fora: ele é conferido por `loopsWithoutSource`, que já entende
 * a sintaxe do apelido. `v-slot` também, pelo mesmo motivo — ali o nome não é
 * referência, é declaração.
 */
const BINDINGS = [
  /(?::|v-bind:)[\w.[\]$-]+="([^"]*)"/g,
  /(?:@|v-on:)[\w.$-]+="([^"]*)"/g,
  /v-(?:if|else-if|show|html|text|memo)="([^"]*)"/g,
  /v-model(?::[\w.-]+)?(?:\.[\w.]+)?="([^"]*)"/g,
  /\{\{([^}]*)\}\}/g,
];

/**
 * O que algum ramo do snippet LIGA e o próprio snippet não declara.
 *
 * POR QUE ESTE CHECK EXISTE, e por que ele contradiz o que a passagem dos laços
 * dizia. Até 2026-09-03 esta stack cobrava declaração só de fonte de `v-for`, e
 * o binding comum ficava de fora "porque nomear o que é de quem consome é a
 * convenção destes exemplos". No Angular o compilador não deixa: expressão de
 * template só enxerga membro de classe, e o snippet de lá declara TUDO que
 * liga. A dona decidiu que as outras stacks passam a cobrar o mesmo, e a
 * convenção antiga saiu — `:labels="rotulos"` sem `const rotulos` entrega a
 * quem copia um `labels` indefinido, e a peça não tem rótulo padrão para cair
 * de volta.
 *
 * Medido nesta stack no dia da mudança: 30 dos 82 módulos, 74 nomes.
 *
 * O QUE ELA NÃO VÊ:
 *
 *  · BINDING INTERPOLADO — `:days="${opts.daysRef ?? 'atividade'}"` chega ao
 *    texto publicado como `:days=""`, porque o `${…}` é do construtor. É o
 *    ponto cego maior, e ele coincide com uma decisão do repositório: dado
 *    volumoso (noventa dias de atividade, seis nós de grafo, trinta turnos de
 *    conversa) entra POR NOME de propósito, para o painel não ensinar o
 *    andaime. O que a checagem alcança é o binding escrito literal, que é onde
 *    moram os rótulos e os ouvintes;
 *  · nome declarado no ramo ERRADO: as declarações e as ligações de TODOS os
 *    construtores do módulo caem num balaio só, então um `const` publicado pelo
 *    ramo A cobre uma ligação do ramo B. O nome ao menos existe em algum
 *    exemplo, e o caso é mais raro que o que isto passa a pegar;
 *  · o que se faz com o nome depois: `{{ item.naoExiste }}` continua invisível,
 *    aqui e na passagem dos laços;
 *  · o CORPO das funções que o snippet declara. `function aoPedir() {
 *    pararExecucao() }` publica um nome que nada declara, e é de propósito: o
 *    que o ouvinte faz é da aplicação, e o exemplo não escolhe por ninguém.
 */
function bindingsWithoutDeclaration(source: string): string[] {
  const texto = publishedText(source);
  const declared = declaredNames(texto);

  const loose = new Set<string>();
  for (const re of BINDINGS) {
    for (const m of texto.matchAll(re)) {
      for (const name of bindingRoots(m[1]!)) if (!declared.has(name)) loose.add(name);
    }
  }
  return [...loose].sort();
}

/**
 * O TEXTO dos índices de componente, para saber o que cada peça exporta.
 *
 * `@/components/ui/<slug>` resolve para `<slug>/index.ts`, e é o índice que
 * decide o que existe: os arquivos `.vue` de dentro não são porta de entrada, e
 * um snippet que ensinasse o caminho direto ensinaria a furar a única porta que
 * a peça tem.
 *
 * Lido como texto, e não importado: importar um `.vue` fora do compilador
 * quebra, e a pergunta não precisa de execução — é sobre o que o arquivo
 * declara.
 */
const indices = import.meta.glob<string>('./*/index.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Slugs que o glob acima NÃO alcança e que o repositório aceita.
 *
 * Vazia hoje, e a linha existe para que ela continue sendo uma DECLARAÇÃO. A
 * alternativa — pular quieto o slug que não tem índice — é a forma exata do
 * portão que encolhe sozinho, e esta suíte já perdeu 28 testes assim.
 */
const SLUGS_SEM_INDICE = new Set<string>([]);

/** O que o índice de uma peça exporta, lido da declaração. */
function exportedBy(slug: string): Set<string> | null {
  const texto = indices[`./${slug}/index.ts`];
  if (texto === undefined) return null;

  const nomes = new Set<string>();
  for (const m of texto.matchAll(
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|let|var|class|function|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    nomes.add(m[1]!);
  }
  // `export { default as A }`, `export { B as C }` e `export type { D }` — o
  // nome que vale é o de fora, e o `type` entre a palavra e a chave precisa
  // entrar no casamento: quase metade dos índices desta stack reexporta tipo
  // assim, e um `export\s*\{` puro os perderia inteiros.
  for (const m of texto.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const parte of m[1]!.split(',')) {
      const nome = parte.trim().split(/\s+as\s+/).pop()?.trim().replace(/^type\s+/, '');
      if (nome) nomes.add(nome);
    }
  }
  return nomes;
}

/**
 * Os `import { … } from '@/components/ui/<slug>'` que o snippet ENSINA.
 *
 * `import type` conta, e deixá-lo de fora seria o pior tipo de silêncio: o
 * snippet passaria por PULADO, e não por conferido. `import\s*\{` não casa com o
 * `type` que vem entre a palavra e a chave, e o `type` também aparece por nome
 * (`import { type Foo }`) — os dois são descascados.
 */
function designSystemImports(texto: string): Array<{ slug: string; nomes: string[] }> {
  const saida: Array<{ slug: string; nomes: string[] }> = [];
  for (const m of texto.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*'@\/components\/ui\/([a-z0-9-]+)'/g,
  )) {
    saida.push({
      slug: m[2]!,
      nomes: m[1]!
        .split(',')
        .map((nome) => nome.trim().split(/\s+as\s+/)[0]!.trim().replace(/^type\s+/, ''))
        .filter(Boolean),
    });
  }
  return saida;
}

/**
 * O que o snippet manda importar do design system e a peça não exporta.
 *
 * POR QUE ESTE CHECK EXISTE. É a promessa que Angular, React e Vanilla já
 * cobravam e esta stack não: todo nome que o snippet ensina a importar de
 * `@/components/ui/<slug>` tem de existir mesmo lá, ou quem copia recebe um
 * import que não resolve. Nada aqui compila — o snippet é texto —, então
 * nenhum dos três portões da stack tem como reclamar.
 *
 * O QUE ELE NÃO VÊ:
 *
 *  · LISTA DE NOMES INTERPOLADA. `alert-dialog` monta o import com
 *    `` `import {\n${nomes.map(…)}\n} from '…'` ``, e o `${…}` sai do texto
 *    publicado: o que sobra é uma declaração de chaves vazias, e ela passa sem
 *    conferir nada. Onze módulos montam o import assim;
 *  · import de fora do design system — `vue`, `lucide-vue-next`,
 *    `@shared/primitives/*`. O índice deles não é deste repositório, e conferir
 *    exigiria resolver pacote;
 *  · o que o snippet FAZ com o nome importado. Ele existe: se a prop passada
 *    existe é assunto do type-check, que não alcança texto.
 */
function importsWithoutExport(source: string): string[] {
  const texto = publishedText(source);
  const faltando: string[] = [];
  for (const { slug, nomes } of designSystemImports(texto)) {
    const exportados = exportedBy(slug);
    if (!exportados) {
      if (SLUGS_SEM_INDICE.has(slug)) continue;
      faltando.push(`um nome de ${slug}, cujo índice não chegou à varredura`);
      continue;
    }
    for (const nome of nomes) {
      if (!exportados.has(nome)) faltando.push(`${nome} (de ${slug})`);
    }
  }
  return faltando;
}

describe('transforms do painel Code', () => {
  it('existe pelo menos um módulo de source por varredura', () => {
    expect(caminhos.length).toBeGreaterThan(0);
  });

  for (const caminho of caminhos) {
    const modulo = modulos[caminho];
    const exportadas = Object.entries(modulo).filter(
      ([, value]) => typeof value === 'function',
    ) as Array<[string, (...args: never[]) => unknown]>;

    describe(caminho, () => {
      it('exporta ao menos uma transform', () => {
        expect(exportadas.length).toBeGreaterThan(0);
      });

      // Vale para TODOS os ramos, e não só para o que os args padrão produzem.
      it('nenhum ramo itera lista que o snippet não declara', () => {
        const bruto = fontes[caminho];
        // O glob de texto tem de alcançar o mesmo módulo que o de execução.
        // Pular quieto o que ele não achasse seria encolher a varredura sem
        // ninguém ver — que é exatamente como esta suíte já perdeu 28 testes.
        expect(bruto, `${caminho}: o glob de texto não alcançou o módulo`).toBeTypeOf('string');
        const soltos = loopsWithoutSource(bruto!);
        expect(
          soltos,
          `${caminho}: algum ramo do snippet itera ${soltos.join(', ')}, que o próprio snippet não declara — quem copiar aquele ramo recebe um laço sobre um nome que não existe`,
        ).toEqual([]);
      });

      // Também vale para TODOS os ramos: a passagem que executa chama cada
      // construtor uma vez, com os args padrão, e ligação que só existe noutro
      // ramo passaria por ela sem ser vista.
      it('nenhum ramo liga nome que o snippet não declara', () => {
        const bruto = fontes[caminho];
        expect(bruto, `${caminho}: o glob de texto não alcançou o módulo`).toBeTypeOf('string');
        const soltos = bindingsWithoutDeclaration(bruto!);
        expect(
          soltos,
          `${caminho}: algum ramo do snippet liga ${soltos.join(', ')}, que o próprio snippet não declara — quem copiar aquele ramo recebe uma prop ou um ouvinte sobre um nome que não existe`,
        ).toEqual([]);
      });

      it('nenhum ramo importa nome que a peça não exporta', () => {
        const bruto = fontes[caminho];
        expect(bruto, `${caminho}: o glob de texto não alcançou o módulo`).toBeTypeOf('string');
        const faltando = importsWithoutExport(bruto!);
        expect(
          faltando,
          `${caminho}: o snippet ensina a importar ${faltando.join(', ')} — quem copiar recebe um import que não resolve`,
        ).toEqual([]);
      });

      // Só os CONSTRUTORES de snippet — `*Source` (transform de meta ou de story)
      // e `*Snippet` (forma reutilizável). A primeira versão media todo export e
      // reprovava helper de atributo (`attrRatio`, `attrChecked`,
      // `attrLinhas`), que devolve um pedaço de atributo e não um snippet. Não é
      // buraco: o que o painel mostra é a saída dos construtores, e ela já
      // carrega o que qualquer helper produziu.
      const construtores = exportadas.filter(([name]) => /(?:Source|Snippet)$/.test(name));

      // O filtro acima EXCLUI em silêncio, e silêncio aqui custou 28 testes: a
      // tradução dos identificadores moveu o sufixo para o meio do nome
      // (`buttonParDeAcoesSource` -> `actionsSourceButtonPair`), o export saiu
      // da varredura e a suíte seguiu verde medindo menos. Nenhum dos três
      // portões podia pegar — o nome estava consistente na declaração e em todo
      // uso, então `lint`, `build` e `build-storybook` não tinham do que
      // reclamar. Contagem gerada some sem deixar rastro; quem não é construtor
      // precisa se declarar.
      it('todo export é construtor de snippet ou helper declarado', () => {
        const outside = Object.keys(modulo).filter(
          (name) => !/(?:Source|Snippet)$/.test(name) && !HELPERS.has(name),
        );
        expect(
          outside,
          `${caminho}: export fora da convenção — termine em Source/Snippet, ou declare em HELPERS se não constrói snippet`,
        ).toEqual([]);
      });

      for (const [name, fn] of construtores) {
        it(`${name} devolve um snippet honesto`, () => {
          const saida = fn();
          expect(typeof saida, `${name} deve devolver string sem receber args`).toBe('string');
          const text = saida as string;
          expect(text.trim().length).toBeGreaterThan(0);
          // O andaime da story não é parte do design system.
          expect(text).not.toMatch(SCAFFOLD);
          // Docs de cada stack são consumidas isoladamente.
          expect(text).not.toMatch(OTHER_STACK);
          // `reka-ui` é a lib headless por baixo; o leitor importa do design
          // system, nunca dela.
          expect(text).not.toContain('reka-ui');
          // Sobra de template literal mal fechado, ou control não-string
          // interpolado direto (o espião de ação, o control de objeto).
          // `undefined` só é defeito quando é ARTEFATO de interpolação: um
          // valor que não chegou e virou texto no atributo, na prop ou no item
          // de objeto. Como valor de retorno — `() => undefined` — é código
          // legítimo que o snippet ensina, e proibi-lo por substring fazia a
          // guarda reprovar o que ela existe para proteger.
          expect(text).not.toMatch(
            /="undefined"|:\s*undefined\s*[,}\n]|\{undefined\}|>undefined</,
          );
          expect(text).not.toContain('[object Object]');
          expect(text).not.toMatch(/\bfunction\s*\(/);
          expect(text).not.toContain('=> void 0');
          // Inline vence a folha: a declaração sai do tema, da densidade e da
          // escala tipográfica — e é o markup que o leitor copia.
          expect(designStyles(text), `${name}: use classe .nds-* ou token`).toEqual([]);
        });
      }
    });
  }
});
