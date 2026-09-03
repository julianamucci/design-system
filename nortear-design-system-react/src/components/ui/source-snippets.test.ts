/**
 * Guarda transversal das transforms do painel Code.
 *
 * O painel imprimia a árvore do `render` da story, que monta andaime existente
 * só no arquivo de story ou no módulo de fixtures. O snippet compilava na
 * cabeça de quem lia e falhava ao colar. E a saída do painel NÃO chega ao DOM
 * durante a `play`: nenhuma suíte de browser a alcança, que é por que o defeito
 * viveu tanto tempo sem nada acusar.
 *
 * Cada `*.source.ts` exporta funções chamáveis SEM argumento (os args da story
 * são opcionais e caem no padrão). É isso que permite varrer todas de uma vez e
 * cobrar o que vale para o repositório inteiro: o snippet ensina o design
 * system, não o andaime.
 *
 * As cinco checagens que não cabem em olho humano:
 *
 * 1. **Toda tag JSX de inicial maiúscula precisa ter origem.** Ou o snippet a
 *    importa, ou a declara. Não existe curadoria de nomes proibidos aqui — o
 *    que não tem origem é andaime por definição, hoje e nos componentes que
 *    ainda não existem.
 * 2. **Todo nome importado de `@/components/ui/<x>` precisa existir lá.** É a
 *    checagem que pega o snippet que ensina uma peça que o componente não
 *    exporta.
 * 3. **Espião de control não vaza.** O Storybook entrega `onX` como FUNÇÃO;
 *    interpolada, o corpo do mock aparece no painel como se fosse código do
 *    design system.
 *
 * As três acima CHAMAM cada construtor, uma vez, com os args padrão. Existem
 * outras DUAS que não chamam nada e leem o TEXTO do módulo —
 * `loopsWithoutOrigin` e `referencesWithoutOrigin`, no fim deste arquivo. Elas
 * existem porque as três primeiras só enxergam o ramo padrão, e 68 dos 82
 * módulos desta stack mudam a forma do snippet conforme o arg. As passagens se
 * complementam, e nenhuma substitui a outra.
 *
 * 4. **Nenhum ramo ITERA lista sem origem** — `algo.map(…)`.
 * 5. **Nenhum ramo REFERENCIA nome sem origem** numa expressão de atributo —
 *    `labels={rotulos}`, `steps={proposedSteps}`, `onAction={(i) => aplicar(i)}`.
 *    É o que o compilador do Angular obriga do outro lado, e a decisão de
 *    cobrar o manipulador em linha junto com o resto está escrita lá embaixo.
 */
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import pkg from '../../../package.json';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });
const caminhos = Object.keys(modulos).sort();

