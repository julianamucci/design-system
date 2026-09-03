/**
 * Guarda transversal das transforms do painel Code.
 *
 * Cada `*.source.ts` exporta funções chamáveis SEM argumento (os args da story
 * são opcionais e caem no padrão). Isso é o que permite varrer todas de uma vez
 * e cobrar o que vale para o repositório inteiro: o snippet ensina o design
 * system, não o andaime da story.
 *
 * DUAS PROMESSAS, e as duas são sobre a mão de quem copia:
 *
 *  1. ORIGEM — todo nome que o snippet manda importar de `@/components/ui/<x>`
 *     existe mesmo lá. Angular, React e Vanilla já cobravam isso; esta stack
 *     não cobrava nada disso, e aqui a resposta vem do BARRIL (`index.ts`), que
 *     é quem de fato reexporta: o nome do arquivo não decide nada — `Root` mora
 *     em `accordion.svelte` e sai do barril como `Accordion`.
 *  2. ESCOPO — todo nome que o exemplo USA é declarado DENTRO do exemplo. Era a
 *     metade que faltava: o laço já era cobrado, mas `labels={rotulos}` não, e
 *     por convenção vários módulos nomeavam ali a variável de quem consome. No
 *     Angular o compilador obriga a declarar; aqui nada obrigava, e quem
 *     copiasse recebia um binding que não resolve.
 */
import { describe, expect, it } from 'vitest';

const modulos = import.meta.glob<Record<string, unknown>>('./**/*.source.ts', { eager: true });

const caminhos = Object.keys(modulos).sort();

/**
 * O TEXTO de cada módulo, para enxergar os ramos que a chamada não produz.
 *
 * Lido em cru, e não importado: a pergunta que ele responde não é sobre o que
 * o construtor DEVOLVE com os args padrão — é sobre tudo que ele pode escrever.
 */
