/**
 * Transforms do painel Code da citação em linha.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento, e com o
 * sufixo `Source` no FIM do nome. Fábrica curried devolveria função em vez de
 * string, e nome com o sufixo no meio sai da varredura em silêncio.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que a marca entra numa
 * frase que é de quem escreve, e que o nome acessível chega ESCRITO. As duas
 * juntas são o contrato — quem copiasse só a tag poria a marca depois de um
 * espaço, e um dia entregaria um botão cujo nome acessível é "1".
 *
 * Por isso a frase aparece montada em todos eles, com o comentário do espaço no
 * lugar em que ele importa. E é por isso que NENHUM snippet daqui monta a caixa
 * à mão: ela é filha da marca e sai da própria peça, e um snippet que a
 * montasse ensinaria uma composição que a peça não pede.
 */
import { vueSnippet, type SourceTransform } from '@/lib/story-source';

export type InlineCitationSnippetOptions = {
  /** Qual citação o exemplo passa. */
  shape?: 'full' | 'minimal' | 'unsafe';
  /** Nasce com a prévia aberta? */
  defaultOpen?: boolean;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { InlineCitation } from '@/components/ui/inline-citation';";

// O VOCABULÁRIO NÃO É DA PEÇA: `Citation` mora em `chat-protocol`, e é de lá
// que ele entra. Um snippet que o importasse do índice da peça ensinaria que
// ela é dona do tipo — e ela não é: a mesma `Citation` alimenta a lista de
// fontes do turno.
const IMPORT_WITH_VOCABULARY = [
  IMPORT,
  "import type { Citation } from '@shared/primitives/chat-protocol';",
].join('\n');

// O comando é tipado, e o tipo sai do índice da peça: é ele que descreve o que
// se pode pedir a uma marca montada.
const IMPORT_WITH_REFS = [
  "import { useTemplateRef } from 'vue';",
  "import { InlineCitation, type InlineCitationCommands } from '@/components/ui/inline-citation';",
  "import type { Citation } from '@shared/primitives/chat-protocol';",
].join('\n');

/** O título do documento do exemplo, o mesmo do módulo compartilhado. */
const TITLE = 'Relatório anual de operações';

/** O endereço do documento do exemplo. */
const ADDRESS = 'https://exemplo.test/relatorios/2025/operacoes';

/** O primeiro pedaço da frase — o que a marca apoia. */
const BEFORE = 'A receita cresceu doze por cento no último ano';

/** O que vem entre a primeira marca e a segunda. */
const BETWEEN = ', e a metodologia por trás do número está publicada';

/**
 * As duas citações das composições, por extenso.
 *
 * A segunda é a MÍNIMA de propósito: numa foto só se vê que a prévia desenha o
 * que veio, e que citar um documento sem saber a página acontece.
 */
const CITATIONS_LINES = [
  'const citacoes: Citation[] = [',
  `  { source: { title: '${TITLE}', url: '${ADDRESS}' },`,
  "    excerpt: 'A receita cresceu doze por cento em relação ao ano anterior.',",
  "    anchor: 'Página 12' },",
  "  { source: { title: 'Nota metodológica da pesquisa', url: 'https://exemplo.test/metodo' } },",
  '];',
].join('\n');

/**
 * As TRÊS citações que a peça desenha diferente.
 *
 * Uma traz tudo, uma traz só a fonte, e uma traz um endereço que não pode virar
 * link — exemplo que evita a borda é exemplo que nunca mostra a regra.
 */
const EVERY_CASE_CITATIONS_LINES = [
  'const citacoes: Citation[] = [',
  `  { source: { title: '${TITLE}', url: '${ADDRESS}' },`,
  "    excerpt: 'A receita cresceu doze por cento em relação ao ano anterior.',",
  "    anchor: 'Página 12' },",
  "  { source: { title: 'Nota metodológica da pesquisa', url: 'https://exemplo.test/metodo' } },",
  "  { source: { title: 'Anexo enviado pelo agente', url: 'javascript:alert(1)' },",
  "    excerpt: 'O anexo cita a mesma faixa, sem dizer de onde tirou o número.' },",
  '];',
].join('\n');

/**
 * O nome acessível de cada marca, montado por QUEM ESCREVE A FRASE.
 *
 * A numeração chega de fora porque é conteúdo, e o título entra porque sem ele
 * o nome não responde a de qual fonte se trata.
 */
const LABEL_BUILDER_LINES = [
  'const rotuloDe = (indice: number, citation: Citation) => ({',
  "  marker: `Fonte ${indice}: ${citation.source.title}`,",
  "  unsafeSource: 'Endereço recusado',",
  '});',
].join('\n');

/** O título e o endereço do exemplo daquele caso. */
function documentOf(shape: 'full' | 'minimal' | 'unsafe'): { title: string; url: string } {
  if (shape === 'minimal') {
    return { title: 'Nota metodológica da pesquisa', url: 'https://exemplo.test/metodo' };
  }
  if (shape === 'unsafe') {
    return { title: 'Anexo enviado pelo agente', url: 'javascript:alert(1)' };
  }
  return { title: TITLE, url: ADDRESS };
}

/**
 * A citação do exemplo, escrita por extenso.
 *
 * Por extenso, e não importada de um módulo de exemplos: o snippet ensina a
 * FORMA do dado, e quem copia precisa ver os três campos para saber que o trecho
 * mora na citação e não na fonte.
 */
function citationLines(shape: 'full' | 'minimal' | 'unsafe'): string {
  const doc = documentOf(shape);

  if (shape === 'minimal') {
    return [
      '// SEM TRECHO E SEM LUGAR. Citar um documento sem saber a página acontece,',
      '// e a prévia responde não montando o que não veio.',
      'const citation = {',
      `  source: { title: '${doc.title}', url: '${doc.url}' },`,
      '};',
    ].join('\n');
  }

  if (shape === 'unsafe') {
    return [
      '// O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é entrada.',
      '// A peça pergunta se ele pode virar link no ponto em que ele encosta na',
      '// página: o que não passa continua legível e deixa de ser link.',
      'const citation = {',
      `  source: { title: '${doc.title}', url: '${doc.url}' },`,
      "  excerpt: 'O anexo cita a mesma faixa, sem dizer de onde tirou o número.',",
      '};',
    ].join('\n');
  }

  return [
    '// O TRECHO MORA NA CITAÇÃO, e não na fonte: a mesma fonte apoia afirmações',
    '// diferentes com trechos diferentes, e guardá-lo dentro dela faria o mesmo',
    '// documento aparecer três vezes na lista de fontes do turno.',
    'const citation = {',
    `  source: { title: '${doc.title}', url: '${doc.url}' },`,
    "  excerpt: 'A receita cresceu doze por cento em relação ao ano anterior.',",
    "  anchor: 'Página 12',",
    '};',
  ].join('\n');
}

/** Os rótulos, com o nome acessível já escrito. */
function labelsLines(index: number, title: string): string {
  return [
    '// O NOME ACESSÍVEL CHEGA ESCRITO. Ele traz a palavra, o número e o título —',
    '// e contém o número que se vê na tela, que é o que a WCAG 2.5.3 pede.',
    'const rotulos = {',
    `  marker: 'Fonte ${index}: ${title}',`,
    "  unsafeSource: 'Endereço recusado',",
    '};',
  ].join('\n');
}

/**
 * A frase que hospeda as marcas, montada por quem escreve.
 *
 * SEM ESPAÇO ANTES DA MARCA: cada pedaço de texto encosta na tag que vem
 * depois dele, e é assim que a marca não se separa da palavra que a antecede
 * quando a linha quebra. O espaço que existe vem sempre DEPOIS dela.
 */
function sentenceBlock(marks: Array<{ before: string; attributes: string[] }>, after: string): string {
  const lines: string[] = [
    '<!-- SEM ESPAÇO ANTES DA MARCA: é assim que ela não se separa da palavra que',
    '     a antecede quando a linha quebra. O espaço vem depois dela. -->',
    '<p>',
    `  ${marks[0].before}<InlineCitation`,
  ];

  marks.forEach((mark, i) => {
    for (const attribute of mark.attributes) lines.push(`    ${attribute}`);
    const next = marks[i + 1];
    // O fechamento e o texto seguinte na MESMA LINHA: quebrar aqui poria um
    // espaço entre a marca e o que vem depois dela, que é o oposto da regra.
    lines.push(next ? `  />${next.before}<InlineCitation` : `  />${after}`);
  });

  lines.push('</p>');
  return lines.join('\n');
}

function build(opts: InlineCitationSnippetOptions): string {
  const shape = opts.shape ?? 'full';
  const doc = documentOf(shape);

  const attributes = [
    ':citation="citation"',
    ':index="1"',
    // `default-open` só entra quando é `true`: passar o padrão explícito
    // ensinaria que ele precisa ser passado, e a marca recolhida é o caso comum.
    ...(opts.defaultOpen ? ['default-open'] : []),
    ':labels="rotulos"',
  ];

  return vueSnippet(
    [IMPORT, '', citationLines(shape), '', labelsLines(1, doc.title)].join('\n'),
    sentenceBlock([{ before: BEFORE, attributes }], '.'),
  );
}

/** Transform do `meta` — o Playground, com os dois eixos nos controls. */
export const inlineCitationSource: SourceTransform<InlineCitationSnippetOptions> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return build({ shape: args.shape, defaultOpen: args.defaultOpen });
};

