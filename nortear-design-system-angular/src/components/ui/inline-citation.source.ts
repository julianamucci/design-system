/**
 * Transforms do painel Code da citação em linha.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara a citação, os
 * rótulos e a frase que hospeda a marca.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento, e o
 * sufixo `Source` fica no FIM do nome — é assim que a varredura de
 * `source-snippets.test.ts` alcança todas. Fábrica curried devolveria função em
 * vez de string, e as checagens que leem o snippet nunca chegariam ao snippet.
 *
 * CADA SNIPPET DAQUI ENSINA DUAS COISAS, e não uma: que a marca entra numa frase
 * que é de quem escreve, e que o nome acessível chega ESCRITO. As duas juntas
 * são o contrato — quem copiasse só a tag poria a marca depois de um espaço, e
 * um dia entregaria um botão cujo nome acessível é "1".
 *
 * E é por isso que NENHUM snippet daqui monta a caixa à mão: ela é filha da
 * marca e sai do próprio componente, e um snippet que a montasse ensinaria uma
 * composição que a peça não pede.
 *
 * TODO BINDING DO TEMPLATE É MEMBRO DECLARADO no próprio snippet, e não uma
 * constante importada no topo: expressão de template do Angular só enxerga
 * membro de classe, e quem copiasse receberia um binding que não resolve.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsInlineCitation } from '@/components/ui/inline-citation';";

const VIEW_CHILDREN_IMPORT = "import { Component, viewChildren } from '@angular/core';";

/** O título do documento do exemplo, o mesmo do módulo compartilhado. */
const TITLE = 'Relatório anual de operações';

/** O endereço do documento do exemplo. */
const ADDRESS = 'https://exemplo.test/relatorios/2025/operacoes';

/** O pedaço da frase que vem ANTES da marca. Não termina em espaço. */
const BEFORE = 'A receita cresceu doze por cento no último ano';

/** O pedaço que vem depois da primeira marca. */
const AFTER_FIRST = ', e a metodologia por trás do número está publicada';

/** O que fecha a frase. */
const AFTER_LAST = '.';

