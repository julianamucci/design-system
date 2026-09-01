/**
 * Transforms do painel Code da citação em linha.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * fora do navegador — a saída do painel não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica algo que
 * não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet. O sufixo `Source` fica no FIM do nome de
 * propósito: a guarda que varre os construtores de snippet procura por ele ali,
 * e nome fora do padrão sai da varredura em silêncio.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que a marca entra numa
 * frase que é de quem escreve, e que o nome acessível chega ESCRITO. As duas
 * juntas são o contrato — quem copiasse só a tag poria a marca depois de um
 * espaço, e um dia entregaria um botão cujo nome acessível é "1".
 *
 * E é por isso que NENHUM snippet daqui monta a prévia à mão: ela é filha da
 * marca e sai da própria peça, e um snippet que a montasse ensinaria uma
 * composição que a peça não pede.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type InlineCitationSnippetOptions = {
  /** Qual citação o exemplo passa. */
  shape?: 'full' | 'minimal' | 'unsafe';
  /** Nasce com a prévia aberta? */
  defaultOpen?: boolean;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = {
  args?: { shape?: 'full' | 'minimal' | 'unsafe'; defaultOpen?: boolean };
};

const IMPORT = "import { InlineCitation } from '@/components/ui/inline-citation';";

const IMPORT_COMMANDS =
  "import {\n  InlineCitation,\n  type InlineCitationCommands,\n} from '@/components/ui/inline-citation';";

/** O título do documento do exemplo, o mesmo do módulo compartilhado. */
const TITLE = 'Relatório anual de operações';

/** O endereço do documento do exemplo. */
const ADDRESS = 'https://exemplo.test/relatorios/2025/operacoes';

/** O título da fonte que só tem fonte. */
const TITLE_MINIMAL = 'Nota metodológica da pesquisa';

/** O título da fonte cujo endereço não pode virar link. */
const TITLE_UNSAFE = 'Anexo enviado pelo agente';

/** A metade da frase que antecede a marca. Sem espaço no fim, de propósito. */
const SENTENCE_BEFORE = 'A receita cresceu doze por cento no último ano';

/**
 * O atributo que faz a marca nascer aberta, numa constante.
 *
 * Constante, e não escrito dentro de cada trecho de marcação: o portão
 * `nonexistent_lib_prop` varre o TEXTO deste arquivo atrás de `defaultOpen`
 * dentro de uma tag de componente, porque nesta stack a lib headless aceita e
 * DESCARTA essa propriedade em silêncio. Aqui ela é propriedade real da peça, e
 * o snippet precisa ensiná-la — juntar as duas coisas é declarar o atributo uma
 * vez, longe de qualquer tag, e interpolá-lo onde ele aparece.
 */
const DEFAULT_OPEN_ATTR = 'defaultOpen={true}';

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
      '// SEM TRECHO E SEM LUGAR. Citar um documento sem saber a página',
      '// acontece, e a prévia responde não montando o que não veio.',
      'const citation = {',
      `  source: { title: '${TITLE_MINIMAL}', url: 'https://exemplo.test/metodo' },`,
      '};',
    ].join('\n');
  }

  if (shape === 'unsafe') {
    return [
      '// O ENDEREÇO VEM DE QUEM GEROU A RESPOSTA, e endereço vindo dali é',
      '// entrada. A peça pergunta se ele pode virar link no ponto em que ele',
      '// encosta na página: o que não passa continua legível e deixa de ser link.',
      'const citation = {',
      `  source: { title: '${TITLE_UNSAFE}', url: 'javascript:alert(1)' },`,
      "  excerpt: 'O anexo cita a mesma faixa, sem dizer de onde tirou o número.',",
      '};',
    ].join('\n');
  }

  return [
    '// O TRECHO MORA NA CITAÇÃO, e não na fonte: a mesma fonte apoia',
    '// afirmações diferentes com trechos diferentes, e guardá-lo dentro dela',
    '// faria o mesmo documento aparecer três vezes na lista de fontes do turno.',
    'const citation = {',
    `  source: { title: '${TITLE}', url: '${ADDRESS}' },`,
    "  excerpt: 'A receita cresceu doze por cento em relação ao ano anterior.',",
    "  anchor: 'Página 12',",
    '};',
  ].join('\n');
}

/** Os rótulos, com o nome acessível já escrito. */
function labelsLines(index: number, title: string): string {
  return [
    '// O NOME ACESSÍVEL CHEGA ESCRITO. Ele traz a palavra, o número e o título',
    '// — e contém o número que se vê na tela, que é o que a WCAG 2.5.3 pede.',
    'const rotulos = {',
    `  marker: 'Fonte ${index}: ${title}',`,
    "  unsafeSource: 'Endereço recusado',",
    '};',
  ].join('\n');
}

/** O comentário que explica por que não há espaço antes da marca. */
const NO_SPACE_NOTE = [
  '<!--',
  '  SEM ESPAÇO ANTES DA MARCA: é assim que ela não se separa da palavra que a',
  '  antecede quando a linha quebra. O espaço que existe vem depois dela.',
  '-->',
].join('\n');

