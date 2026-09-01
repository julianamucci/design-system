// Snippet do painel Code da citação em linha — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// Cada snippet daqui ensina DUAS coisas, e não uma: que a marca entra numa frase
// que é de quem escreve, e que o nome acessível chega ESCRITO. As duas juntas
// são o contrato — quem copiasse só a chamada da fábrica poria a marca depois de
// um espaço, e um dia entregaria um botão cujo nome acessível é "1".
//
// Por isso a frase aparece montada em todos eles, com o comentário do espaço no
// lugar em que ele importa. E é por isso que NENHUM snippet daqui monta a caixa
// à mão: ela é filha da marca e sai da própria fábrica, e um snippet que a
// montasse ensinaria uma composição que a peça não pede.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

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

/**
 * A citação do exemplo, escrita por extenso.
 *
 * Por extenso, e não importada de um módulo de exemplos: o snippet ensina a
 * FORMA do dado, e quem copia precisa ver os três campos para saber que o trecho
 * mora na citação e não na fonte.
 */
function citationLines(shape: 'full' | 'minimal' | 'unsafe'): string {
  if (shape === 'minimal') {
    return [
      '// SEM TRECHO E SEM LUGAR. Citar um documento sem saber a página acontece,',
      '// e a prévia responde não montando o que não veio.',
      'const citation = {',
      `  source: { title: ${text('Nota metodológica da pesquisa')}, url: ${text('https://exemplo.test/metodo')} },`,
      '};',
    ].join('\n');
  }

  if (shape === 'unsafe') {
    return [
      '// O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é entrada.',
      '// A peça pergunta se ele pode virar link no ponto em que ele encosta na',
      '// página: o que não passa continua legível e deixa de ser link.',
      'const citation = {',
      `  source: { title: ${text('Anexo enviado pelo agente')}, url: ${text('javascript:alert(1)')} },`,
      `  excerpt: ${text('O anexo cita a mesma faixa, sem dizer de onde tirou o número.')},`,
      '};',
    ].join('\n');
  }

  return [
    '// O TRECHO MORA NA CITAÇÃO, e não na fonte: a mesma fonte apoia afirmações',
    '// diferentes com trechos diferentes, e guardá-lo dentro dela faria o mesmo',
    '// documento aparecer três vezes na lista de fontes do turno.',
    'const citation = {',
    `  source: { title: ${text(TITLE)}, url: ${text(ADDRESS)} },`,
    `  excerpt: ${text('A receita cresceu doze por cento em relação ao ano anterior.')},`,
    `  anchor: ${text('Página 12')},`,
    '};',
  ].join('\n');
}

/** Os rótulos, com o nome acessível já escrito. */
function labelsLines(index: number, title: string): string {
  return [
    '// O NOME ACESSÍVEL CHEGA ESCRITO. Ele traz a palavra, o número e o título —',
    '// e contém o número que se vê na tela, que é o que a WCAG 2.5.3 pede.',
    'const rotulos = {',
    `  marker: ${text(`Fonte ${index}: ${title}`)},`,
    `  unsafeSource: ${text('Endereço recusado')},`,
    '};',
  ].join('\n');
}

/** A frase que hospeda a marca, montada por quem escreve. */
function sentenceLines(variable: string, before: string, after: string): string {
  return [
    '// SEM ESPAÇO ANTES DA MARCA: é assim que ela não se separa da palavra que a',
    '// antecede quando a linha quebra. O espaço que existe vem depois dela.',
    `const frase = document.createElement('p');`,
    `frase.append(${text(before)}, ${variable}, ${text(after)});`,
  ].join('\n');
}