/** Fonte crua de cada `*.source.ts` — a segunda passagem LÊ o módulo, não o executa. */
const sourcesRaw = import.meta.glob<string>('./**/*.source.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/** Fonte crua dos primitivos, para saber o que cada um realmente exporta. */
const fontes = import.meta.glob<string>('./**/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/** Fonte crua dos arquivos de story, para cobrar a fiação do `meta`. */
const storiesRaw = Object.fromEntries(
  Object.entries(fontes).filter(([caminho]) => caminho.endsWith('.stories.tsx')),
);

/** Nomes exportados por `src/components/ui/<slug>.tsx`, por slug. */
const slugExportados = new Map<string, Set<string>>();
for (const [caminho, fonte] of Object.entries(fontes)) {
  if (caminho.endsWith('.stories.tsx') || caminho.endsWith('.fixtures.tsx')) continue;
  const slug = caminho.replace(/^\.\//, '').replace(/\.tsx$/, '');
  const names = new Set<string>();
  for (const [, name] of fonte.matchAll(/export\s+(?:async\s+)?(?:const|function|class|let)\s+([A-Za-z0-9_$]+)/g)) {
    names.add(name);
  }
  for (const [, name] of fonte.matchAll(/export\s+type\s+([A-Za-z0-9_$]+)/g)) names.add(name);
  for (const [, block] of fonte.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const parte of block.split(',')) {
      const name = parte.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name.replace(/^type\s+/, ''));
    }
  }
  slugExportados.set(slug, names);
}

/** Pacotes que um snippet pode citar: só o que o projeto realmente instala. */
const dependencias = new Set(Object.keys(pkg.dependencies ?? {}));

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OTHER_STACK = /\b(Vue|Svelte|Angular|Vanilla|reka-ui|bits-ui|@radix-ng|radix-vue)\b/i;

/**
 * Exports que legitimamente NÃO constroem snippet: helper de atributo, que
 * devolve um pedaço e não um trecho copiável.
 *
 * Lista fechada de propósito. Acrescentar um nome aqui é declarar a exceção;
 * deixar de fora é reprovar — que é o que dá dentes à convenção.
 */
const HELPERS = new Set([
  'ratioExpr',
  // Os IDs dos vídeos das demonstrações incorporadas. São DADO, e não
  // construtor de snippet: moram no módulo de snippet porque é ele que precisa
  // do valor como texto, e as fixtures os reexportam para o componente.
  // Declarados nos dois lugares, o painel Code ensinaria um vídeo e a
  // demonstração tocaria outro.
  'YOUTUBE_VIDEO_ID',
  'VIMEO_VIDEO_ID',
]);

/** `./combobox.source.ts` -> `combobox`, a chave de `slugExportados`. */
const slugDoCaminho = (caminho: string) =>
  caminho.replace(/^\.\//, '').replace(/\.source\.ts$/, '');

/** Andaime de story por forma do nome — pega o que ainda não foi escrito. */
const FORMA_SCAFFOLD =
  /\b(?:[A-Z][A-Za-z0-9]*(?:Story|Stories|Demo|Render|Preview|Fixture|Wrapper)|Demo[A-Z][A-Za-z0-9]*|Controlled[A-Z][A-Za-z0-9]*)\b/;

/** Tags nativas e pseudo-elementos que nunca precisam de origem. */
const TAGS_LIVRES = new Set(['Fragment', 'React', 'Suspense', 'StrictMode']);

/** Marcador plantado no corpo do espião: se aparecer na saída, vazou. */
const MARCA_SPY = 'ESPIAO_DE_CONTROL_VAZOU';

/**
 * Args com espião em toda prop de callback, como o Storybook os entrega.
 *
 * Só `onX` e `setX` viram função: qualquer coisa é o comportamento real do
 * runtime, e transformar TODO arg em função inventaria uma falha que o painel
 * não produz.
 */
function argsWithSpies(): Record<string, unknown> {
  const eCallback = (key: string | symbol) =>
    typeof key === 'string' && /^(on|set)[A-Z]/.test(key);
  return new Proxy({} as Record<string, unknown>, {
    get: (_alvo, key) =>
      eCallback(key) ? () => 'ESPIAO_DE_CONTROL_VAZOU' : undefined,
    has: (_alvo, key) => eCallback(key),
  });
}

/** Nomes que o snippet liga por `import`, e os módulos de onde vêm. */
function importesDo(snippet: string): { names: Set<string>; modulos: string[] } {
  const names = new Set<string>();
  const modulos: string[] = [];
  const re = /import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  for (const [, , clausula, modulo] of snippet.matchAll(re)) {
    modulos.push(modulo);
    const chaves = clausula.match(/\{([\s\S]*)\}/);
    if (chaves) {
      for (const parte of chaves[1].split(',')) {
        const name = parte.trim().split(/\s+as\s+/).pop()?.trim();
        if (name) names.add(name.replace(/^type\s+/, ''));
      }
    }
    const defaultOuNamespace = clausula.replace(/\{[\s\S]*\}/, '').replace(/^type\s+/, '');
    for (const parte of defaultOuNamespace.split(',')) {
      const name = parte.trim().replace(/^\*\s+as\s+/, '');
      if (name && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) names.add(name);
    }
  }
  return { names, modulos };
}

/** Nomes que o próprio snippet declara — função, const, let, class, parâmetro de map. */
function declaradosNo(snippet: string): Set<string> {
  const names = new Set<string>();
  for (const [, name] of snippet.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z0-9_$]+)/g)) {
    names.add(name);
  }
  return names;
}

/**
 * O que fica no lugar de `${…}` no texto publicado.
 *
 * É identificador válido de propósito: assim a expressão em volta continua
 * analisável. Todo nome que o CONTENHA vale como declarado — o nome de verdade
 * está no construtor, e esta varredura não o alcança.
 */
const MARCA_INTERPOLACAO = 'INTERPOLADO';

/** O que uma sequência de escape PUBLICA: `\n` é quebra de linha, não a letra n. */
function unescaped(c: string | undefined): string {
  if (c === 'n') return '\n';
  if (c === 't') return '\t';
  if (c === 'r') return '\r';
  return c ?? '';
}

/**
 * O TEXTO QUE O LEITOR COPIA, separado do código que o constrói.
 *
 * Ler o módulo por par de crases solto NÃO serve, e foi o primeiro falso achado
 * desta checagem: a crase também abre citação em docblock, e o docblock do
 * `table.source.ts` cita `INVOICES.map(...)` justamente para contar o defeito
 * que ele JÁ corrigiu. A prosa vinha lida como snippet publicado, e o portão
 * acusava o comentário que explica por que não há defeito.
 *
 * Então o corte é feito por varredura de caracteres, com três decisões:
 *
 *  · comentário de linha e de bloco NÃO entram — é onde mora a prosa;
 *  · literal de string entra junto do de template, porque metade dos módulos
 *    monta o corpo do snippet com `[...linhas].join('\n')`, e ali cada linha
 *    publicada é uma string entre aspas;
 *  · `${…}` não é lido: o que está lá dentro é nome do CONSTRUTOR, não do
 *    snippet, e contá-lo inventaria símbolo faltando em quase todo módulo. No
 *    lugar dele fica o marcador `INTERPOLADO`, e não um vazio, porque apagar a
 *    interpolação MUTILA a expressão em volta: `disabled={position === ${n}}`
 *    virava `disabled={position ===}`, que não é analisável, e a expressão
 *    inteira saía da varredura — cinco delas, medidas em 2026-09-03. Com o
 *    marcador a expressão fecha, `position` continua conferido, e o que veio da
 *    interpolação passa por declarado (é o único jeito honesto: o nome real
 *    mora no construtor).
 *
 * Literal de expressão regular também é reconhecido, e não por elegância: o
 * `code-block.source.ts` tem `.replace(/`/g, …)`, e um scanner que lesse aquela
 * crase como abertura de template engoliria o resto do arquivo — perdendo a
 * varredura em silêncio, que é o modo de falhar que este repositório já pagou
 * caro duas vezes.
 */