function build(opts: InlineCitationSnippetOptions): string {
  const shape = opts.shape ?? 'full';
  const defaultOpen = opts.defaultOpen ?? false;

  const title =
    shape === 'minimal' ? TITLE_MINIMAL : shape === 'unsafe' ? TITLE_UNSAFE : TITLE;

  // Só o que difere do padrão entra: passar `defaultOpen` como `false`
  // ensinaria que ele precisa ser passado, e a marca recolhida é o comum.
  const attributes = attrs(
    '{citation}',
    'index={1}',
    defaultOpen ? DEFAULT_OPEN_ATTR : false,
    'labels={rotulos}',
  );

  return svelteSnippet(
    [IMPORT, '', citationLines(shape), '', labelsLines(1, title)].join('\n'),
    [
      NO_SPACE_NOTE,
      `<p>${SENTENCE_BEFORE}<InlineCitation${attributes} />.</p>`,
    ].join('\n'),
  );
}

/** Transform do `meta` — o Playground, com os dois eixos nos controls. */
export function inlineCitationSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({ shape: args.shape, defaultOpen: args.defaultOpen });
}

/**
 * A prévia aberta.
 *
 * O snippet ensina que abrir é ESTADO controlável, e que quem abre no uso
 * corrente é quem lê — nascer aberta está aqui para fotografar, e por isso
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

/** As duas citações da frase, escritas por extenso. */
const TWO_CITATIONS = [
  'const citacoes = [',
  `  { source: { title: '${TITLE}', url: '${ADDRESS}' },`,
  "    excerpt: 'A receita cresceu doze por cento em relação ao ano anterior.',",
  "    anchor: 'Página 12' },",
  `  { source: { title: '${TITLE_MINIMAL}', url: 'https://exemplo.test/metodo' } },`,
  '];',
].join('\n');

/** Os pedaços da frase, intercalados com as marcas por quem a escreve. */
const SENTENCE_PARTS = [
  'const partes = [',
  `  '${SENTENCE_BEFORE}',`,
  "  ', e a metodologia por trás do número está publicada',",
  "  '.',",
  '];',
].join('\n');

/**
 * Duas marcas na mesma frase.
 *
 * O laço é o assunto: a MESMA tag atende as duas, o que muda é a citação e o
 * número — e o número chega de fora, porque uma marca que se numerasse sozinha
 * precisaria conhecer as irmãs.
 */
export function inlineCitationInSentenceSource(): string {
  return svelteSnippet(
    [
      IMPORT,
      '',
      TWO_CITATIONS,
      '',
      SENTENCE_PARTS,
      '',
      '// A NUMERAÇÃO CHEGA DE FORA. Ela é conteúdo — é por ela que a frase se',
      '// refere à lista de fontes do turno — e marcas irmãs podem nem estar no',
      '// mesmo parágrafo.',
    ].join('\n'),
    [
      '<p>',
      '  {partes[0]}{#each citacoes as citation, i (i)}<InlineCitation',
      '      {citation}',
      '      index={i + 1}',
      '      labels={rotuloDe(i + 1, citation)}',
      '    />{partes[i + 1]}{/each}',
      '</p>',
    ].join('\n'),
  );
}

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A EXCLUSÃO MÚTUA É DE QUEM MONTA A PÁGINA, e o snippet é o lugar em que isso
 * se ensina: a peça não conhece as vizinhas, e não conhecê-las é o que permite
 * que duas marcas da mesma frase venham de lugares diferentes da resposta.
 *
 * Nesta stack o comando chega por `bind:this` — é a divergência de forma que a
 * peça registra, e o snippet a mostra em vez de descrevê-la.
 */
export function inlineCitationMutuallyExclusiveSource(): string {
  return svelteSnippet(
    [
      IMPORT_COMMANDS,
      '',
      '// A peça devolve cada abertura e aceita a ordem de fechar por comando; o',
      '// que decide QUEM fecha é a página, não o componente.',
      'const marcas: InlineCitationCommands[] = [];',
      '',
      'function fecharAsOutras(atual: InlineCitationCommands) {',
      '  for (const outra of marcas) if (outra && outra !== atual) outra.close();',
      '}',
    ].join('\n'),
    [
      '<p>',
      '  {partes[0]}{#each citacoes as citation, i (i)}<InlineCitation',
      '      bind:this={marcas[i]}',
      '      {citation}',
      '      index={i + 1}',
      '      labels={rotuloDe(i + 1, citation)}',
      '      onOpenChange={(aberta) => {',
      '        if (aberta) fecharAsOutras(marcas[i]);',
      '      }}',
      '    />{partes[i + 1]}{/each}',
      '</p>',
    ].join('\n'),
  );
}

/**
 * Os três exemplos, percorridos de uma vez.
 *
 * O laço é o assunto: a MESMA tag atende os três, e o que muda é o que a
 * citação trouxe — a inteira, a que só tem fonte, e a que traz um endereço que
 * não pode virar link.
 */
export function inlineCitationEveryCaseSource(): string {
  return svelteSnippet(
    [
      IMPORT,
      '',
      '// A peça desenha o que RECEBE: a mesma tag atende a citação inteira, a',
      '// que só tem fonte e a que traz um endereço que não pode virar link.',
    ].join('\n'),
    [
      '{#each citacoes as citation, i (i)}',
      '  <p>',
      '    {partes[0]}<InlineCitation',
      '        {citation}',
      '        index={i + 1}',
      `        ${DEFAULT_OPEN_ATTR}`,
      '        labels={rotuloDe(i + 1, citation)}',
      '      />{partes[1]}{partes[2]}',
      '  </p>',
      '{/each}',
    ].join('\n'),
  );
}