const fontes = import.meta.glob<string>('./**/*.source.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * O TEXTO dos módulos de componente, para saber o que cada um exporta.
 *
 * Lido em cru, e não importado: importar `.svelte` fora do compilador quebraria
 * o projeto `unit`, e a pergunta aqui não precisa de execução — é sobre o que o
 * arquivo declara.
 *
 * NESTA STACK QUEM RESPONDE É O BARRIL, e derivar o nome do arquivo seria
 * exatamente o erro que o Angular já pagou (lá a primeira versão derivava a
 * classe do nome do elemento e acusou quinze snippets corretos). Aqui a peça se
 * exporta por `<slug>/index.ts`, que renomeia quase tudo: `Root` vira
 * `Accordion`, `Item` vira `AccordionItem`, e nada disso está no nome do
 * arquivo. Por isso o que se lê é o REEXPORTE.
 *
 * O glob varre um nível — `./<slug>/<arquivo>.ts` —, o bastante para os barris
 * e para os módulos de tipo que um snippet importa por subcaminho
 * (`@/components/ui/carousel/context`). Story, teste e o próprio `.source.ts`
 * ficam de fora porque nenhum deles é porta de entrada do design system.
 */
const componentes = import.meta.glob<string>(
  ['./*/*.ts', '!./*/*.source.ts', '!./*/*.stories.ts', '!./*/*.test.ts'],
  { query: '?raw', import: 'default', eager: true },
);

/**
 * A tag que fecha o `<script>` do snippet, montada por concatenação.
 *
 * Escrita por extenso, ela fecharia o bloco de quem lê este arquivo como HTML —
 * é a mesma costura que `svelteSnippet` faz do outro lado.
 */
const FECHA_SCRIPT = '</' + 'script>';

/** Nome do componente-invólucro que existe só dentro do arquivo de story. */
const SCAFFOLD = /\b[A-Z][A-Za-z0-9]*Story\b|\bwrapper\b|\bcaso\b/;

/** Regra do repositório: nada de nome de outra stack no que o leitor vê. */
const OTHER_STACK = /\b(React|Vue|Angular|Vanilla|reka-ui|base-ui|radix)\b/i;

/**
 * Exports que legitimamente NÃO constroem snippet — hoje, nenhum: todas as
 * transforms desta stack terminam em `Source` ou `Snippet`.
 *
 * Lista fechada de propósito. Acrescentar um nome aqui é declarar a exceção;
 * deixar de fora é reprovar — que é o que dá dentes à convenção.
 */
const HELPERS = new Set<string>([]);

/**
 * Nomes que um `{#each}` pode iterar sem ninguém os declarar no exemplo.
 *
 * Lista fechada de propósito: o que não estiver aqui e não for declarado no
 * `<script>` publicado é acusado, porque o silêncio é o modo de falhar que a
 * checagem abaixo existe para fechar.
 */
const GLOBALS = new Set([
  'Array',
  'Object',
  'Math',
  'JSON',
  'Number',
  'String',
  'Boolean',
  'Date',
  'Map',
  'Set',
]);

/**
 * O que um módulo de componente entrega a quem o importa, lido da declaração.
 *
 * `especificador` é o que vem depois de `@/components/ui/` — `accordion`, ou
 * `carousel/context`. O primeiro resolve pelo barril; o segundo, pelo arquivo.
 *
 * COMENTÁRIO SAI ANTES DE QUALQUER COISA. O barril do `inline-citation` explica
 * dentro do próprio bloco `export { … }`, em prosa com vírgulas, por que a
 * prévia não sai dali — e uma palavra solta entre duas vírgulas da prosa
 * passaria por nome reexportado. É a mesma armadilha da prosa em crase que esta
 * casa já pagou do outro lado.
 *
 * O QUE ELA NÃO VÊ: `export * from …` (nenhum barril usa hoje, e se algum
 * passar a usar o nome some da conta e o check vira permissivo demais — não
 * silencioso, porque o nome ausente REPROVA); e o que um módulo reexporta de
 * fora de `components/ui`.
 */
function exportadosPor(especificador: string): Set<string> | null {
  const texto =
    componentes[`./${especificador}/index.ts`] ?? componentes[`./${especificador}.ts`];
  if (texto === undefined) return null;

  const limpo = texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const nomes = new Set<string>();
  for (const m of limpo.matchAll(
    /export\s+(?:declare\s+)?(?:abstract\s+)?(?:const|let|var|class|function|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    nomes.add(m[1]!);
  }
  // `export { A, B as C }` e `export type { D }` — o nome que vale é o de fora.
  // O `type` na frente da CHAVE é do reexporte; o `type` na frente do NOME é do
  // nome. Os dois são descascados, e esquecer o primeiro deixaria `data-table`
  // e `input-group` sem metade do que publicam.
  for (const m of limpo.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const parte of m[1]!.split(',')) {
      const nome = parte
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
        .replace(/^type\s+/, '');
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) nomes.add(nome);
    }
  }
  return nomes;
}

/**
 * Os `import { … } from "@/components/ui/<x>"` que o snippet ENSINA.
 *
 * `import type` conta, e é a armadilha que o Angular pagou antes: `import\s*\{`
 * não casa com o `type` que vem entre a palavra e a chave, e o efeito não é uma
 * falha — é o snippet passar por ser PULADO em vez de conferido. As duas aspas
 * contam também: metade dos módulos daqui escreve o import do exemplo dentro de
 * uma string de aspas duplas, e ali a aspa do snippet vira simples.
 *
 * O QUE ELA NÃO VÊ: import de outra origem (`@lucide/svelte`, `@/lib/…`), que
 * não é promessa do design system; e `import Peça from …`, forma que nenhum
 * barril desta stack suporta porque nenhum tem `export default`.
 */
function importesDoDesignSystem(texto: string): Array<{ modulo: string; nomes: string[] }> {
  const saida: Array<{ modulo: string; nomes: string[] }> = [];
  for (const m of texto.matchAll(
    /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']@\/components\/ui\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)["']/g,
  )) {
    saida.push({
      modulo: m[2]!,
      nomes: m[1]!
        .split(',')
        .map((n) => n.trim().split(/\s+as\s+/)[0]!.trim().replace(/^type\s+/, ''))
        .filter((n) => /^[A-Za-z_$][\w$]*$/.test(n)),
    });
  }
  return saida;
}