function publishedText(bruto: string): string {
  const BARRA = '\\';
  let saida = '';
  let i = 0;
  const n = bruto.length;
  // Último caractere significativo, que é o que distingue `/` de divisão do
  // `/` que abre expressão regular.
  let anterior = '\n';

  while (i < n) {
    const c = bruto[i]!;

    if (c === '/' && bruto[i + 1] !== '/' && bruto[i + 1] !== '*' && /[(,=:[!&|?{};+\n]/.test(anterior)) {
      i++;
      let classe = false;
      while (i < n) {
        if (bruto[i] === BARRA) { i += 2; continue; }
        if (bruto[i] === '[') classe = true;
        else if (bruto[i] === ']') classe = false;
        else if (bruto[i] === '/' && !classe) break;
        else if (bruto[i] === '\n') break;
        i++;
      }
      i++;
      anterior = '/';
      continue;
    }

    if (!/\s/.test(c)) anterior = c;

    if (c === '/' && bruto[i + 1] === '/') {
      while (i < n && bruto[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && bruto[i + 1] === '*') {
      i += 2;
      while (i < n && !(bruto[i] === '*' && bruto[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (c === "'" || c === '"') {
      const aspa = c;
      i++;
      while (i < n && bruto[i] !== aspa) {
        if (bruto[i] === BARRA) { saida += unescaped(bruto[i + 1]); i += 2; continue; }
        if (bruto[i] === '\n') break;
        saida += bruto[i];
        i++;
      }
      i++;
      saida += '\n';
      continue;
    }

    if (c === '`') {
      i++;
      while (i < n && bruto[i] !== '`') {
        if (bruto[i] === BARRA) { saida += unescaped(bruto[i + 1]); i += 2; continue; }
        if (bruto[i] === '$' && bruto[i + 1] === '{') {
          // A interpolação inteira sai, respeitando aninhamento de chave, de
          // aspas e de template dentro dela.
          let prof = 1;
          i += 2;
          while (i < n && prof > 0) {
            const d = bruto[i];
            if (d === '{') prof++;
            else if (d === '}') prof--;
            else if (d === '`') {
              i++;
              let interna = 0;
              while (i < n) {
                if (bruto[i] === BARRA) { i += 2; continue; }
                if (bruto[i] === '$' && bruto[i + 1] === '{') { interna++; i += 2; continue; }
                if (bruto[i] === '}' && interna > 0) { interna--; i++; continue; }
                if (bruto[i] === '`' && interna === 0) break;
                i++;
              }
            } else if (d === "'" || d === '"') {
              const a = d;
              i++;
              while (i < n && bruto[i] !== a) { if (bruto[i] === BARRA) i++; i++; }
            }
            i++;
          }
          saida += MARCA_INTERPOLACAO;
          continue;
        }
        saida += bruto[i];
        i++;
      }
      i++;
      saida += '\n';
      continue;
    }

    i++;
  }
  return saida;
}

/** Nomes que o TEXTO PUBLICADO declara ou importa — em qualquer ramo. */
function declaredIn(texto: string): Set<string> {
  const nomes = new Set<string>();
  for (const [, nome] of texto.matchAll(/(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    nomes.add(nome);
  }
  // Desestruturação: `const { a, b } = …` e `const [a, b] = …`.
  for (const [, bloco] of texto.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]\s*=/g)) {
    for (const parte of bloco.split(',')) {
      const nome = parte.trim().split(/[:=]/).pop()?.trim().replace(/^\.\.\./, '');
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) nomes.add(nome);
    }
  }
  for (const [, bloco] of texto.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const parte of bloco.split(',')) {
      const nome = parte.trim().split(/\s+as\s+/).pop()?.trim().replace(/^type\s+/, '');
      if (nome) nomes.add(nome);
    }
  }
  for (const [, nome] of texto.matchAll(/import\s+(?:\*\s+as\s+)?([A-Za-z_$][\w$]*)\s*(?:,|from)/g)) {
    nomes.add(nome);
  }
  // Parâmetro de arrow e de função declarada: `(item) => …` liga `item`.
  for (const [, lista] of texto.matchAll(/\(([^()]*)\)\s*=>/g)) {
    for (const parte of lista.split(',')) {
      const nome = parte.trim().split(/[:=]/)[0]!.trim().replace(/^\.\.\./, '');
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) nomes.add(nome);
    }
  }
  for (const [, lista] of texto.matchAll(/function\s+[A-Za-z_$][\w$]*\s*\(([^()]*)\)/g)) {
    for (const parte of lista.split(',')) {
      const nome = parte.trim().split(/[:=]/)[0]!.trim().replace(/^\.\.\./, '');
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) nomes.add(nome);
    }
  }
  return nomes;
}

/**
 * Nomes que o texto publicado LIGA, lidos da árvore do TypeScript.
 *
 * O `declaredIn` acima é de expressão regular e perde três formas que este
 * repositório usa em toda story: parâmetro DESESTRUTURADO (`.map(({ id, label
 * }) => …)`, `cell: ({ row }) => …`), padrão de arranjo (`.map(([rotulo, lado])
 * => …)`) e seta de parâmetro único sem parênteses. Medido em 2026-09-03: só
 * essas três respondiam por cinco dos módulos que a primeira versão desta
 * guarda acusou — todos corretos.
 *
 * O analisador tolera erro, e é isso que o torna utilizável aqui: o texto
 * publicado de um módulo é a colagem de todos os ramos, e quase nunca compila
 * inteiro. Ele devolve a árvore que conseguiu montar, e o que sobra é
 * declaração a mais — que é o lado seguro de errar numa guarda que cobra
 * ORIGEM.
 */
function tsBindings(texto: string): Set<string> {
  const src = ts.createSourceFile('publicado.tsx', texto, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const nomes = new Set<string>();
  const ligar = (node: ts.Node | undefined): void => {
    if (!node) return;
    if (ts.isIdentifier(node)) {
      nomes.add(node.text);
      return;
    }
    if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
      for (const el of node.elements) if (ts.isBindingElement(el)) ligar(el.name);
    }
  };
  const walk = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node)) ligar(node.name);
    else if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) nomes.add(node.name.text);
    else if (ts.isImportClause(node)) {
      if (node.name) nomes.add(node.name.text);
      if (node.namedBindings) {
        if (ts.isNamespaceImport(node.namedBindings)) nomes.add(node.namedBindings.name.text);
        else for (const el of node.namedBindings.elements) nomes.add(el.name.text);
      }
    } else if (ts.isCatchClause(node) && node.variableDeclaration) ligar(node.variableDeclaration.name);
    else if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node)) {
      nomes.add(node.name.text);
    }
    ts.forEachChild(node, walk);
  };
  walk(src);
  return nomes;
}