function build(opts: InlineCitationSnippetOptions): string {
  const shape = opts.shape ?? 'full';
  const defaultOpen = opts.defaultOpen ?? false;

  const title =
    shape === 'minimal'
      ? 'Nota metodológica da pesquisa'
      : shape === 'unsafe'
        ? 'Anexo enviado pelo agente'
        : TITLE;

  const lines = options([
    ['citation', 'citation'],
    ['index', '1'],
    // `defaultOpen` só entra quando é `true`: passar o padrão explícito
    // ensinaria que ele precisa ser passado, e a marca recolhida é o caso comum.
    ['defaultOpen', defaultOpen ? 'true' : undefined],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    importing('inline-citation', 'createInlineCitation'),
    citationLines(shape),
    labelsLines(1, title),
    `const marca = ${callLine('createInlineCitation', lines)};`,
    sentenceLines('marca', 'A receita cresceu doze por cento no último ano', '.'),
    appendLine('frase'),
  );
}

/** Transform do `meta` — o Playground, com os dois eixos nos controls. */
export const inlineCitationSource: SourceTransform<InlineCitationSnippetOptions> = (_c, ctx) => {
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
export function inlineCitationSourceExpanded(): string {
  return build({ shape: 'full', defaultOpen: true });
}

/**
 * A citação que só tem fonte.
 *
 * A borda que quem testar só com dado cheio nunca encontra: sem trecho e sem
 * lugar, a prévia monta o endereço e o título e para aí.
 */
export function inlineCitationSourceMinimal(): string {
  return build({ shape: 'minimal', defaultOpen: true });
}

/**
 * A fonte cujo endereço foi recusado.
 *
 * O snippet mostra o dado que provoca a decisão, e não a decisão: quem consome
 * passa o endereço como ele chegou, e a peça responde.
 */
export function inlineCitationSourceRefused(): string {
  return build({ shape: 'unsafe', defaultOpen: true });
}

/**
 * Duas marcas na mesma frase.
 *
 * O laço é o assunto: a MESMA chamada atende as duas, o que muda é a citação e o
 * número — e o número chega de fora, porque uma marca que se numerasse sozinha
 * precisaria conhecer as irmãs.
 */
export function inlineCitationSourceInSentence(): string {
  return snippet(
    importing('inline-citation', 'createInlineCitation'),
    [
      'const citacoes = [',
      `  { source: { title: ${text(TITLE)}, url: ${text(ADDRESS)} },`,
      `    excerpt: ${text('A receita cresceu doze por cento em relação ao ano anterior.')},`,
      `    anchor: ${text('Página 12')} },`,
      `  { source: { title: ${text('Nota metodológica da pesquisa')}, url: ${text('https://exemplo.test/metodo')} } },`,
      '];',
    ].join('\n'),
    [
      '// A NUMERAÇÃO CHEGA DE FORA. Ela é conteúdo — é por ela que a frase se',
      '// refere à lista de fontes do turno — e marcas irmãs podem nem estar no',
      '// mesmo parágrafo.',
      `const frase = document.createElement('p');`,
      `frase.append(${text('A receita cresceu doze por cento no último ano')});`,
      '',
      'for (const [i, citation] of citacoes.entries()) {',
      '  frase.append(',
      `    ${callLine('createInlineCitation', options([
        ['citation', 'citation'],
        ['index', 'i + 1'],
        ['labels', '{ marker: rotuloDe(i + 1, citation), unsafeSource: recusado }'],
      ]))},`,
      `    i === 0 ? ${text(', e a metodologia por trás do número está publicada')} : ${text('.')},`,
      '  );',
      '}',
    ].join('\n'),
    appendLine('frase'),
  );
}

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A EXCLUSÃO MÚTUA É DE QUEM MONTA A PÁGINA, e o snippet é o lugar em que isso
 * se ensina: a peça não conhece as vizinhas, e não conhecê-las é o que permite
 * que duas marcas da mesma frase venham de lugares diferentes da resposta.
 */
export function inlineCitationSourceMutuallyExclusive(): string {
  return snippet(
    importing('inline-citation', 'createInlineCitation'),
    [
      'const marcas = [];',
      '',
      'for (const [i, citation] of citacoes.entries()) {',
      `  const marca = ${callLine('createInlineCitation', options([
        ['citation', 'citation'],
        ['index', 'i + 1'],
        ['labels', '{ marker: rotuloDe(i + 1, citation), unsafeSource: recusado }'],
        ['onOpenChange', 'aberta => { if (aberta) fecharAsOutras(marcas, marca); }'],
      ]))};`,
      '  marcas.push(marca);',
      '}',
      '',
      '// A peça devolve cada abertura e aceita a ordem de fechar por comando; o',
      '// que decide QUEM fecha é a página, não o componente.',
      'const fecharAsOutras = (lista, atual) => {',
      '  for (const outra of lista) if (outra !== atual) outra.close();',
      '};',
    ].join('\n'),
  );
}

/**
 * Os quatro casos, percorridos de uma vez.
 *
 * O laço é o assunto: a MESMA chamada atende os quatro, e o que muda é o que a
 * citação traz e se a prévia nasce aberta.
 */
export function inlineCitationSourceEveryCase(): string {
  return snippet(
    importing('inline-citation', 'createInlineCitation'),
    [
      '// A peça desenha o que RECEBE: a mesma chamada atende a citação inteira, a',
      '// que só tem fonte e a que traz um endereço que não pode virar link.',
      'for (const [i, citation] of citacoes.entries()) {',
      `  document.querySelector('#app')?.append(`,
      `    ${callLine('createInlineCitation', options([
        ['citation', 'citation'],
        ['index', 'i + 1'],
        ['defaultOpen', 'true'],
        ['labels', '{ marker: rotuloDe(i + 1, citation), unsafeSource: recusado }'],
      ]))},`,
      '  );',
      '}',
    ].join('\n'),
  );
}
