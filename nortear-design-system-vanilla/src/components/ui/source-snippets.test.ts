/**
 * Guarda transversal das transforms do painel Code.
 *
 * Cada `*.source.ts` exporta funções que constroem o trecho copiável de uma
 * story. É isso que permite varrer todas de uma vez e cobrar o que vale para a
 * stack inteira: o snippet ensina o design system, não o andaime da story.
 *
 * POR QUE ESTE ARQUIVO CHEGOU ATRASADO. React, Vue, Svelte e Angular tinham a
 * guarda; esta stack, não — e ela é a REFERÊNCIA cross-stack: um snippet errado
 * aqui é o que as outras quatro espelham. O que existia por aqui eram os
 * `<slug>.source.test.ts`, um por componente, que cobram o CONTEÚDO de cada
 * snippet (mostra a variante? omite o padrão?), e o `story-source-wiring`, que
 * cobra a FIAÇÃO do `meta`. Nenhum dos dois varre o conjunto, então nada
 * cobrava o que só se vê olhando as setenta de uma vez — e a saída do painel
 * não chega ao DOM durante a `play`, de modo que nenhuma suíte de navegador a
 * alcança.
 *
 * A checagem de ORIGEM é a que muda de forma entre as stacks. Onde há JSX, o
 * guarda cobra que toda tag de inicial maiúscula esteja importada; no Angular,
 * que todo binding do template seja membro da classe. Aqui o snippet é CHAMADA
 * DE FÁBRICA — ele ensina `import { createX } from '@/components/ui/<slug>'` e
 * depois `createX({ … })` —, então a promessa tem dois lados, e este arquivo
 * cobra os dois:
 *
 * 1. todo nome que o snippet manda importar existe mesmo no módulo daquele
 *    componente;
 * 2. toda fábrica do design system que o snippet CHAMA está entre as que ele
 *    importa.
 *
 * Sem o segundo, um snippet que chama `createButton()` sem importá-lo passa: o
 * import declarado está correto, o uso é que não podia ser aquele. É o mesmo
 * buraco que o Angular tinha antes da checagem de binding.
 *
 * A terceira é irmã das duas, e nasceu de um defeito real: toda interpolação do
 * snippet tem de referenciar nome que o PRÓPRIO snippet liga. O snippet dos
 * ícones das abas emitia
 * `abas.querySelector(\`[role="tab"][data-value="${valor}"]\`)` com a variável
 * do `forEach` chamada `valor` e a interpolação escrita `value` — as duas
 * checagens de import passavam, porque o import estava certo, e quem copiasse
 * recebia um `ReferenceError`.
 */
import { describe, expect, it } from 'vitest';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });

const caminhos = Object.keys(modulos).sort();

/**
 * O TEXTO dos módulos desta pasta, para saber o que cada um declara.
 *
 * Lido como texto, e não importado: a pergunta é sobre o que o arquivo
 * DECLARA, e para isso não é preciso executar nada — nem arrastar o efeito
 * colateral de importar setenta módulos de componente só para ler um nome.
 */
const fontes = import.meta.glob<string>('./*.ts', { query: '?raw', import: 'default', eager: true });