/**
 * Tudo que vale como ORIGEM para um módulo, somado uma vez só.
 *
 * Duas fontes, e a segunda não é luxo. A primeira é o texto publicado — todos
 * os ramos de uma vez. A segunda é a SAÍDA REAL de cada construtor, e é ela que
 * enxerga a declaração montada por interpolação: `chart.source.ts` escreve o
 * import por `importChart('buildBarOption')`, e no texto publicado aquilo é só
 * `import { INTERPOLADO } from "@/components/ui/chart"`. Sem a segunda fonte a
 * guarda acusava os oito construtores de opção do Chart e os seis pares de
 * estado do Slider, todos corretos — medido em 2026-09-03.
 *
 * A soma é por MÓDULO, e não por construtor, pelo mesmo motivo declarado na
 * passagem de laço: é o que permite conferir os ramos que os args padrão não
 * produzem, ao custo de aceitar nome declarado num ramo e usado noutro.
 */
const ligadosPorCaminho = new Map<string, Set<string>>();
function boundNames(caminho: string): Set<string> {
  const memo = ligadosPorCaminho.get(caminho);
  if (memo) return memo;
  const textos: string[] = [publishedText(sourcesRaw[caminho] ?? '')];
  for (const valor of Object.values(modulos[caminho] ?? {})) {
    if (typeof valor !== 'function') continue;
    try {
      const saida = (valor as () => unknown)();
      if (typeof saida === 'string') textos.push(saida);
    } catch {
      // Construtor que quebra sem args já reprova em `devolve um snippet
      // honesto`; aqui ele só não contribui com declaração.
    }
  }
  const nomes = new Set<string>();
  for (const texto of textos) {
    for (const nome of declaredIn(texto)) nomes.add(nome);
    for (const nome of tsBindings(texto)) nomes.add(nome);
  }
  ligadosPorCaminho.set(caminho, nomes);
  return nomes;
}

/**
 * Nomes que existem sem ninguém declarar, porque a plataforma os oferece.
 *
 * Lista fechada, como a de `HELPERS`: nome global que falta aqui reprova, e o
 * conserto é acrescentá-lo — declarar a exceção, não afrouxar a regra.
 */