/**
 * O texto do módulo, sem o que não é código publicado.
 *
 * Três remoções, e as três foram falso positivo meu antes de virarem regra:
 *
 *  1. COMENTÁRIO SAI PRIMEIRO. Um docblock explica o snippet em crase, e
 *     `{#each …}` citado numa explicação vira laço publicado se ninguém o
 *     tirar. Extrair o snippet por par de crases solto é a mesma armadilha
 *     vista de outro ângulo — foi assim que um nome que só existe na prosa
 *     virou achado.
 *  2. ESCAPE SAI ANTES DA INTERPOLAÇÃO. `\`Tag \${i + 1}\`` tem crase
 *     escapada; apagar `${…}` primeiro deixa duas barras coladas na crase, o
 *     casamento de crases inverte a partir dali e o `<script>` inteiro sai da
 *     conta — dois módulos CORRETOS (`scroll-area`, `table`) foram acusados
 *     assim.
 *  3. `${…}` SAI POR ÚLTIMO, de dentro para fora. O que mora ali é nome do
 *     CONSTRUTOR, não do exemplo, e contá-lo inventaria declaração em todo
 *     módulo.
 */
function textoPublicado(bruto: string): string {
  let texto = bruto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  texto = texto.replace(/\\[\s\S]/g, '');
  let antes: string;
  do {
    antes = texto;
    texto = texto.replace(/\$\{[^{}]*\}/g, '');
  } while (texto !== antes);
  return texto;
}

/** Os trechos entre crases — onde o exemplo é escrito, e não montado. */
function templateRegions(texto: string): Array<[number, number]> {
  const regions: Array<[number, number]> = [];
  let inside = false;
  let start = 0;
  for (let i = 0; i < texto.length; i += 1) {
    if (texto[i] !== '`') continue;
    if (inside) {
      regions.push([start, i]);
      inside = false;
    } else {
      inside = true;
      start = i + 1;
    }
  }
  return regions;
}

/** O que um trecho de código PUBLICADO traz para o escopo do `<script>`. */
function collectDeclarations(trecho: string, into: Set<string>): void {
  for (const m of trecho.matchAll(/(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) {
    into.add(m[1]!);
  }
  // Desestruturação: `const { grouped, waiting } = …`. Sem ela, o snippet do
  // cartão de autorização fora da caixa era acusado por `waiting`.
  for (const m of trecho.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const parte of m[1]!.split(',')) {
      const nome = parte.trim().split(/[:=]/).pop()?.trim();
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) into.add(nome);
    }
  }
  // IMPORT TAMBÉM DECLARA, e esquecê-lo acusou cinco módulos corretos de uma
  // vez: os snippets que ensinam a ITERAR o vocabulário compartilhado
  // (`RUN_STATUSES`, `CONNECTION_STATES`, `CONTEXT_DISPLAY_FORMS`) publicam o
  // import da constante no próprio `<script>` — ela chega ao exemplo por ali.
  for (const m of trecho.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from/g)) {
    for (const parte of m[1]!.split(',')) {
      const nome = parte
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
        .replace(/^type\s+/, '');
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) into.add(nome);
    }
  }
  for (const m of trecho.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) into.add(m[1]!);
}

/**
 * O que TODO ramo do módulo itera e o `<script>` do exemplo não declara.
 *
 * POR QUE UMA SEGUNDA PASSAGEM EXISTE. A que executa chama cada construtor UMA
 * vez, com os args padrão — e medido em 2026-09-03, 70 dos 82 módulos desta
 * stack mudam a forma do snippet conforme o argumento. O ramo que os padrões
 * não produzem não tinha portão nenhum. Declarar caso a caso custaria uma
 * entrada por ramo, e cada uma esquecida voltaria a ser silêncio; ler o TEXTO
 * vê todos os ramos de uma vez, ao custo de uma mudança por stack.
 *
 * O que se cobra é o mesmo de sempre: `{#each lista as item}` só resolve se
 * `lista` chegar pelo `<script lang="ts">` que viaja DENTRO do snippet. Uma
 * constante do arquivo de módulo não vale — ela fica para trás quando alguém
 * copia o bloco do painel. Por isso as declarações são colhidas só do texto
 * PUBLICADO: crase (o exemplo escrito por extenso) e aspas (o exemplo montado
 * por lista de linhas, que é como metade dos módulos daqui o escreve).
 *
 * Só a RAIZ da fonte do laço é conferida: em `{#each group.options as option}`
 * quem precisa existir é `group`, e o que vem depois do ponto é do tipo.
 *
 * O QUE ELA NÃO VÊ, e por isso a passagem que EXECUTA continua:
 *
 *  · laço cuja fonte é INTERPOLADA (`{#each ${nome} as x}`): o `${…}` é
 *    apagado antes da varredura, porque ali o nome é do construtor e não do
 *    exemplo. Sai da conta, e o ramo padrão o cobre pela outra passagem;
 *  · nome declarado no ramo ERRADO: publicado no ramo A e iterado no B. As
 *    declarações do módulo entram todas no mesmo saco, então o membro ao menos
 *    EXISTE em algum exemplo — falha mais rara que a que isto passa a pegar;
 *  · qualquer ligação que não seja laço. `{#if}`, `{#await}`, `{@render}` e
 *    atributo (`labels={rotulos}`) ficam de fora de propósito: vários módulos
 *    nomeiam ali, por convenção, a variável de quem consome;
 *  · nome que o próprio componente entrega ao bloco. `{#snippet children({
 *    cells })}` e a variável de `{#each}` são colhidas como locais — sem isso,
 *    `input-otp` e `pagination` eram acusados por `cells` e `pages`.
 */