/**
 * A prévia aberta.
 *
 * O snippet ensina que abrir é ESTADO controlável, e que quem abre no uso
 * corrente é quem lê — `default-open` está aqui para fotografar, e por isso ele
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
 * A NUMERAÇÃO CHEGA DE FORA, e é o assunto: ela é conteúdo — é por ela que a
 * frase se refere à lista de fontes do turno — e uma marca que se numerasse
 * sozinha precisaria conhecer as irmãs, que podem nem estar no mesmo parágrafo.
 */
export function inlineCitationInSentenceSource(): string {
  return vueSnippet(
    [IMPORT_WITH_VOCABULARY, '', CITATIONS_LINES, '', LABEL_BUILDER_LINES].join('\n'),
    sentenceBlock(
      [
        {
          before: BEFORE,
          attributes: [
            ':citation="citacoes[0]"',
            ':index="1"',
            ':labels="rotuloDe(1, citacoes[0])"',
          ],
        },
        {
          before: BETWEEN,
          attributes: [
            ':citation="citacoes[1]"',
            ':index="2"',
            ':labels="rotuloDe(2, citacoes[1])"',
          ],
        },
      ],
      '.',
    ),
  );
}

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A EXCLUSÃO MÚTUA É DE QUEM MONTA A PÁGINA, e o snippet é o lugar em que isso
 * se ensina: a peça não conhece as vizinhas, e não conhecê-las é o que permite
 * que duas marcas da mesma frase venham de lugares diferentes da resposta. Ela
 * devolve cada abertura por evento e aceita a ordem de fechar por comando; o
 * que decide QUEM fecha é a página.
 */