const GLOBAIS = new Set([
  'Object', 'Array', 'String', 'Number', 'Boolean', 'Math', 'JSON', 'Date', 'Promise', 'Map', 'Set',
  'WeakMap', 'WeakSet', 'RegExp', 'Error', 'Symbol', 'BigInt', 'Intl', 'console', 'window', 'document',
  'navigator', 'location', 'history', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'fetch', 'URL', 'URLSearchParams', 'FormData', 'Blob',
  'File', 'FileReader', 'AbortController', 'localStorage', 'sessionStorage', 'crypto', 'structuredClone',
  'queueMicrotask', 'globalThis', 'undefined', 'NaN', 'Infinity', 'parseInt', 'parseFloat', 'isNaN',
  'encodeURIComponent', 'decodeURIComponent', 'Event', 'CustomEvent', 'Element', 'HTMLElement', 'Node',
  'MutationObserver', 'IntersectionObserver', 'ResizeObserver', 'matchMedia', 'alert', 'confirm', 'prompt',
  'performance', 'Notification', 'React', 'ReactDOM', 'Fragment', 'process',
]);

/**
 * Cada `nome={…}` do texto publicado, com a expressão inteira.
 *
 * Sem espaço em volta do `=`, e isso NÃO é detalhe de estilo: com `\s*=\s*` a
 * varredura casava `const rotulos = {` e tratava um objeto de constante como
 * expressão de atributo. Onze módulos entravam assim, todos falhando ao
 * analisar — e falha de análise é exclusão silenciosa, que é o modo de falhar
 * que este arquivo já pagou caro. Em JSX o `=` do atributo nunca tem espaço.
 */
function attributeExpressions(texto: string): Array<{ attr: string; expr: string | null }> {
  const achados: Array<{ attr: string; expr: string | null }> = [];
  const re = /(?<![\w$.])([A-Za-z_$][\w$]*(?:-[\w$]+)*)=\{/g;
  let achado: RegExpExecArray | null;
  while ((achado = re.exec(texto))) {
    const inicio = achado.index + achado[0].length;
    let prof = 1;
    let i = inicio;
    while (i < texto.length && prof > 0) {
      const c = texto[i];
      if (c === '{') prof++;
      else if (c === '}') prof--;
      else if (c === "'" || c === '"' || c === '`') {
        const aspa = c;
        i++;
        while (i < texto.length && texto[i] !== aspa) {
          if (texto[i] === '\\') i++;
          i++;
        }
      }
      i++;
    }
    if (prof !== 0) {
      achados.push({ attr: achado[1]!, expr: null });
      continue;
    }
    achados.push({ attr: achado[1]!, expr: texto.slice(inicio, i - 1) });
    re.lastIndex = i;
  }
  return achados;
}

/**
 * Os nomes que UMA expressão de atributo referencia sem ligar ela mesma.
 *
 * Quem separa referência de tudo o que se PARECE com referência é o analisador
 * do TypeScript, e não uma expressão regular — porque dentro de uma expressão
 * de atributo cabe JSX aninhado, e ali a prosa das crianças (`<div>Olá
 * mundo</div>`) tem exatamente a forma de dois identificadores. Ficam de fora,
 * por serem nome e não referência: lado direito de `.`, chave de objeto, nome
 * de atributo JSX, nome de tag (a checagem de origem de tag é quem cobra
 * aquilo), qualquer coisa em posição de TIPO, e o que a própria expressão liga.
 */
function referencedIn(exprText: string): Set<string> {
  const src = ts.createSourceFile(
    'expressao.tsx',
    `const __sonda = (\n${exprText}\n);`,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TSX,
  );
  const ligados = new Set<string>(['__sonda']);
  const refs = new Set<string>();

  const ligar = (node: ts.Node | undefined): void => {
    if (!node) return;
    if (ts.isIdentifier(node)) {
      ligados.add(node.text);
      return;
    }
    if (ts.isObjectBindingPattern(node) || ts.isArrayBindingPattern(node)) {
      for (const el of node.elements) if (ts.isBindingElement(el)) ligar(el.name);
    }
  };

  const eReferencia = (node: ts.Identifier): boolean => {
    const pai = node.parent;
    if (!pai) return false;
    if (ts.isPropertyAccessExpression(pai) && pai.name === node) return false;
    if (ts.isQualifiedName(pai) && pai.right === node) return false;
    if (ts.isPropertyAssignment(pai) && pai.name === node) return false;
    if (ts.isMethodDeclaration(pai) && pai.name === node) return false;
    if (ts.isJsxAttribute(pai) && pai.name === node) return false;
    if (ts.isJsxOpeningElement(pai) || ts.isJsxSelfClosingElement(pai) || ts.isJsxClosingElement(pai)) return false;
    if (ts.isBindingElement(pai) || ts.isParameter(pai)) return false;
    if (ts.isVariableDeclaration(pai) && pai.name === node) return false;
    if (
      (ts.isFunctionDeclaration(pai) || ts.isFunctionExpression(pai) ||
        ts.isClassDeclaration(pai) || ts.isClassExpression(pai)) &&
      pai.name === node
    ) {
      return false;
    }
    if (ts.isLabeledStatement(pai) || ts.isBreakStatement(pai) || ts.isContinueStatement(pai)) return false;
    for (let acima: ts.Node | undefined = pai; acima; acima = acima.parent) {
      if (ts.isTypeNode(acima) || ts.isTypeParameterDeclaration(acima)) return false;
    }
    return true;
  };

  const walk = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node)) ligar(node.name);
    else if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) ligados.add(node.name.text);
    else if (ts.isCatchClause(node) && node.variableDeclaration) ligar(node.variableDeclaration.name);
    if (ts.isIdentifier(node) && eReferencia(node)) refs.add(node.text);
    ts.forEachChild(node, walk);
  };
  walk(src);

  for (const nome of ligados) refs.delete(nome);
  return refs;
}