function loopsSemDeclaracaoNoTexto(bruto: string): string[] {
  const texto = textoPublicado(bruto);
  const declarados = declaradosNoTexto(texto);
  const locais = nomesLocaisDaMarcacao(texto);

  const soltos = new Set<string>();
  for (const m of texto.matchAll(/\{#each\s+([A-Za-z_$][\w$]*)/g)) {
    const nome = m[1]!;
    if (GLOBALS.has(nome) || declarados.has(nome) || locais.has(nome)) continue;
    soltos.add(nome);
  }
  return [...soltos].sort();
}

/** O que o `<script>` publicado — em crase ou em aspas — traz para o escopo. */
function declaradosNoTexto(texto: string): Set<string> {
  const declarados = new Set<string>();
  for (const [inicio, fim] of templateRegions(texto)) {
    collectDeclarations(texto.slice(inicio, fim), declarados);
  }
  for (const m of texto.matchAll(/['"][^'"]*/g)) collectDeclarations(m[0]!, declarados);
  return declarados;
}

/**
 * Nomes que a PRÓPRIA marcação introduz, e que ninguém precisa declarar.
 *
 * Ignorá-los é o erro que a versão anterior desta checagem cometeu no Angular:
 * 50 ligações corretas acusadas, quase todas variável de laço.
 *
 * A fonte do `{#each … as …}` é lida por DESESTRUTURAÇÃO, e não como um nome
 * só: `{#each spending as [spent, cap] (spent)}` entrega dois nomes ao bloco, e
 * a versão que só aceitava identificador simples acusou o `cost-meter` por
 * `cap` — que o laço declara.
 */
function nomesLocaisDaMarcacao(texto: string): Set<string> {
  const locais = new Set<string>();
  const nomeando = (lista: string) => {
    for (const parte of lista.replace(/[[\]{}]/g, ' ').split(',')) {
      const nome = parte.trim().split(':').pop()?.trim();
      if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) locais.add(nome);
    }
  };

  for (const m of texto.matchAll(/\{#each\s+[^}\n]*?\s+as\s+([^}\n(]*)/g)) nomeando(m[1]!);
  for (const m of texto.matchAll(/\{#snippet\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g)) {
    locais.add(m[1]!);
    nomeando(m[2]!);
  }
  for (const m of texto.matchAll(/\{@const\s+([A-Za-z_$][\w$]*)/g)) locais.add(m[1]!);
  for (const m of texto.matchAll(/\{#await\s+[^}\n]*?\s+then\s+([A-Za-z_$][\w$]*)/g)) {
    locais.add(m[1]!);
  }
  for (const m of texto.matchAll(/\{:(?:then|catch)\s+([A-Za-z_$][\w$]*)/g)) locais.add(m[1]!);
  return locais;
}

/**
 * Palavras que aparecem numa expressão de ligação e NÃO são referência.
 *
 * Palavra reservada, literal e os poucos globais que um exemplo de marcação
 * usa. A lista é fechada de propósito: o que não estiver aqui e não for
 * declarado é acusado, porque o silêncio é o modo de falhar que a checagem
 * abaixo existe para fechar. Medido no corpo inteiro desta stack — com a lista
 * VAZIA, os únicos nomes a mais que apareceram foram `Math`, `console`, `true`,
 * `false`, `null` e `if`, e é por isso que ela é curta.
 */
const NAO_E_REFERENCIA = new Set([
  ...GLOBALS,
  'console',
  'true',
  'false',
  'null',
  'undefined',
  'NaN',
  'Infinity',
  'this',
  'new',
  'typeof',
  'instanceof',
  'void',
  'delete',
  'in',
  'of',
  'as',
  'if',
  'else',
  'return',
  'await',
  'async',
  'function',
  'const',
  'let',
  'var',
]);

/**
 * O que TODO ramo do módulo LIGA e o `<script>` do exemplo não declara.
 *
 * POR QUE ESTA CHECAGEM EXISTE, e por que ela chegou depois. A irmã acima já
 * cobrava o laço; a ligação por atributo ficava de fora **de propósito**, com a
 * justificativa de que vários módulos nomeiam ali, por convenção, a variável de
 * quem consome — `labels={rotulos}`, `lines={saidaDe(status)}`. A convenção era
 * o defeito: quem copia o bloco do painel recebe um `rotulos` que não existe, e
 * o exemplo não compila. No Angular o compilador nunca deixou isso passar,
 * porque expressão de template só enxerga membro de classe; aqui nada obrigava.
 *
 * Só a RAIZ da expressão é conferida: em `labels={rotulos.title}` quem precisa
 * existir é `rotulos`, e em `lines={saidaDe(status)}` é `saidaDe`. O que vem
 * depois do ponto é do tipo.
 *
 * TRÊS FALSOS POSITIVOS já pagos, e por isso três limpezas antes de varrer:
 *
 *  1. TEXTO DENTRO DA EXPRESSÃO NÃO É REFERÊNCIA. `aria-label={'Página ' + n}`
 *     acusaria `gina`: a varredura recomeça depois de um caractere acentuado,
 *     que não é `\w`, e inventa um nome no meio da palavra. Esvaziar cada
 *     literal antes fecha o caso — é o mesmo conserto do Angular.
 *  2. ASSERÇÃO DE TIPO NÃO É REFERÊNCIA. `(valor) => (item = valor as string)`
 *     acusava `string`, e o snippet do accordion controlado estava correto.
 *  3. CHAVE DE OBJETO LITERAL NÃO É REFERÊNCIA. `budget={{ amount: x }}`
 *     acusaria `amount`. O que distingue chave de ramo de ternário é o que vem
 *     ANTES: chave vem depois de `{` ou `,`.
 *
 * POR QUE ELA LÊ O SNIPPET PRONTO, e não o texto do módulo como a irmã de cima.
 * A primeira versão lia o texto, e acusou 33 módulos — dez a mais do que os 23
 * reais. Os dez eram da própria checagem, e por duas causas que só existem no
 * texto do módulo:
 *
 *  · DECLARAÇÃO INTERPOLADA. O `chart` publica
 *    `import { ChartContainer, ${montadores.join(', ')} } from …`, e o `${…}` é
 *    apagado antes da varredura — os sete montadores ficavam declarados no
 *    snippet e invisíveis à conta. Sete acusações num módulo correto;
 *  · `\${…}` ESCAPADO. `selectRow: (r) => \`Selecionar fatura \${r}\`` é um
 *    literal do EXEMPLO, e a remoção de escapes come o `\$` e deixa `{r}` — que
 *    parece atributo abreviado. Três acusações no `data-table`, uma no `table`.
 *
 * No snippet pronto nenhuma das duas existe: import e declaração chegam por
 * extenso, e o `${…}` que sobrou é do exemplo. O preço é conhecido e está logo
 * abaixo.
 *
 * O QUE ELA NÃO VÊ, e vale saber antes de chamá-la de verde:
 *
 *  · O RAMO QUE OS ARGS PADRÃO NÃO PRODUZEM. Cada transform é chamada UMA vez,
 *    sem argumento. Como cada configuração tem a sua função exportada, quase
 *    todo ramo é alcançado assim — o que escapa é o ramo que só um `ctx.args`
 *    do Playground produz. Para o LAÇO, a checagem irmã acima lê o texto e cobre
 *    todos os ramos; para a ligação nomeada, esse ramo fica sem portão, e foi
 *    lido à mão;
 *  · o que uma função declarada no exemplo referencia POR DENTRO. Só a raiz da
 *    expressão que a marcação escreve é lida;
 *  · escopo de bloco: uma declaração do `<script>` vale para a marcação inteira,
 *    e um nome que o exemplo declara dentro de uma função conta como declarado.
 */
function ligacoesSemDeclaracao(snippet: string): string[] {
  // O `<script>` publicado e a marcação publicada, separados pela tag de
  // fechamento — que é como `svelteSnippet` monta os dois.
  const corte = snippet.indexOf(FECHA_SCRIPT);
  const script = corte === -1 ? '' : snippet.slice(0, corte);
  const marcacaoBruta = corte === -1 ? snippet : snippet.slice(corte + FECHA_SCRIPT.length);

  // Comentário de marcação e bloco de estilo não ligam nada: o primeiro é prosa
  // e o segundo é CSS, e as chaves dos dois só produziriam ruído.
  const marcacao = marcacaoBruta
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');

  const declarados = new Set<string>();
  collectDeclarations(script, declarados);
  const locais = nomesLocaisDaMarcacao(marcacao);

  const soltos = new Set<string>();
  const registra = (expressao: string) => {
    // Parâmetro de função anônima é declaração: `onWithdraw={(m) => tirar(m)}`.
    //
    // O parêntese entra na limpeza junto com colchete e chave, e não é detalhe:
    // sem ele, `(a, b) => …` DENTRO de outra lista de parâmetros era colhido
    // como `(a` e reprovava o teste de identificador — o `row` do `data-table`,
    // parâmetro de um `.map` aninhado, era acusado por isso.
    const daExpressao = new Set<string>();
    for (const m of expressao.matchAll(/(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*=>/g)) {
      for (const parte of (m[1] ?? m[2] ?? '').replace(/[[\]{}()]/g, ' ').split(',')) {
        const nome = parte.trim().split(':')[0]!.trim();
        if (nome && /^[A-Za-z_$][\w$]*$/.test(nome)) daExpressao.add(nome);
      }
    }

    // Da crase sobra só o que ela INTERPOLA: `` `Página ${n}` `` liga `n`, e o
    // resto é texto — que é o falso positivo nº 1 visto de outro ângulo.
    //
    // ASPA ESCAPADA FECHA O LITERAL CEDO DEMAIS se ninguém a prever, e foi o
    // quarto falso positivo: `content={"<img alt=\"Ponto de exemplo\">"}` casava
    // do primeiro `"` até o `\"`, e a varredura recomeçava no meio do texto,
    // acusando `de`, `exemplo` e `ponto`. Por isso cada literal aceita par de
    // barra-mais-caractere no corpo.
    const semCrase = expressao.replace(
      /`(?:[^`\\]|\\[\s\S])*`/g,
      (trecho) => (trecho.match(/\$\{[^}]*\}/g) ?? []).join(' '),
    );
    const semTexto = semCrase
      .replace(/'(?:[^'\\]|\\[\s\S])*'/g, "''")
      .replace(/"(?:[^"\\]|\\[\s\S])*"/g, '""');
    const semTipo = semTexto.replace(/\bas\s+[A-Za-z_$][\w$.]*(\s*\[\s*\])?/g, '');
    const semChave = semTipo.replace(/([{,]\s*)[A-Za-z_$][\w$]*(\s*:)/g, '$1$2');

    for (const ident of semChave.matchAll(/(?:^|[^.\w$'"`])([A-Za-z_$][\w$]*)/g)) {
      const nome = ident[1]!;
      if (NAO_E_REFERENCIA.has(nome)) continue;
      if (declarados.has(nome) || locais.has(nome) || daExpressao.has(nome)) continue;
      soltos.add(nome);
    }
  };

  // Ligação nomeada: `prop={…}`, `bind:x={…}`, `onclick={…}`, `class:ativo={…}`.
  // As chaves são contadas para achar o fim — `budget={{ amount, fraction }}`
  // fecha com duas, e parar na primeira cortaria a expressão no meio.
  const abertura = /(?:^|[^\w$.:-])[A-Za-z_$][\w$.:-]*=\{/g;
  for (const m of marcacao.matchAll(abertura)) {
    const inicio = m.index + m[0].length - 1;
    let profundidade = 0;
    let fim = -1;
    for (let i = inicio; i < marcacao.length; i += 1) {
      if (marcacao[i] === '{') profundidade += 1;
      else if (marcacao[i] === '}') {
        profundidade -= 1;
        if (profundidade === 0) {
          fim = i;
          break;
        }
      }
    }
    if (fim === -1) continue;
    registra(marcacao.slice(inicio + 1, fim));
  }

  // E os blocos, que são o outro lugar em que uma expressão é avaliada.
  for (const m of marcacao.matchAll(/\{#(?:if|key)\s+([^}\n]*)\}/g)) registra(m[1]!);
  for (const m of marcacao.matchAll(/\{:else if\s+([^}\n]*)\}/g)) registra(m[1]!);
  for (const m of marcacao.matchAll(/\{@(?:render|html)\s+([^}\n]*)\}/g)) registra(m[1]!);
  for (const m of marcacao.matchAll(/\{\.\.\.([A-Za-z_$][\w$.]*)\}/g)) registra(m[1]!);
  // Atributo ABREVIADO e interpolação de um nome só — `<AgentPlan {labels} />`
  // e `{itemAtivo}` no corpo. As duas formas são idênticas no texto, e as duas
  // pedem a mesma coisa: o nome tem de existir no `<script>` do exemplo.
  for (const m of marcacao.matchAll(/\{([A-Za-z_$][\w$]*)\}/g)) registra(m[1]!);

  return [...soltos].sort();
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
      it('nenhum ramo itera lista que o script do exemplo não declara', () => {
        // REPROVA em vez de sair calada. `if (bruto === undefined) return;`
        // pouparia uma linha e carregaria a forma exata do portão que encolhe
        // sozinho: no dia em que os dois globs divergirem, o módulo que só um
        // deles alcança sai da varredura SEM UMA PALAVRA, com a suíte verde
        // medindo menos. Esta casa já pagou isso duas vezes.
        const bruto = fontes[caminho];
        expect(
          bruto,
          `${caminho}: o texto do módulo não chegou à varredura — provavelmente o arquivo saiu do alcance do glob de \`fontes\`, e sem esta falha ele sumiria da medição em silêncio`,
        ).toBeTypeOf('string');
        const soltos = loopsSemDeclaracaoNoTexto(bruto!);
        expect(
          soltos,
          `${caminho}: algum ramo do snippet itera ${soltos.join(', ')}, que nenhum <script> do exemplo declara — quem copiar aquele ramo recebe um laço que não resolve`,
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
          // O andaime da story não é parte do design system.
          expect(text).not.toMatch(SCAFFOLD);
          // Docs de cada stack são consumidas isoladamente.
          expect(text).not.toMatch(OTHER_STACK);
          // `bits-ui` é a lib headless por baixo; o leitor importa do design
          // system, nunca dela.
          expect(text).not.toContain('bits-ui');
          // Sobra de template literal mal fechado.
          expect(text).not.toContain('undefined');
          expect(text).not.toContain('[object Object]');
        });

        // A outra metade da mesma promessa: o laço já era cobrado, a ligação
        // nomeada não — e era por convenção, não por descuido.
        it(`${name} liga só o que o script do exemplo declara`, () => {
          const saida = fn();
          if (typeof saida !== 'string') return;

          const soltos = ligacoesSemDeclaracao(saida);
          expect(
            soltos,
            `${name}: a marcação liga ${soltos.join(', ')}, que o <script> do exemplo não declara — quem copiar o bloco do painel recebe um nome que não existe`,
          ).toEqual([]);
        });

        it(`${name} importa só o que o barril exporta`, () => {
          const saida = fn();
          if (typeof saida !== 'string') return;

          const faltando: string[] = [];
          for (const { modulo, nomes } of importesDoDesignSystem(saida)) {
            const exportados = exportadosPor(modulo);
            // REPROVA em vez de sair calada. `continue` aqui pareceria prudência
            // e seria o portão que encolhe sozinho: módulo que a varredura não
            // acha é, no repositório, ou um caminho que não existe — o import
            // não resolveria na mão de quem copia — ou um arquivo fora do
            // alcance do glob de um nível. Os dois merecem falha, e nenhum
            // merece silêncio.
            if (!exportados) {
              faltando.push(`o módulo ${modulo} (nenhum index.ts nem arquivo com esse nome)`);
              continue;
            }
            for (const nome of nomes) {
              if (!exportados.has(nome)) faltando.push(`${nome} (de ${modulo})`);
            }
          }
          expect(
            faltando,
            `${name}: o snippet ensina a importar ${faltando.join(', ')} — o barril do componente não reexporta isso, e quem copiar recebe um import que não resolve`,
          ).toEqual([]);
        });
      }
    });
  }
});