export function inlineCitationMutuallyExclusiveSource(): string {
  const script = [
    IMPORT_WITH_REFS,
    '',
    CITATIONS_LINES,
    '',
    LABEL_BUILDER_LINES,
    '',
    '// O COMANDO CHEGA POR `ref` DE TEMPLATE, que é a forma desta stack para',
    '// falar com uma instância montada. Não há propriedade de abertura para',
    '// espelhar: a peça abre e fecha por ordem.',
    "const primeira = useTemplateRef<InlineCitationCommands>('primeira');",
    "const segunda = useTemplateRef<InlineCitationCommands>('segunda');",
  ].join('\n');

  return vueSnippet(
    script,
    sentenceBlock(
      [
        {
          before: BEFORE,
          attributes: [
            'ref="primeira"',
            ':citation="citacoes[0]"',
            ':index="1"',
            ':labels="rotuloDe(1, citacoes[0])"',
            '@open-change="aberta => { if (aberta) segunda?.close(); }"',
          ],
        },
        {
          before: BETWEEN,
          attributes: [
            'ref="segunda"',
            ':citation="citacoes[1]"',
            ':index="2"',
            ':labels="rotuloDe(2, citacoes[1])"',
            '@open-change="aberta => { if (aberta) primeira?.close(); }"',
          ],
        },
      ],
      '.',
    ),
  );
}

/**
 * Os três casos, percorridos de uma vez.
 *
 * O laço é o assunto: a MESMA tag atende a citação inteira, a que só tem fonte
 * e a que traz um endereço que não pode virar link. A peça desenha o que
 * RECEBE.
 */
export function inlineCitationEveryCaseSource(): string {
  const template = [
    '<!-- Uma frase por citação, e a mesma tag nas três: o que muda é o que a',
    '     citação traz, e não a chamada. -->',
    '<p',
    '  v-for="(citation, i) in citacoes"',
    '  :key="i"',
    `>${BEFORE}<InlineCitation`,
    '  :citation="citation"',
    '  :index="1"',
    '  default-open',
    '  :labels="rotuloDe(1, citation)"',
    '/>.</p>',
  ].join('\n');

  return vueSnippet(
    [IMPORT_WITH_VOCABULARY, '', EVERY_CASE_CITATIONS_LINES, '', LABEL_BUILDER_LINES].join('\n'),
    template,
  );
}
