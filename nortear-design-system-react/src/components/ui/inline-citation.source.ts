/**
 * Snippet do painel Code da citação em linha — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que a marca entra numa
 * frase que é de quem escreve, e que o nome acessível chega ESCRITO. As duas
 * juntas são o contrato — quem copiasse só a chamada poria a marca depois de um
 * espaço, e um dia entregaria um botão cujo nome acessível é "1".
 *
 * POR QUE OS PEDAÇOS DA FRASE ENTRAM COMO EXPRESSÃO, e não como texto solto no
 * JSX: entre um texto solto e a tag seguinte, uma quebra de linha vira ESPAÇO —
 * e espaço antes da marca é exatamente o que separa a marca da palavra que a
 * antecede quando a linha quebra. Entre duas expressões, a quebra de linha não
 * produz nada. O snippet mostra a forma que preserva a regra.
 *
 * E é por isso que NENHUM snippet daqui monta a caixa à mão: ela é filha da
 * marca e sai do próprio componente, e um snippet que a montasse ensinaria uma
 * composição que a peça não pede.
 */
import { indentar, jsxSnippet, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { InlineCitation } from "@/components/ui/inline-citation";';

export type InlineCitationSnippetOptions = {
  /** Qual citação o exemplo passa. */
  shape?: 'full' | 'minimal' | 'unsafe';
  /** Nasce com a prévia aberta? */
  defaultOpen?: boolean;
};

/** O título do documento do exemplo, o mesmo do módulo compartilhado. */
const TITLE = 'Relatório anual de operações';

/** O endereço do documento do exemplo. */
const ADDRESS = 'https://exemplo.test/relatorios/2025/operacoes';

const TITLE_MINIMAL = 'Nota metodológica da pesquisa';
const TITLE_UNSAFE = 'Anexo enviado pelo agente';

const SENTENCE_HEAD = 'A receita cresceu doze por cento no último ano';
const SENTENCE_TAIL = ', e a metodologia por trás do número está publicada';

/** Texto entre aspas duplas, para dentro de uma expressão JSX. */
function quote(value: string): string {
  return JSON.stringify(value);
}

/**
 * A citação do exemplo, escrita por extenso.
 *
 * Por extenso, e não importada de um módulo de exemplos: o snippet ensina a
 * FORMA do dado, e quem copia precisa ver os três campos para saber que o
 * trecho mora na citação e não na fonte.
 */
function citationLines(shape: 'full' | 'minimal' | 'unsafe'): string {
  if (shape === 'minimal') {
    return [
      '// SEM TRECHO E SEM LUGAR. Citar um documento sem saber a página acontece,',
      '// e a prévia responde não montando o que não veio.',
      'const citation = {',
      `  source: { title: ${quote(TITLE_MINIMAL)}, url: ${quote('https://exemplo.test/metodo')} },`,
      '};',
    ].join('\n');
  }

  if (shape === 'unsafe') {
    return [
      '// O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é entrada.',
      '// A peça pergunta se ele pode virar link no ponto em que ele encosta na',
      '// página: o que não passa continua legível e deixa de ser link.',
      'const citation = {',
      `  source: { title: ${quote(TITLE_UNSAFE)}, url: ${quote('javascript:alert(1)')} },`,
      `  excerpt: ${quote('O anexo cita a mesma faixa, sem dizer de onde tirou o número.')},`,
      '};',
    ].join('\n');
  }

  return [
    '// O TRECHO MORA NA CITAÇÃO, e não na fonte: a mesma fonte apoia afirmações',
    '// diferentes com trechos diferentes, e guardá-lo dentro dela faria o mesmo',
    '// documento aparecer três vezes na lista de fontes do turno.',
    'const citation = {',
    `  source: { title: ${quote(TITLE)}, url: ${quote(ADDRESS)} },`,
    `  excerpt: ${quote('A receita cresceu doze por cento em relação ao ano anterior.')},`,
    `  anchor: ${quote('Página 12')},`,
    '};',
  ].join('\n');
}

/** Os rótulos, com o nome acessível já escrito. */
function labelsLines(index: number, title: string): string {
  return [
    '// O NOME ACESSÍVEL CHEGA ESCRITO. Ele traz a palavra, o número e o título —',
    '// e contém o número que se vê na tela, que é o que a WCAG 2.5.3 pede.',
    'const rotulos = {',
    `  marker: ${quote(`Fonte ${index}: ${title}`)},`,
    `  unsafeSource: ${quote('Endereço recusado')},`,
    '};',
  ].join('\n');
}

/**
 * O nome acessível de CADA marca, como função.
 *
 * Função, e não objeto: `marker` é o nome acessível de uma marca só, e ele leva
 * o número — que muda de marca para marca e chega de fora. Um objeto fixo
 * entregaria a mesma palavra às duas, e o botão da segunda anunciaria o número
 * da primeira. `unsafeSource` não depende de nada e entra igual nas duas, e o
 * objeto sai daqui COMPLETO: os dois campos são obrigatórios.
 */
function labelFnLines(): string {
  return [
    '// O NOME ACESSÍVEL CHEGA ESCRITO, e contém o número que se vê na tela, que',
    '// é o que a WCAG 2.5.3 pede.',
    'const rotuloDe = (index, citation) => ({',
    '  marker: `Fonte ${index}: ${citation.source.title}`,',
    `  unsafeSource: ${quote('Endereço recusado')},`,
    '});',
  ].join('\n');
}

/**
 * As citações do exemplo, escritas por extenso.
 *
 * Por extenso, e não importadas de um módulo de exemplos: o snippet ensina a
 * FORMA do dado, e são duas — o suficiente para mostrar que o número chega de
 * fora, e que a segunda pode não ter trecho nenhum.
 */
function citationListLines(): string {
  return [
    'const citacoes = [',
    `  { source: { title: ${quote(TITLE)}, url: ${quote(ADDRESS)} },`,
    `    excerpt: ${quote('A receita cresceu doze por cento em relação ao ano anterior.')},`,
    `    anchor: ${quote('Página 12')} },`,
    `  { source: { title: ${quote(TITLE_MINIMAL)}, url: ${quote('https://exemplo.test/metodo')} } },`,
    '];',
  ].join('\n');
}

/** A marca, com um atributo por linha. */
function mark(parts: Array<string | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part));
  return `<InlineCitation\n${list.map((part) => indentar(part)).join('\n')}\n/>`;
}