/** `./combobox.source.ts` -> `combobox`. */
const slugDoCaminho = (caminho: string) => caminho.replace(/^\.\//, '').replace(/\.source\.ts$/, '');

/** O que um módulo desta pasta exporta, lido da declaração. */
function exportadosPor(slug: string): Set<string> | null {
  const texto = fontes[`./${slug}.ts`];
  if (texto === undefined) return null;

  const nomes = new Set<string>();
  for (const m of texto.matchAll(
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:const|let|var|class|function|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    nomes.add(m[1]);
  }
  // `export { A, B as C }` — o nome que vale é o de fora.
  for (const m of texto.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const parte of m[1].split(',')) {
      const nome = parte.trim().split(/\s+as\s+/).pop()?.trim();
      if (nome) nomes.add(nome.replace(/^type\s+/, ''));
    }
  }
  return nomes;
}

/**
 * Tudo que o design system publica desta pasta, num conjunto só.
 *
 * É o que separa "fábrica do design system chamada sem import" de qualquer
 * outra chamada do snippet: `document.createElement` é do navegador,
 * `createButton` é nosso. Um nome que ninguém aqui publica não é assunto desta
 * guarda.
 */
const publicadosPeloDesignSystem = new Set<string>();
for (const caminho of Object.keys(fontes)) {
  if (/\.(source|test|stories|fixtures|play-helpers)\.ts$/.test(caminho)) continue;
  for (const nome of exportadosPor(caminho.replace(/^\.\//, '').replace(/\.ts$/, '')) ?? []) {
    publicadosPeloDesignSystem.add(nome);
  }
}

/**
 * Nome de andaime — o invólucro que existe só dentro do arquivo de story.
 *
 * `wrapper` está na lista nas cinco stacks, e AQUI ele tem um homônimo
 * legítimo: `createTable()` devolve `{ wrapper, table }`, e o snippet da tabela
 * desestrutura os dois porque é o wrapper que rola na horizontal e recebe o
 * foco. Sete snippets corretos eram acusados por isso. O que resolve sem tirar
 * os dentes da regra é confrontar com o módulo do próprio componente: palavra
 * que o componente usa é API, palavra que só o snippet conhece é andaime.
 */
const SCAFFOLD = /\b[A-Z][A-Za-z0-9]*Story\b|\bwrapper\b|\bcaso\b/g;

/**
 * Regra do repositório: nada de nome de outra stack no que o leitor vê.
 *
 * Conferida FORA dos literais de texto, e essa distinção não é cosmética: o
 * badge de exemplo tem por rótulo o nome de uma tecnologia — `'React'` —, e
 * isso vem do conteúdo compartilhado (`tagLabel` em
 * `docs/shared/content/badge`), igual nas cinco stacks. Rótulo entre aspas é
 * CONTEÚDO; o que a regra existe para pegar é o vazamento de código ou de
 * comentário de outra stack, e esse nunca está dentro de um literal. Os
 * especificadores de módulo são conferidos à parte, porque também são citados.
 */
const OTHER_STACK = /\b(React|Vue|Svelte|Angular)\b|reka-ui|base-ui|bits-ui|radix/i;

/** Apaga literais de texto, preservando o comprimento do resto da linha. */
const semLiterais = (texto: string) =>
  texto.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");

/**
 * `undefined` que VAZOU, e não `undefined` escrito de propósito.
 *
 * Nas stacks em que o snippet é marcação, a palavra é sempre defeito e a regra
 * larga funciona. Aqui o snippet é TypeScript que roda, e `undefined` é valor
 * legítimo: `createTableHead(coluna, ehUltima ? 'nds-text-right' : undefined)`
 * é como se omite uma classe opcional. Proibir a palavra inteira acusava os
 * sete snippets da tabela.
 *
 * O que resta são as duas formas em que ela só chega por interpolação que não
 * veio: dentro de um literal de texto, e como valor inteiro de uma opção.
 */
const UNDEFINED_EM_TEXTO = /'[^'\n]*undefined[^'\n]*'|"[^"\n]*undefined[^"\n]*"/;
const UNDEFINED_EM_OPCAO = /^\s*'?[\w$-]+'?:\s*undefined\s*,?\s*$/m;

/**
 * Exports que legitimamente NÃO constroem snippet.
 *
 * Lista fechada de propósito. Acrescentar um nome aqui é declarar a exceção;
 * deixar de fora é reprovar — que é o que dá dentes à convenção. Foi essa
 * convenção que pegou, no React, uma fábrica curried devolvendo função em vez
 * de string: com ela, as checagens que leem o snippet nunca chegavam ao
 * snippet.
 */
const HELPERS = new Set<string>([
  // Devolve a EXPRESSÃO da proporção (`16 / 9`), um pedaço de linha, não um
  // trecho copiável. Mesmo papel do `ratioExpr` do React.
  'ratioExpressao',
  // A data que o calendário usa nos exemplos. É DADO, e mora no módulo de
  // snippet porque é ele que precisa do valor como texto.
  'DATA_DE_EXEMPLO',
]);

/**
 * A convenção de nome desta stack, e por que ela não é ancorada.
 *
 * A regra cross-stack é "termine em `Source` ou `Snippet`". Aqui a tradução dos
 * identificadores moveu o sufixo para o MEIO — `buttonSourceWith`,
 * `actionsSourceWithButtonPair`, `progressSourceAnimado` —, e ancorar no fim
 * acusaria 112 nomes corretos. O que a convenção precisa garantir é que o nome
 * se declare como construtor de snippet; o qualificador que vem depois é a
 * variação da story.
 */
const CONVENCAO = /(?:Source|Snippet)(?:[A-Z][\w$]*)?$/;

/**
 * Os `import { … } from '@/components/ui/<slug>'` que o snippet ensina.
 *
 * `import type` conta: um snippet pode ensinar o tipo das opções, e deixá-lo de
 * fora faria a checagem PULAR o snippet em vez de verificá-lo — o modo de
 * falhar que este repositório já pagou caro duas vezes.
 */
function importesDoDesignSystem(texto: string): Array<{ slug: string; nomes: string[] }> {
  const saida: Array<{ slug: string; nomes: string[] }> = [];
  for (const m of texto.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*'@\/components\/ui\/([a-z0-9-]+)'/g,
  )) {
    saida.push({
      slug: m[2],
      nomes: m[1]
        .split(',')
        .map((n) => n.trim().split(/\s+as\s+/)[0].trim().replace(/^type\s+/, ''))
        .filter(Boolean),
    });
  }
  return saida;
}

/** Todo nome que o snippet liga por `import`, venha de onde vier. */
function importadosNo(texto: string): Set<string> {
  const nomes = new Set<string>();
  for (const m of texto.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from/g)) {
    for (const parte of m[1].split(',')) {
      const nome = parte.trim().split(/\s+as\s+/).pop()?.trim().replace(/^type\s+/, '');
      if (nome) nomes.add(nome);
    }
  }
  // `import DOMPurify from 'dompurify'` e `import * as x from '…'`.
  for (const m of texto.matchAll(/import\s+(?:\*\s+as\s+)?([A-Za-z_$][\w$]*)\s*(?:,|from)/g)) {
    nomes.add(m[1]);
  }
  return nomes;
}

/** Nomes que o próprio snippet declara — função, const, let, class. */
function declaradosNo(texto: string): Set<string> {
  const nomes = new Set<string>();
  for (const m of texto.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) {
    nomes.add(m[1]);
  }
  return nomes;
}

/** Especificadores de módulo citados pelo snippet. */
function modulosCitadosEm(texto: string): string[] {
  return [...texto.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
}

/**
 * Fábricas do design system que o snippet CHAMA sem ter declarado a origem.
 *
 * Só chamada de identificador SOLTO conta: `document.createElement(…)` vem
 * depois de um ponto e é do navegador, não daqui. E só entra o nome que esta
 * pasta publica — o que ninguém aqui exporta não é promessa que este arquivo
 * possa cobrar.
 */
function chamadasSemOrigem(texto: string): string[] {
  const importados = importadosNo(texto);
  const locais = declaradosNo(texto);
  const soltas = new Set<string>();
  for (const m of texto.matchAll(/(?:^|[^.\w$'"`])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const nome = m[1];
    if (importados.has(nome) || locais.has(nome)) continue;
    if (!publicadosPeloDesignSystem.has(nome)) continue;
    soltas.add(nome);
  }
  return [...soltas].sort();
}

/**
 * Nomes que existem sem ninguém declarar: navegador, linguagem e palavra-chave.
 *
 * Lista fechada de propósito, como as outras: o que não está aqui e o snippet
 * não liga é acusado, porque o silêncio é o modo de falhar que este check
 * existe para fechar.
 */
const GLOBAIS = new Set([
  'document', 'window', 'globalThis', 'console', 'Math', 'JSON', 'String', 'Number',
  'Boolean', 'Array', 'Object', 'Date', 'Promise', 'Map', 'Set', 'WeakMap', 'Intl',
  'RegExp', 'Error', 'URL', 'URLSearchParams', 'AbortController', 'CSS', 'Image',
  'FormData', 'File', 'Blob', 'navigator', 'location', 'fetch', 'setTimeout',
  'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame',
  'crypto', 'performance', 'structuredClone', 'this', 'true', 'false', 'null',
  'undefined', 'new', 'typeof', 'await', 'Infinity', 'NaN', 'MutationObserver',
  'IntersectionObserver', 'ResizeObserver', 'CustomEvent', 'Event', 'KeyboardEvent',
  'HTMLElement', 'Node', 'NodeList', 'DOMPurify',
]);

/**
 * Todo nome que o snippet LIGA — declaração, desestruturação, parâmetro, import.
 *
 * Parâmetro desestruturado foi o que essa varredura mais errou ao nascer:
 * `.forEach(([valor, icone]) => …)` e `.forEach(({ value, text }) => …)` vinham
 * com o `(` e o `[` colados no primeiro nome, e três snippets corretos eram
 * acusados. Descascar a pontuação de abertura antes de ler o identificador
 * resolve os dois casos, e é por isso que `cru` existe em vez de um regex por
 * forma.
 */
function escopoDo(texto: string): Set<string> {
  const nomes = new Set<string>();
  const cru = (lista: string) => {
    for (const parte of lista.split(',')) {
      // Valor padrão (`a = 1`) fica à direita do `=`; renomeação (`a: b`) liga
      // o da direita do `:`. Os dois se resolvem antes de ler o identificador.
      const limpo = parte.split('=')[0].split(':').pop()!.trim().replace(/^[([{\s.]+/, '');
      const id = /^([A-Za-z_$][\w$]*)/.exec(limpo)?.[1];
      if (id) nomes.add(id);
    }
  };
  for (const m of texto.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g)) {
    nomes.add(m[1]);
  }
  // `const { a, b: c } = …` e `const [a, b] = …`
  for (const m of texto.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) cru(m[1]);
  // Parâmetro de arrow, com ou sem desestruturação.
  for (const m of texto.matchAll(/\(\s*[{[]?([^)]*?)[}\]]?\s*\)\s*=>/g)) cru(m[1]);
  for (const m of texto.matchAll(/(?:^|[^\w$.)])([A-Za-z_$][\w$]*)\s*=>/gm)) nomes.add(m[1]);
  // Parâmetro de função nomeada ou anônima.
  for (const m of texto.matchAll(/function\s*[A-Za-z_$\w]*\s*\(\s*[{[]?([^)]*?)[}\]]?\s*\)/g)) {
    cru(m[1]);
  }
  // `for (const x of …)` e `for (const [k, v] of …)`
  for (const m of texto.matchAll(/for\s*\(\s*(?:const|let|var)\s*[{[]?([^)]*?)[}\]]?\s+(?:of|in)\s/g)) {
    cru(m[1]);
  }
  for (const m of texto.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) nomes.add(m[1]);
  for (const nome of importadosNo(texto)) nomes.add(nome);
  return nomes;
}

/**
 * Interpolações do snippet cuja RAIZ ninguém liga.
 *
 * Só a raiz é conferida: em `${usuario.nome}` quem precisa existir é `usuario`,
 * e o que vem depois do ponto é do objeto, não do escopo.
 */
function interpolacoesSemOrigem(texto: string): string[] {
  const escopo = escopoDo(texto);
  const soltas = new Set<string>();
  for (const m of texto.matchAll(/\$\{([^}]*)\}/g)) {
    const raiz = /^\s*([A-Za-z_$][\w$]*)/.exec(m[1])?.[1];
    if (!raiz || escopo.has(raiz) || GLOBAIS.has(raiz)) continue;
    soltas.add(raiz);
  }
  return [...soltas].sort();
}

/** Comentário não é código publicado, e prosa em crase não é snippet. */
function semComentarios(bruto: string): string {
  return bruto
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .map((linha) => linha.replace(/(^|[^:])\/\/.*$/, '$1'))
    .join('\n');
}

/**
 * Todo nome que o TEXTO do módulo liga, em qualquer ramo.
 *
 * Irmã de `escopoDo`, e separada dela de propósito: aquela lê o SNIPPET e
 * resolve `{ a: b }` pegando o lado direito do `:`. Aqui o alvo é TypeScript,
 * onde `:` também introduz anotação de tipo —
 * `function corpo(items: Item[], o: Opts = {})` faria `escopoDo` ligar `Item` e
 * esquecer `items`. Medido: reaproveitá-la acusava dez módulos CORRETOS de uma
 * vez, oito deles só por parâmetro tipado. Os dois lados do `:` entram, porque
 * ligar demais só tira sensibilidade, enquanto ligar de menos inventa defeito.
 *
 * E ela também serve ao SNIPPET, em `referenciasSemOrigem`: a premissa de que o
 * trecho publicado é JavaScript sem tipos não se sustentou na medição — o
 * breadcrumb publica `(text: string, href: string) =>` e o filtro do combobox,
 * `(item: ComboboxItem, query: string) =>`. Com `escopoDo`, esses parâmetros
 * ficavam de fora e viravam acusação.
 */
function ligadosNoTexto(texto: string): Set<string> {
  const nomes = new Set<string>();
  const cru = (lista: string) => {
    for (const parte of lista.split(',')) {
      for (const pedaco of parte.split('=')[0].split(':')) {
        const id = /^([A-Za-z_$][\w$]*)/.exec(pedaco.trim().replace(/^[([{\s.]+/, ''))?.[1];
        if (id) nomes.add(id);
      }
    }
  };
  for (const m of texto.matchAll(
    /(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    nomes.add(m[1]);
  }
  for (const m of texto.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) cru(m[1]);
  for (const m of texto.matchAll(/\(([^()]*)\)\s*(?::[^=]*)?=>/g)) cru(m[1]);
  for (const m of texto.matchAll(/(?:^|[^\w$.)])([A-Za-z_$][\w$]*)\s*=>/gm)) nomes.add(m[1]);
  for (const m of texto.matchAll(/function\s*[A-Za-z_$\w]*\s*\(([\s\S]*?)\)\s*[:{]/g)) cru(m[1]);
  for (const m of texto.matchAll(/for\s*\(\s*(?:const|let|var)\s*[{[]?([^)]*?)[}\]]?\s+(?:of|in)\s/g)) {
    cru(m[1]);
  }
  for (const m of texto.matchAll(/catch\s*\(\s*([A-Za-z_$][\w$]*)/g)) nomes.add(m[1]);
  for (const nome of importadosNo(texto)) nomes.add(nome);
  // `importing('slug', 'A', 'B')` — a linha de import que o snippet PUBLICA não
  // existe como `import` no texto; ela é montada, e os nomes chegam citados.
  for (const m of texto.matchAll(/importing\w*\s*\(([\s\S]*?)\)/g)) {
    for (const parte of m[1].split(',').slice(1)) {
      const nome = /'([A-Za-z_$][\w$]*)'/.exec(parte)?.[1];
      if (nome) nomes.add(nome);
    }
  }
  return nomes;
}

/** Os métodos que percorrem uma lista — o `.map` do laço, não o `.map` do Map. */
const METODOS_DE_LACO = /^(?:map|forEach|flatMap)$/;

/**
 * Laços que o snippet publica sobre um nome que ninguém liga — em TODOS os ramos.
 *
 * POR QUE UMA SEGUNDA PASSAGEM EXISTE. A primeira chama cada construtor UMA
 * vez, com os args padrão, e analisa o que sai. Medido em 2026-09-03: 79 dos 82
 * módulos desta stack mudam a forma do snippet conforme o argumento — a maior
 * proporção das cinco —, então o que os outros ramos publicam não tinha portão
 * nenhum. Declarar caso por caso custaria centenas de arquivos e cada
 * esquecimento voltaria a ser silêncio; ler o TEXTO vê todos os ramos de uma
 * vez, ao custo de uma passagem por stack.
 *
 * A FORMA CONFERIDA É O LAÇO, e nesta stack ele tem duas: `for (const x of y)`
 * e `y.map(…)` / `y.forEach(…)` / `y.flatMap(…)`. Aqui não há template de
 * framework — o snippet é JavaScript que roda —, então "declarado" quer dizer
 * declarado, importado ou recebido DENTRO do próprio trecho que o leitor copia.
 *
 * O QUE ELA ACHOU AO NASCER: três snippets ensinavam a percorrer uma lista que
 * eles nunca declaram — `trabalhos` no `job-progress`, `sequencia` no
 * `terminal-block` e `medicoes` no `context-display`. Os três explicavam no
 * comentário que a lista é de quem consome, e isso continua verdade; o que não
 * seguia era deixá-la sem forma na tela, quando todos os outros módulos
 * escrevem os dados de exemplo à vista (o `DATA` do `table`, os blocos do
 * `chart`, o `citacoes` do `inline-citation`). Declará-la custa quatro linhas e
 * é o que faz o trecho rodar quando alguém o cola.
 *
 * O QUE ELA NÃO VÊ, e por isso a passagem que EXECUTA continua:
 *
 *  · o que estiver dentro de `${…}`: apagado antes da varredura, porque ali o
 *    nome é do CONSTRUTOR e não do snippet. Laço cuja fonte é interpolada sai
 *    desta medição — em troca, ela não inventa membro faltando em todo módulo;
 *  · nome declarado no ramo ERRADO: iterado no ramo A e declarado só no B. O
 *    texto é lido inteiro, então os dois ramos entram no mesmo conjunto. É o
 *    caso do `citacoes` do `inline-citation`, declarado em um dos três exports
 *    que o iteram — e é mais raro que o que isto passa a pegar;
 *  · raiz de cadeia: `a.b.map(…)` não é conferido, só `a.map(…)`. O ponto antes
 *    do nome é o que separa `document.createElement` do que é nosso, e afrouxar
 *    isso traria de volta os falsos positivos que a primeira versão despejou;
 *  · laço contado (`for (let i = 0; i < 3; i++)`) não tem fonte para conferir;
 *  · comentário: apagado antes de tudo. Prosa em crase dentro de um docblock já
 *    virou "texto publicado" numa versão anterior, e um nome que só existia na
 *    explicação virou achado.
 */
function lacosSemOrigemNoTexto(bruto: string): string[] {
  const semCom = semComentarios(bruto);
  const ligados = ligadosNoTexto(semCom);
  // `${…}` sai DEPOIS de colher o escopo e antes de procurar laço: o que está
  // lá dentro é do construtor, e contá-lo inventaria nome faltando em todo
  // módulo que interpola.
  const texto = semCom.replace(/\$\{[^}]*\}/g, '');

  const soltos = new Set<string>();
  const registra = (nome: string) => {
    if (ligados.has(nome) || GLOBAIS.has(nome)) return;
    soltos.add(nome);
  };
  for (const m of texto.matchAll(/for\s*\(\s*(?:const|let|var)\s+[^)]*?\s+of\s+([A-Za-z_$][\w$]*)/g)) {
    registra(m[1]);
  }
  for (const m of texto.matchAll(/(?:^|[^.\w$'"`])([A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (METODOS_DE_LACO.test(m[2])) registra(m[1]);
  }
  return [...soltos].sort();
}

/**
 * Constante em CAIXA_ALTA — o nome que NUNCA é espaço em branco de quem lê.
 *
 * Ver `referenciasSemOrigem`: é este formato que separa a constante vazada do
 * marcador que o snippet oferece de propósito.
 */
const CONSTANTE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

/**
 * Apaga do snippet tudo que não é expressão — na ORDEM em que se pode apagar.
 *
 * A ordem não é gosto, é o que mantém os pares fechados, e inverter qualquer
 * passo faz um módulo inteiro sair da varredura em silêncio:
 *
 *  1. comentário primeiro, senão prosa em crase dentro de um `//` vira código;
 *  2. crase, depois aspa, depois expressão regular — a crase é a única que
 *     admite as outras duas dentro de si, então ela tem de sair antes;
 *  3. bloco de CSS só DEPOIS dos literais, e ANCORADO no começo da linha.
 *     Medido: solto, o padrão de seletor casava `.textContent = \`Parágrafo
 *     ${i} …\`` como se `.textContent = …{i}` fosse uma regra, cortava no meio
 *     do literal e deixava uma crase órfã que engolia o resto do arquivo. Um
 *     snippet pode trazer CSS (o `activity-graph` ensina o vão da casa numa
 *     folha), e ali as palavras do token não são identificador de JavaScript.
 */
function semTextoNemFolha(texto: string): string {
  let corpo = semComentarios(texto);
  corpo = corpo.replace(/`(?:[^`\\]|\\.)*`/g, "''");
  corpo = corpo.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
  corpo = corpo.replace(/\/(?![/*])(?:\[[^\]\n]*\]|\\.|[^/\\\n[])+\/[dgimsuvy]*/g, '0');
  corpo = corpo.replace(/^[ \t]*[.#][\w-]+[^\n{]*\{[^{}]*\}/gm, ' ');
  // Chave de objeto literal e membro de interface não são referência: em
  // `{ input: 18000 }` quem existe é o valor. O separador vem antes do nome —
  // `{`, `,`, `;` ou a quebra de linha —, e é ele que distingue chave de ramo
  // de ternário, que vem depois de `?` ou de `:`.
  corpo = corpo.replace(/([{,;]\s*)[A-Za-z_$][\w$]*(\s*\??\s*:)/g, '$1$2');
  corpo = corpo.replace(/(\n\s*)[A-Za-z_$][\w$]*(\s*\??\s*:)/g, '$1$2');
  return corpo;
}

/**
 * Nomes que o snippet REFERENCIA sem ligar, fora da posição de chamada.
 *
 * É a pergunta do Angular — toda expressão referencia nome que o exemplo
 * declara? — traduzida para uma stack sem template. Lá a expressão só enxerga
 * membro de classe e a lista de lugares é fechada; aqui o snippet é JavaScript
 * que roda, então o lugar é qualquer posição de valor. `chamadasSemOrigem` já
 * cobre a posição de CHAMADA e `interpolacoesSemOrigem`, o `${…}`; o que
 * faltava era `parts: ALGUMA_COISA`, que não é nem uma nem outra.
 *
 * O QUE ELA DELIBERADAMENTE NÃO ACUSA, e o número que sustenta a exclusão.
 *
 * A varredura larga — todo identificador solto — foi implementada e MEDIDA
 * antes desta: 221 exports em 37 dos 82 módulos. Lidas, elas não são defeito,
 * são um idioma: o snippet desta stack oferece um marcador em minúscula para o
 * que é de quem consome — `rotulos` para o objeto de rótulos, `enviar`,
 * `irPara`, `handleAddon` para o que a página faz com o evento —, e o mesmo
 * idioma está no React (`labels={labels}`, `onSubmit={enviar}`). Trocar isso é
 * decisão de conteúdo das cinco stacks, e não de uma guarda de uma delas.
 *
 * Então a exclusão é NOMEADA e tem premissa conferível, em vez de ser uma lista
 * de 221 desculpas: só entram os dois formatos que nunca são marcador —
 *
 *  · CAIXA_ALTA_COM_SUBLINHADO, que ninguém escreve para dizer "ponha o seu
 *    aqui": é sempre uma constante que existe em algum módulo e chegou ao texto
 *    publicado sem a linha de import que a traz;
 *  · nome que ESTA PASTA publica, que é a mesma premissa de `chamadasSemOrigem`
 *    vista fora do parêntese. Hoje nenhum snippet cai aqui — e é justamente
 *    isso que dá dentes ao primeiro item: no dia em que o marcador deixar de
 *    ser palavra inventada e passar a ser um nome que o design system exporta,
 *    a exclusão não vale mais e o portão reprova.
 *
 * O QUE ELA NÃO VÊ:
 *
 *  · ramo não-padrão. Cada construtor é chamado UMA vez, com os args padrão, e
 *    para esta pergunta não existe a segunda passagem que `lacosSemOrigemNoTexto`
 *    faz sobre o texto — ali a fonte do laço aparece crua no módulo, aqui a
 *    constante aparece DENTRO de um literal citado, ao lado da linha de import
 *    que outro ramo emite. Uma passagem de texto veria as duas e passaria
 *    sempre: seria portão sem dentes, que é pior que portão nenhum;
 *  · nome em minúscula, pelo motivo medido acima;
 *  · o que estiver depois de um ponto: `document.createElement` é do navegador.
 */
function referenciasSemOrigem(texto: string): string[] {
  // O binder de TEXTO, e não o do snippet: `escopoDo` resolve `a: b` pegando o
  // lado direito do `:`, e o snippet desta stack nem sempre é JavaScript sem
  // tipos — `(text: string, href: string) =>` no breadcrumb, `(item:
  // ComboboxItem, query: string) =>` no filtro do combobox. Medido: com
  // `escopoDo`, esses parâmetros ficavam de fora e viravam acusação.
  const ligados = ligadosNoTexto(texto);
  const soltas = new Set<string>();
  for (const m of semTextoNemFolha(texto).matchAll(/(?:^|[^.\w$'"`])([A-Za-z_$][\w$]*)/g)) {
    const nome = m[1];
    if (!CONSTANTE.test(nome) && !publicadosPeloDesignSystem.has(nome)) continue;
    if (ligados.has(nome) || GLOBAIS.has(nome)) continue;
    soltas.add(nome);
  }
  return [...soltas].sort();
}

type Chamavel = (...args: never[]) => unknown;

/**
 * Argumentos canônicos dos construtores que EXIGEM dado.
 *
 * A maioria dos exports cai no padrão com `(undefined, {})` — construtor de
 * snippet recebe um objeto de opções com padrão, e transform recebe
 * `(gerado, ctx)`, de onde só sai `ctx.args`. Uma família não cabe nisso: a dos
 * snippets de LISTA (`toggleBarSnippet`, `tabsWithIconsSnippet`, …), que
 * recebem os itens por parâmetro posicional obrigatório porque a story é quem
 * tem os dados. Não é defeito — é a forma da API.
 *
 * Mas quem não pode ser chamado também não pode ser VERIFICADO, e portão que
 * exclui em silêncio é o defeito que este repositório já pagou duas vezes. Por
 * isso a exceção vem com o argumento junto: declarada aqui, a função continua
 * passando por todas as checagens. O que não estiver aqui e não puder ser
 * chamado REPROVA.
 */
const ARGUMENTOS: Record<string, readonly unknown[]> = {
  progressListaSnippet: [[{ value: 40, 'aria-label': 'Progresso do upload' }]],
  progressSourceLista: [[{ value: 40, 'aria-label': 'Progresso do upload' }]],
  radioGroupWithDescriptionSnippet: [
    [{ value: 'padrao', label: 'Padrão', description: 'Chega em cinco dias úteis.' }],
  ],
  radioGroupSourceDescription: [
    [{ value: 'padrao', label: 'Padrão', description: 'Chega em cinco dias úteis.' }],
  ],
  resizableNestedSnippet: [
    {
      externo: { direction: 'horizontal', 'aria-label': 'Divisor externo' },
      interno: { direction: 'vertical', 'aria-label': 'Divisor interno' },
      neighbour: { title: 'Painel ao lado' },
    },
  ],
  resizableSourceNested: [
    {
      externo: { direction: 'horizontal', 'aria-label': 'Divisor externo' },
      interno: { direction: 'vertical', 'aria-label': 'Divisor interno' },
      neighbour: { title: 'Painel ao lado' },
    },
  ],
  sonnerStackSnippet: [[{ type: 'success', title: 'Alterações salvas' }]],
  sonnerSourceStack: [[{ type: 'success', title: 'Alterações salvas' }]],
  switchPanelSnippet: [
    [{ id: 'novidades', label: 'Novidades', description: 'Avisos por e-mail.' }],
  ],
  switchSourcePanel: [
    [{ id: 'novidades', label: 'Novidades', description: 'Avisos por e-mail.' }],
  ],
  tabsWithIconsSnippet: [
    [{ value: 'profile', label: 'Perfil', content: 'Informações públicas.', icon: 'User' }],
  ],
  tabsSourceWithIcons: [
    [{ value: 'profile', label: 'Perfil', content: 'Informações públicas.', icon: 'User' }],
  ],
  tabsWithBadgeSnippet: [
    [{ value: 'inbox', label: 'Caixa', content: 'Mensagens novas.', badge: { text: '12' } }],
  ],
  tabsSourceWithBadge: [
    [{ value: 'inbox', label: 'Caixa', content: 'Mensagens novas.', badge: { text: '12' } }],
  ],
  toggleRowSnippet: [[{ label: 'Negrito', icon: 'Bold' }]],
  toggleSourceRow: [[{ label: 'Negrito', icon: 'Bold' }]],
  toggleBarSnippet: [[{ icon: 'Bold', 'aria-label': 'Negrito' }], 'Formatação'],
  toggleSourceBar: [[{ icon: 'Bold', 'aria-label': 'Negrito' }], 'Formatação'],
};

/**
 * Chama o export e chega ao snippet, atravessando a currificação.
 *
 * `(undefined, {})` é a invocação que serve às três formas desta stack: o
 * construtor com opções opcionais cai no seu padrão, a transform recebe um
 * `ctx` sem `args`, e a fábrica curried devolve a transform — que é chamada
 * mais uma vez. Sem esse segundo passo, as checagens que leem o snippet parariam
 * na função e nunca chegariam ao texto.
 */
function snippetDe(name: string, fn: Chamavel): string {
  const args = (ARGUMENTOS[name] ?? [undefined, {}]) as never[];
  const primeiro = fn(...args);
  const saida = typeof primeiro === 'function' ? (primeiro as Chamavel)(undefined as never, {} as never) : primeiro;
  return saida as string;
}

describe('transforms do painel Code', () => {
  it('existe pelo menos um módulo de source por varredura', () => {
    expect(caminhos.length).toBeGreaterThan(0);
  });

  for (const caminho of caminhos) {
    const modulo = modulos[caminho];
    const slug = slugDoCaminho(caminho);
    const fonteDoComponente = fontes[`./${slug}.ts`] ?? '';
    const exportadas = Object.entries(modulo).filter(
      ([name, value]) => typeof value === 'function' && !HELPERS.has(name),
    ) as Array<[string, Chamavel]>;

    describe(caminho, () => {
      it('exporta ao menos uma transform', () => {
        expect(exportadas.length).toBeGreaterThan(0);
      });

      // Vale para TODOS os ramos, e não só para o que os args padrão produzem.
      it('nenhum ramo publica laço sobre nome que o snippet não liga', () => {
        // O texto TEM de existir: `fontes` varre `./*.ts` e `caminhos` varre
        // `./**/*.source.ts`. Módulo em subpasta sairia da varredura sem uma
        // palavra, que é como um portão encolhe em silêncio — aqui ele reprova.
        const bruto = fontes[caminho];
        expect(
          typeof bruto,
          `${caminho}: o texto do módulo não foi alcançado pela varredura — mova-o para esta pasta ou amplie o glob de \`fontes\``,
        ).toBe('string');
        const soltos = lacosSemOrigemNoTexto(bruto);
        expect(
          soltos,
          `${caminho}: algum ramo do snippet itera ${soltos.join(', ')}, que ele não declara, ` +
            `importa nem recebe — quem copiar aquele ramo recebe um ReferenceError. ` +
            `A lista de exemplo é curta: declare-a no próprio snippet, à vista de quem lê.`,
        ).toEqual([]);
      });

      // Esta varredura não filtra por sufixo, então ela não perde teste quando
      // um nome sai da convenção — mas a convenção é cross-stack, e no Vue a
      // varredura FILTRA. Lá, a tradução dos identificadores moveu o sufixo
      // para o meio (`buttonParDeAcoesSource` -> `actionsSourceButtonPair`) e
      // apagou 28 testes com a suíte verde. Quem cobra a forma do nome é este
      // check.
      it('todo export é construtor de snippet ou helper declarado', () => {
        const fora = Object.keys(modulo).filter(
          (name) => !CONVENCAO.test(name) && !HELPERS.has(name),
        );
        expect(
          fora,
          `${caminho}: export fora da convenção — o nome tem de trazer Source/Snippet, ou ser declarado em HELPERS se não constrói snippet`,
        ).toEqual([]);
      });

      for (const [name, fn] of exportadas) {
        it(`${name} devolve um snippet honesto`, () => {
          let saida: unknown;
          try {
            saida = snippetDe(name, fn);
          } catch (erro) {
            throw new Error(
              `${name} não pôde ser chamado: ${(erro as Error).message}. ` +
                `Construtor que exige dado declara o argumento canônico em ARGUMENTOS — ` +
                `sem isso a guarda o excluiria em silêncio.`,
              { cause: erro },
            );
          }
          expect(typeof saida, `${name} deve devolver string`).toBe('string');
          const texto = saida as string;
          expect(texto.trim().length).toBeGreaterThan(0);

          // O andaime da story não é parte do design system — menos a palavra
          // que o próprio componente usa, que ali é API.
          const andaimes = [...texto.matchAll(SCAFFOLD)]
            .map((achado) => achado[0])
            .filter((palavra) => !new RegExp(`\\b${palavra}\\b`).test(fonteDoComponente));
          expect(andaimes, `${name}: nome de andaime de story no snippet publicado`).toEqual([]);

          // Docs de cada stack são consumidas isoladamente.
          const codigo = semLiterais(texto);
          expect(codigo, `${name}: nome de outra stack fora de literal`).not.toMatch(OTHER_STACK);
          for (const modulo of modulosCitadosEm(texto)) {
            expect(modulo, `${name}: import de outra stack`).not.toMatch(OTHER_STACK);
          }

          // Sobra de template literal mal fechado, ou de arg que não veio.
          expect(texto, `${name}: undefined dentro de um literal de texto`).not.toMatch(
            UNDEFINED_EM_TEXTO,
          );
          expect(texto, `${name}: opção com valor undefined`).not.toMatch(UNDEFINED_EM_OPCAO);
          expect(texto).not.toContain('[object Object]');
          expect(texto).not.toContain('NaN');
        });

        it(`${name} importa só o que o componente exporta`, () => {
          const texto = snippetDe(name, fn);
          const faltando: string[] = [];
          for (const { slug: alvo, nomes } of importesDoDesignSystem(texto)) {
            const exportados = exportadosPor(alvo);
            if (!exportados) {
              faltando.push(`o módulo ${alvo}`);
              continue;
            }
            for (const nome of nomes) {
              if (!exportados.has(nome)) faltando.push(`${nome} (de ${alvo})`);
            }
          }
          expect(
            faltando,
            `${name}: o snippet ensina a importar ${faltando.join(', ')} — quem copiar recebe um import que não resolve`,
          ).toEqual([]);
        });

        it(`${name} chama só fábrica que importou`, () => {
          const texto = snippetDe(name, fn);
          const soltas = chamadasSemOrigem(texto);
          expect(
            soltas,
            `${name}: o snippet chama ${soltas.join(', ')} sem importar — ` +
              `quem copiar recebe um ReferenceError na primeira linha que executa`,
          ).toEqual([]);
        });

        it(`${name} referencia só nome que o snippet liga`, () => {
          const texto = snippetDe(name, fn);
          const soltas = referenciasSemOrigem(texto);
          expect(
            soltas,
            `${name}: o snippet referencia ${soltas.join(', ')} sem ligar — ` +
              `constante de exemplo usada no corpo mas sem a linha de import que a ` +
              `traz, e quem copiar recebe um ReferenceError. Emita o import junto, ` +
              `como os outros ramos do mesmo módulo já fazem`,
          ).toEqual([]);
        });

        it(`${name} interpola só nome que o snippet liga`, () => {
          const texto = snippetDe(name, fn);
          const soltas = interpolacoesSemOrigem(texto);
          expect(
            soltas,
            `${name}: o snippet interpola ${soltas.join(', ')}, que ele não liga — ` +
              `foi assim que a variável do forEach se chamou \`valor\` e a ` +
              `interpolação, \`value\``,
          ).toEqual([]);
        });
      }
    });
  }
});