/** Objetos globais cujo `.map` nunca precisa de origem no snippet. */
const GLOBAIS_COM_MAP = new Set(['Object', 'Array', 'React', 'Math', 'JSON', 'Promise', 'this']);

/**
 * A MESMA pergunta das checagens que executam, feita ao TEXTO do módulo.
 *
 * POR QUE ESTA PASSAGEM EXISTE. As outras chamam cada construtor UMA vez, com
 * os args padrão, então só o ramo default é conferido — e medido em 2026-09-03,
 * 68 dos 82 módulos desta stack mudam a FORMA do snippet conforme o arg. Todo
 * ramo não-padrão vivia sem portão nenhum.
 *
 * A forma conferida é o laço de renderização do JSX: `algo.map(…)`. É o
 * equivalente exato do `@for (x of algo)` que o Angular confere — e o defeito é
 * o mesmo dos dois lados: o snippet ITERA um nome que ele não declara nem
 * importa, e quem copia recebe um símbolo indefinido. O docblock do
 * `table.source.ts` conta essa história: o painel imprimia `{INVOICES.map(…)}`
 * com `INVOICES` morando no módulo de fixtures. Aquele foi corrigido por
 * LEITURA; esta passagem é o portão que dispensa a leitura da próxima vez.
 *
 * "Declarado" aqui quer dizer declarado ou importado DENTRO do próprio snippet
 * — nada vale o módulo de fixtures ou o arquivo de story, que quem copia não
 * tem. Declarações e usos são somados no MÓDULO inteiro, e não por construtor:
 * é o que permite ver todos os ramos de uma vez, ao custo declarado abaixo.
 *
 * O QUE ELA NÃO VÊ, e por isso as passagens que executam continuam:
 *
 *  · **fonte do laço vinda de interpolação** (`${lista}.map(…)`) — o `${…}` é
 *    apagado antes da varredura, porque ali o nome é do CONSTRUTOR e não do
 *    snippet. A passagem que executa cobre o ramo padrão desses;
 *  · **nome declarado no ramo ERRADO** — iterado no ramo A e declarado só no B.
 *    A soma é por módulo, então o nome consta e passa. Ao menos ele existe no
 *    exemplo, e o caso é mais raro que o que isto passa a pegar;
 *  · **laço encadeado** (`lista.filter(…).map(…)`) e `for (const x of lista)` —
 *    só a raiz colada ao `.map(` é conferida, que é a forma que os 82 módulos
 *    usam hoje. Forma nova não é acusada: é ignorada, e este parágrafo é o
 *    aviso de que ela precisaria de uma linha aqui;
 *  · **referência fora de expressão de atributo** — ver `referencesWithoutOrigin`
 *    logo abaixo, que passou a cobrar `labels={rotulos}` e companhia.
 */