/** A frase que hospeda a marca, montada por quem escreve. */
function sentenceLines(markup: string): string {
  return [
    '// SEM ESPAÇO ANTES DA MARCA: entre duas EXPRESSÕES a quebra de linha não',
    '// vira espaço, e é assim que a marca não se separa da palavra que a',
    '// antecede quando a linha quebra. O espaço que existe vem depois dela.',
    '<p>',
    indentar(`{${quote(SENTENCE_HEAD)}}`),
    indentar(markup),
    indentar(`{${quote(`${SENTENCE_TAIL}.`)}}`),
    '</p>',
  ].join('\n');
}

function build(opts: InlineCitationSnippetOptions): string {
  const shape = opts.shape ?? 'full';
  const defaultOpen = opts.defaultOpen ?? false;

  const title =
    shape === 'minimal' ? TITLE_MINIMAL : shape === 'unsafe' ? TITLE_UNSAFE : TITLE;

  return jsxSnippet(
    IMPORT,
    [
      citationLines(shape),
      labelsLines(1, title),
      sentenceLines(
        mark([
          'citation={citation}',
          'index={1}',
          // `defaultOpen` só entra quando é `true`: passar o padrão explícito
          // ensinaria que ele precisa ser passado, e a marca recolhida é o caso
          // comum.
          defaultOpen ? 'defaultOpen' : undefined,
          'labels={rotulos}',
        ]),
      ),
    ].join('\n\n'),
  );
}

/** Transform do `meta` — o Playground, com os dois eixos nos controls. */
export const inlineCitationSource: SourceTransform<InlineCitationSnippetOptions> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({ shape: args.shape, defaultOpen: args.defaultOpen });
};

/**
 * A prévia aberta.
 *
 * O snippet ensina que abrir é ESTADO controlável, e que quem abre no uso
 * corrente é quem lê — `defaultOpen` está aqui para fotografar, e por isso ele
 * aparece só neste.
 */
export function inlineCitationExpandedSource(): string {
  return build({ shape: 'full', defaultOpen: true });
}

/**
 * A citação que só tem fonte.
 *
 * A borda que quem testar só com dado cheio nunca encontra: sem trecho e sem
 * lugar, a prévia monta o endereço e o título e para aí.
 */
export function inlineCitationMinimalSource(): string {
  return build({ shape: 'minimal', defaultOpen: true });
}

/**
 * A fonte cujo endereço foi recusado.
 *
 * O snippet mostra o dado que provoca a decisão, e não a decisão: quem consome
 * passa o endereço como ele chegou, e a peça responde.
 */