/** O que as stories mudam, e que o snippet precisa mostrar. */
export type InlineCitationSnippetOptions = {
  /** Qual citação o exemplo passa. */
  shape?: 'full' | 'minimal' | 'unsafe';
  /** Nasce com a prévia aberta? */
  defaultOpen?: boolean;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type InlineCitationSourceTransform = (
  code: string,
  ctx?: { args?: { shape?: 'full' | 'minimal' | 'unsafe'; defaultOpen?: boolean } },
) => string;

/**
 * Uma cadeia entre aspas simples, como o resto do design system a escreve.
 *
 * Aspas simples e não `JSON.stringify`: o snippet é código que alguém copia para
 * dentro deste repositório, e a aspa dupla reprovaria o lint dele.
 */
function text(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], used: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    `  imports: [${used.join(', ')}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** A citação do exemplo, escrita por extenso. */
function citationMember(shape: 'full' | 'minimal' | 'unsafe'): string[] {
  if (shape === 'minimal') {
    return [
      '  // SEM TRECHO E SEM LUGAR. Citar um documento sem saber a página',
      '  // acontece, e a prévia responde não montando o que não veio.',
      '  readonly citation = {',
      `    source: { title: ${text('Nota metodológica da pesquisa')}, url: ${text('https://exemplo.test/metodo')} },`,
      '  };',
    ];
  }

  if (shape === 'unsafe') {
    return [
      '  // O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é',
      '  // entrada. A peça pergunta se ele pode virar link no ponto em que ele',
      '  // encosta na página: o que não passa continua legível e deixa de ser',
      '  // link.',
      '  readonly citation = {',
      `    source: { title: ${text('Anexo enviado pelo agente')}, url: ${text('javascript:alert(1)')} },`,
      `    excerpt: ${text('O anexo cita a mesma faixa, sem dizer de onde tirou o número.')},`,
      '  };',
    ];
  }

  return [
    '  // O TRECHO MORA NA CITAÇÃO, e não na fonte: a mesma fonte apoia',
    '  // afirmações diferentes com trechos diferentes, e guardá-lo dentro dela',
    '  // faria o mesmo documento aparecer três vezes na lista de fontes do turno.',
    '  readonly citation = {',
    `    source: { title: ${text(TITLE)}, url: ${text(ADDRESS)} },`,
    `    excerpt: ${text('A receita cresceu doze por cento em relação ao ano anterior.')},`,
    `    anchor: ${text('Página 12')},`,
    '  };',
  ];
}

/** Os rótulos, com o nome acessível já escrito. */
function labelsMember(index: number, title: string): string[] {
  return [
    '  // O NOME ACESSÍVEL CHEGA ESCRITO. Ele traz a palavra, o número e o',
    '  // título — e contém o número que se vê na tela, que é o que a WCAG 2.5.3',
    '  // pede.',
    '  readonly rotulos = {',
    `    marker: ${text(`Fonte ${index}: ${title}`)},`,
    `    unsafeSource: ${text('Endereço recusado')},`,
    '  };',
  ];
}

/** A frase que hospeda a marca, escrita por quem consome. */
function sentenceMembers(): string[] {
  return [
    '  // A FRASE É DE QUEM ESCREVE. A peça é a MARCA, e quem escreve a decide',
    '  // onde a afirmação precisa de apoio.',
    `  readonly antes = ${text(BEFORE)};`,
    `  readonly depois = ${text(AFTER_LAST)};`,
  ];
}

/** O título do documento de cada configuração. */
function titleOf(shape: 'full' | 'minimal' | 'unsafe'): string {
  if (shape === 'minimal') return 'Nota metodológica da pesquisa';
  if (shape === 'unsafe') return 'Anexo enviado pelo agente';
  return TITLE;
}

/** Uma marca dentro de uma frase, na configuração que a story desenha. */
function single(opts: InlineCitationSnippetOptions): string {
  const shape = opts.shape ?? 'full';
  const defaultOpen = opts.defaultOpen ?? false;

  return build(
    [IMPORT],
    ['NdsInlineCitation'],
    [
      '    <!-- SEM ESPAÇO ANTES DA MARCA: é assim que ela não se separa da',
      '         palavra que a antecede quando a linha quebra. O espaço que existe',
      '         vem DEPOIS dela, no começo do pedaço seguinte. -->',
      '    <p>{{ antes }}<span',
      '        ndsInlineCitation',
      '        [citation]="citation"',
      '        [index]="1"',
      '        [labels]="rotulos"',
      // `defaultOpen` só entra quando é `true`: passar o padrão explícito
      // ensinaria que ele precisa ser passado, e a marca recolhida é o comum.
      ...(defaultOpen ? ['        [defaultOpen]="true"'] : []),
      '      ></span>{{ depois }}</p>',
    ],
    [
      ...citationMember(shape),
      '',
      ...labelsMember(1, titleOf(shape)),
      '',
      ...sentenceMembers(),
    ],
  );
}

/** Transform do `meta` — o Playground, com os dois eixos nos controls. */
export const inlineCitationSource: InlineCitationSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({ shape: args.shape, defaultOpen: args.defaultOpen });
};

/**
 * A prévia aberta.
 *
 * O snippet ensina que abrir é ESTADO controlável, e que quem abre no uso
 * corrente é quem lê — `defaultOpen` está aqui para fotografar, e por isso ele
 * aparece só neste.
 */
export function inlineCitationExpandedSource(): string {
  return single({ shape: 'full', defaultOpen: true });
}

/**
 * A citação que só tem fonte.
 *
 * A borda que quem testar só com dado cheio nunca encontra: sem trecho e sem
 * lugar, a prévia monta o endereço e o título e para aí.
 */
export function inlineCitationMinimalSource(): string {
  return single({ shape: 'minimal', defaultOpen: true });
}

/**
 * A fonte cujo endereço foi recusado.
 *
 * O snippet mostra o dado que provoca a decisão, e não a decisão: quem consome
 * passa o endereço como ele chegou, e a peça responde.
 */
export function inlineCitationRefusedSource(): string {
  return single({ shape: 'unsafe', defaultOpen: true });
}

/** As duas marcas da frase, já numeradas por quem escreve. */
function slotsMember(): string[] {
  return [
    '  // A NUMERAÇÃO CHEGA DE FORA. Ela é conteúdo — é por ela que a frase se',
    '  // refere à lista de fontes do turno — e marcas irmãs podem nem estar no',
    '  // mesmo parágrafo. O pedaço de texto que SEGUE cada marca viaja junto com',
    '  // ela: é o que permite intercalar frase e marca sem espaço nas emendas.',
    '  readonly slots = [',
    '    {',
    `      citation: { source: { title: ${text(TITLE)}, url: ${text(ADDRESS)} },`,
    `        excerpt: ${text('A receita cresceu doze por cento em relação ao ano anterior.')},`,
    `        anchor: ${text('Página 12')} },`,
    '      index: 1,',
    `      labels: { marker: ${text(`Fonte 1: ${TITLE}`)}, unsafeSource: ${text('Endereço recusado')} },`,
    `      tail: ${text(AFTER_FIRST)},`,
    '    },',
    '    {',
    `      citation: { source: { title: ${text('Nota metodológica da pesquisa')}, url: ${text('https://exemplo.test/metodo')} } },`,
    '      index: 2,',
    `      labels: { marker: ${text('Fonte 2: Nota metodológica da pesquisa')}, unsafeSource: ${text('Endereço recusado')} },`,
    `      tail: ${text(AFTER_LAST)},`,
    '    },',
    '  ];',
  ];
}

/**
 * Duas marcas na mesma frase.
 *
 * O laço é o assunto: a MESMA tag atende as duas, e o que muda é a citação e o
 * número — que chega de fora, porque uma marca que se numerasse sozinha
 * precisaria conhecer as irmãs.
 */
export function inlineCitationInSentenceSource(): string {
  return build(
    [IMPORT],
    ['NdsInlineCitation'],
    [
      '    <p>{{ antes }}@for (slot of slots; track slot.index) {<span',
      '          ndsInlineCitation',
      '          [citation]="slot.citation"',
      '          [index]="slot.index"',
      '          [labels]="slot.labels"',
      '        ></span>{{ slot.tail }}}</p>',
    ],
    [
      `  readonly antes = ${text(BEFORE)};`,
      '',
      ...slotsMember(),
    ],
  );
}

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A EXCLUSÃO MÚTUA É DE QUEM MONTA A PÁGINA, e o snippet é o lugar em que isso
 * se ensina: a peça não conhece as vizinhas, e não conhecê-las é o que permite
 * que duas marcas da mesma frase venham de lugares diferentes da resposta.
 *
 * Nesta stack o par é `openChange` mais o COMANDO: a peça devolve cada abertura,
 * e quem tem a lista alcança as irmãs por `viewChildren` e manda fechar.
 */
export function inlineCitationMutuallyExclusiveSource(): string {
  return build(
    [VIEW_CHILDREN_IMPORT, IMPORT],
    ['NdsInlineCitation'],
    [
      '    <p>{{ antes }}@for (slot of slots; track slot.index) {<span',
      '          ndsInlineCitation',
      '          [citation]="slot.citation"',
      '          [index]="slot.index"',
      '          [labels]="slot.labels"',
      '          (openChange)="aoMudar($event, slot.index)"',
      '        ></span>{{ slot.tail }}}</p>',
    ],
    [
      `  readonly antes = ${text(BEFORE)};`,
      '',
      ...slotsMember(),
      '',
      '  // O COMANDO é como esta stack controla a peça: as instâncias chegam por',
      '  // consulta de vista, e fechar é chamar o método nelas.',
      '  private readonly marcas = viewChildren(NdsInlineCitation);',
      '',
      '  // A peça devolve cada abertura e aceita a ordem de fechar; o que decide',
      '  // QUEM fecha é a página, não o componente.',
      '  aoMudar(aberta: boolean, index: number): void {',
      '    if (!aberta) return;',
      '    for (const marca of this.marcas()) {',
      '      if (marca.index() !== index) marca.close();',
      '    }',
      '  }',
    ],
  );
}

/**
 * Os três casos, percorridos de uma vez.
 *
 * O laço é o assunto: a MESMA tag atende os três, e o que muda é o que a citação
 * traz — a inteira, a que só tem fonte e a que traz um endereço que não pode
 * virar link.
 */
export function inlineCitationEveryCaseSource(): string {
  return build(
    [IMPORT],
    ['NdsInlineCitation'],
    [
      '    @for (item of exemplos; track item.index) {',
      '      <p>{{ antes }}<span',
      '          ndsInlineCitation',
      '          [citation]="item.citation"',
      '          [index]="item.index"',
      '          [labels]="item.labels"',
      '          [defaultOpen]="true"',
      '        ></span>{{ depois }}</p>',
      '    }',
    ],
    [
      '  // A peça desenha o que RECEBE: a mesma tag atende a citação inteira, a',
      '  // que só tem fonte e a que traz um endereço que não pode virar link.',
      '  readonly exemplos = casosDaDemonstracao;',
      '',
      ...sentenceMembers(),
    ],
  );
}