function loopsWithoutOrigin(bruto: string, ligados: Set<string>): string[] {
  const texto = publishedText(bruto);
  const soltos = new Set<string>();
  for (const [, nome] of texto.matchAll(/(?:^|[^.\w$])([A-Za-z_$][\w$]*)\.map\s*\(/gm)) {
    if (GLOBAIS_COM_MAP.has(nome) || ligados.has(nome) || nome.includes(MARCA_INTERPOLACAO)) continue;
    soltos.add(nome);
  }
  return [...soltos].sort();
}

/**
 * A MESMA pergunta, feita agora a toda EXPRESSÃO DE ATRIBUTO — não só à fonte
 * do laço.
 *
 * É o que o compilador do Angular obriga do outro lado: toda expressão do
 * template tem de referenciar membro que a classe declara. Aqui a convenção
 * destes snippets vinha elidindo o nome — `labels={rotulos}`, `usage={medicao}`,
 * `steps={proposedSteps}` — e quem copiava recebia um identificador indefinido
 * na primeira renderização. Era o defeito de `INVOICES.map(…)` do
 * `table.source.ts` outra vez, só que numa prop em vez de num laço.
 *
 * MANIPULADOR EM LINHA NÃO TEM PASSE. `onAction={(intent) => aplicar(intent)}`
 * é cobrado como qualquer outra referência, e a decisão é deliberada: o custo
 * para quem copia é idêntico — `aplicar is not defined` —, o Angular o recusa,
 * e uma exceção com a forma "parece callback" seria exatamente o buraco que
 * transforma portão em assunto de discussão. Declarar o manipulador custa uma
 * linha no preâmbulo e termina o exemplo; elidi-lo economiza uma linha e
 * quebra o exemplo.
 *
 * O QUE ELA NÃO VÊ:
 *
 *  · **`{expr}` no CORPO do JSX** — `<p>{contador}</p>`. Só `nome={…}` é
 *    varrido; o corpo tem prosa e chave de estilo, e separar um do outro sem
 *    contexto de JSX é onde uma varredura textual inventa achado. O laço no
 *    corpo continua coberto pela passagem acima;
 *  · **nome que vem de interpolação** — vira o marcador `INTERPOLADO` e passa;
 *  · **nome declarado no ramo ERRADO** — a soma é por módulo, igual à do laço;
 *  · **posição de TIPO** — `as Foo`, `useState<Item>`: um tipo local não é
 *    declaração que `tsBindings` alcance em todo caso, e cobrá-lo acusaria
 *    módulo correto;
 *  · **escopo** — declarado dentro de uma função e usado fora dela passa. A
 *    pergunta aqui é ORIGEM, não visibilidade.
 */
function referencesWithoutOrigin(bruto: string, ligados: Set<string>): string[] {
  const texto = publishedText(bruto);
  const soltos = new Set<string>();
  for (const { attr, expr } of attributeExpressions(texto)) {
    // Nunca em silêncio: expressão que não fecha é a varredura perdendo terreno,
    // e é isso que este repositório já pagou caro duas vezes.
    if (expr === null) {
      soltos.add(`${attr}={… (a chave nunca fechou — a varredura não leu esta expressão)`);
      continue;
    }
    if (!expr.trim()) continue;
    for (const nome of referencedIn(expr)) {
      if (GLOBAIS.has(nome) || ligados.has(nome) || nome.includes(MARCA_INTERPOLACAO)) continue;
      soltos.add(nome);
    }
  }
  return [...soltos].sort();
}

describe('transforms do painel Code', () => {
  it('a varredura encontra os módulos de source', () => {
    expect(caminhos.length).toBeGreaterThan(0);
  });

  it('todo arquivo de story importa a transform do seu componente', () => {
    const noFiacao = Object.entries(storiesRaw)
      .filter(([, fonte]) => !/from\s+["']\.\/[a-z0-9-]+\.source["']/.test(fonte))
      .map(([caminho]) => caminho)
      .sort();
    expect(noFiacao, 'story sem transform declarada no meta').toEqual([]);
  });

  it('todo arquivo de story declara a transform em source.transform', () => {
    const noTransform = Object.entries(storiesRaw)
      .filter(([, fonte]) => !/source:\s*\{[\s\S]{0,200}?transform:/.test(fonte))
      .map(([caminho]) => caminho)
      .sort();
    expect(noTransform, 'meta sem parameters.docs.source.transform').toEqual([]);
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
        const bruto = sourcesRaw[caminho];
        // Cobrado, e não pulado: varredura que exclui em silêncio encolhe
        // sozinha, e foi assim que 28 testes sumiram no Vue com a suíte verde.
        expect(bruto, `${caminho}: a varredura crua não alcançou o módulo`).toBeDefined();
        const soltos = loopsWithoutOrigin(bruto!, boundNames(caminho));
        expect(
          soltos,
          `${caminho}: algum ramo do snippet itera ${soltos.join(', ')}, que ele não declara nem importa — quem copiar aquele ramo recebe um laço sobre símbolo indefinido`,
        ).toEqual([]);
      });

      // A mesma exigência do compilador do Angular sobre expressão de template.
      it('nenhum ramo referencia nome que o snippet não declara', () => {
        const bruto = sourcesRaw[caminho];
        expect(bruto, `${caminho}: a varredura crua não alcançou o módulo`).toBeDefined();
        const soltos = referencesWithoutOrigin(bruto!, boundNames(caminho));
        expect(
          soltos,
          `${caminho}: algum ramo do snippet passa ${soltos.join(', ')} numa prop sem declarar nem importar o nome — quem copiar aquele ramo recebe um símbolo indefinido`,
        ).toEqual([]);
      });

      // Esta varredura não filtra por sufixo, então ela não perde teste quando
      // um nome sai da convenção — mas a convenção é cross-stack, e no Vue a
      // varredura FILTRA. Lá, a tradução dos identificadores moveu o sufixo
      // para o meio (`buttonParDeAcoesSource` -> `actionsSourceButtonPair`) e
      // apagou 28 testes com a suíte verde. O nome fica consistente na
      // declaração e em todo uso, então nenhum dos três portões reclama: quem
      // cobra a forma do nome é este check.
      it('todo export é construtor de snippet ou helper declarado', () => {
        const outside = Object.keys(modulo).filter(
          (name) => !/(?:Source|Snippet)$/.test(name) && !HELPERS.has(name),
        );
        expect(
          outside,
          `${caminho}: export fora da convenção — termine em Source/Snippet, ou declare em HELPERS se não constrói snippet`,
        ).toEqual([]);
      });

      for (const [name, fn] of exportadas) {
        it(`${name} devolve um snippet honesto`, () => {
          const saida = fn();
          expect(typeof saida, `${name} deve devolver string sem receber args`).toBe('string');
          const text = saida as string;
          expect(text.trim().length).toBeGreaterThan(0);

          // Docs de cada stack são consumidas isoladamente.
          expect(text).not.toMatch(OTHER_STACK);
          // A lib headless é detalhe de implementação: quem lê importa do
          // design system, nunca dela.
          expect(text).not.toContain('@base-ui');
          // Andaime de story, por forma do nome — MENOS o que o próprio módulo
          // do componente exporta. `ComboboxInputWrapper` é peça publicada e
          // casa a forma `*Wrapper`: o snippet a cita porque quem copia precisa
          // dela, não porque vazou andaime. Sem este filtro a regra reprovava
          // os SETE snippets do combobox por causa de uma peça legítima — e o
          // conserto errado seria renomear o componente nas cinco stacks.
          const publicados = slugExportados.get(slugDoCaminho(caminho)) ?? new Set<string>();
          const andaimes = [...text.matchAll(new RegExp(FORMA_SCAFFOLD.source, 'g'))]
            .map((achado) => achado[0])
            .filter((nome) => !publicados.has(nome));
          expect(
            andaimes,
            `${name}: nome de andaime de story no snippet publicado`,
          ).toEqual([]);
          // Módulo que só existe para as stories montarem.
          expect(text).not.toContain('fixtures');
          // O `{...args}` da story não é composição que alguém escreva.
          expect(text).not.toContain('{...args}');
          // Sobra de template literal mal fechado.
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('[object Object]');
          expect(text).not.toContain('NaN');
        });

        it(`${name} só usa peças com origem`, () => {
          const text = fn() as string;
          const { names, modulos: mods } = importesDo(text);
          const locais = declaradosNo(text);

          for (const mod of mods) {
            const conhecido =
              mod.startsWith('@/components/ui/') ||
              mod.startsWith('@/lib/') ||
              mod.startsWith('@/hooks/') ||
              // `@shared/*` é alias desta stack (tsconfig.app.json e
              // vite.config.ts): é de onde vêm as máquinas compartilhadas pelas
              // cinco, e um snippet que ensina a máquina precisa citá-la pelo
              // caminho que resolve. Quem copia o seletor do gatilho importa
              // `MENTION_TRIGGER` de lá, não do design system.
              mod.startsWith('@shared/') ||
              dependencias.has(mod) ||
              dependencias.has(mod.split('/').slice(0, mod.startsWith('@') ? 2 : 1).join('/'));
            expect(conhecido, `${name}: import de módulo desconhecido "${mod}"`).toBe(true);
          }

          // O `<` de uma tag JSX nunca vem colado a um identificador. O de um
          // genérico vem sempre: `useState<Date>`, `Array<string>`,
          // `Record<string, Foo>`. Sem esta âncora a guarda cobrava import de
          // `Date` — tipo global, que ninguém importa.
          const tags = new Set(
            [...text.matchAll(/(?:^|[^A-Za-z0-9_$])<([A-Z][A-Za-z0-9_$]*)/g)].map(([, tag]) => tag),
          );
          for (const tag of tags) {
            if (TAGS_LIVRES.has(tag)) continue;
            const hasOrigem = names.has(tag) || locais.has(tag);
            expect(hasOrigem, `${name}: <${tag}> não é importado nem declarado no snippet`).toBe(true);
          }
        });

        it(`${name} importa só o que o componente exporta`, () => {
          const text = fn() as string;
          // `[^{}]` e não `[\s\S]`: a chave de um import nunca aninha, e a
          // versão gulosa emendava DOIS imports quando o do design system não
          // era o primeiro — lia `useState } from "react"; import { Calendar`
          // como um nome só e reprovava um snippet correto.
          const re = /import\s+(?:type\s+)?\{([^{}]*)\}\s+from\s+["']@\/components\/ui\/([a-z0-9-]+)["']/g;
          for (const [, clausula, slug] of text.matchAll(re)) {
            const disponiveis = slugExportados.get(slug);
            expect(disponiveis, `${name}: não existe src/components/ui/${slug}.tsx`).toBeDefined();
            for (const parte of clausula.split(',')) {
              const importado = parte.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '').trim();
              if (!importado) continue;
              expect(
                disponiveis!.has(importado),
                `${name}: ${slug} não exporta "${importado}"`,
              ).toBe(true);
            }
          }
        });

        it(`${name} não deixa espião de control virar código`, () => {
          const withSpies = fn(undefined as never, { args: argsWithSpies() } as never);
          expect(typeof withSpies).toBe('string');
          // A arrow function EM SI é legítima num snippet — `onClick={() =>
          // setAberto(true)}` é a composição real. O que não pode aparecer é o
          // corpo do mock, e é o marcador que separa um caso do outro.
          expect(withSpies as string).not.toContain(MARCA_SPY);
          expect(withSpies as string).not.toContain('undefined');
          expect(withSpies as string).not.toContain('[object Object]');
        });
      }
    });
  }
});