export function inlineCitationRefusedSource(): string {
  return build({ shape: 'unsafe', defaultOpen: true });
}

/**
 * Duas marcas na mesma frase.
 *
 * O laço é o assunto: a MESMA marca atende as duas, o que muda é a citação e o
 * número — e o número chega de fora, porque uma marca que se numerasse sozinha
 * precisaria conhecer as irmãs.
 */
export function inlineCitationInSentenceSource(): string {
  return jsxSnippet(
    ['import { Fragment } from "react";', IMPORT].join('\n'),
    [
      [citationListLines(), '', labelFnLines()].join('\n'),
      [
        '// A NUMERAÇÃO CHEGA DE FORA. Ela é conteúdo — é por ela que a frase se',
        '// refere à lista de fontes do turno — e marcas irmãs podem nem estar no',
        '// mesmo parágrafo.',
        '<p>',
        `  {${quote(SENTENCE_HEAD)}}`,
        '  {citacoes.map((citation, i) => (',
        '    <Fragment key={i}>',
        '      <InlineCitation',
        '        citation={citation}',
        '        index={i + 1}',
        '        labels={rotuloDe(i + 1, citation)}',
        '      />',
        `      {i === 0 ? ${quote(SENTENCE_TAIL)} : ${quote('.')}}`,
        '    </Fragment>',
        '  ))}',
        '</p>',
      ].join('\n'),
    ].join('\n\n'),
  );
}

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A EXCLUSÃO MÚTUA É DE QUEM MONTA A PÁGINA, e o snippet é o lugar em que isso
 * se ensina: a peça não conhece as vizinhas, e não conhecê-las é o que permite
 * que duas marcas da mesma frase venham de lugares diferentes da resposta.
 *
 * Nesta stack o comando chega por `ref` — é a divergência de API, e só de API:
 * o par "devolve cada abertura, aceita a ordem de fechar" é o mesmo das cinco.
 */
export function inlineCitationMutuallyExclusiveSource(): string {
  return jsxSnippet(
    [
      'import { Fragment, useRef } from "react";',
      'import { InlineCitation, type InlineCitationHandle } from "@/components/ui/inline-citation";',
    ].join('\n'),
    [
      [
        citationListLines(),
        '',
        labelFnLines(),
        '',
        '// A lista das marcas é de quem as montou, e o comando chega por `ref`.',
        'const marcas = useRef<Array<InlineCitationHandle | null>>([]);',
      ].join('\n'),
      [
        '<p>',
        `  {${quote(SENTENCE_HEAD)}}`,
        '  {citacoes.map((citation, i) => (',
        '    <Fragment key={i}>',
        '      <InlineCitation',
        '        ref={(marca) => { marcas.current[i] = marca; }}',
        '        citation={citation}',
        '        index={i + 1}',
        '        labels={rotuloDe(i + 1, citation)}',
        '        // A peça devolve cada abertura; o que decide QUEM fecha é a',
        '        // página, e não o componente.',
        '        onOpenChange={(aberta) => {',
        '          if (!aberta) return;',
        '          marcas.current.forEach((outra, j) => {',
        '            if (j !== i) outra?.close();',
        '          });',
        '        }}',
        '      />',
        `      {i === 0 ? ${quote(SENTENCE_TAIL)} : ${quote('.')}}`,
        '    </Fragment>',
        '  ))}',
        '</p>',
      ].join('\n'),
    ].join('\n\n'),
  );
}

/**
 * Os três casos, percorridos de uma vez.
 *
 * O laço é o assunto: a MESMA marca atende os três, e o que muda é o que a
 * citação traz — inteira, só com a fonte, ou com um endereço que não pode virar
 * link.
 */
export function inlineCitationEveryCaseSource(): string {
  return jsxSnippet(
    IMPORT,
    [
      citationListLines(),
      '',
      labelFnLines(),
      '',
      '// A peça desenha o que RECEBE: a mesma marca atende a citação inteira, a',
      '// que só tem fonte e a que traz um endereço que não pode virar link.',
      '{citacoes.map((citation, i) => (',
      '  <p key={i}>',
      `    {${quote(SENTENCE_HEAD)}}`,
      '    <InlineCitation',
      '      citation={citation}',
      '      index={i + 1}',
      '      defaultOpen',
      '      labels={rotuloDe(i + 1, citation)}',
      '    />',
      `    {${quote('.')}}`,
      '  </p>',
      '))}',
    ].join('\n'),
  );
}
