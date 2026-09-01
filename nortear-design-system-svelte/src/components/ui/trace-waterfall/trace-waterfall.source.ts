/**
 * Transforms do painel Code da cascata de trechos.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem fora do navegador — a saída do painel não chega ao DOM durante a
 * `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o
 * gerador monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento.
 * Fábrica curried devolveria função em vez de string, e as checagens que leem
 * o snippet nunca chegariam ao snippet. O sufixo `Source`/`Snippet` fica no
 * FIM do nome de propósito: a guarda que varre os construtores de snippet
 * procura por ele ali, e nome fora do padrão sai da varredura em silêncio.
 *
 * OS TRECHOS ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis trechos
 * com seis campos cada ocupariam a tela inteira do painel e não ensinariam
 * nada que o contrato já não diga — o que o snippet mostra é a CHAMADA, e o
 * que ela precisa: uma lista de trechos, um eixo e os rótulos.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
export type TraceWaterfallSnippetOptions = {
  /** Em que pé está a execução que escreve o rastro. */
  status?: string;
  /** O nome da constante com os trechos. */
  spansRef?: string;
  /** O eixo, já escrito como número. */
  totalRef?: string;
};

/** O contexto que o painel Code entrega à transform. */
type StoryContext = {
  args?: { status?: string; revealed?: number; totalMs?: number };
};

const IMPORT = "import { TraceWaterfall } from '@/components/ui/trace-waterfall';";

/** O uso real: os trechos, o eixo, o estado da execução e os rótulos. */
function build(opts: TraceWaterfallSnippetOptions): string {
  const attributes = attrsMultilinha([
    `spans={${opts.spansRef ?? 'trechos'}}`,
    `totalMs={${opts.totalRef ?? '1200'}}`,
    `status="${opts.status ?? 'running'}"`,
    'labels={rotulos}',
  ]);

  return svelteSnippet(IMPORT, `<TraceWaterfall${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export function traceWaterfallSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem trecho nenhum a marcação continua existindo, e é o que a story
    // mostra: a peça é que decide não desenhar.
    spansRef: args.revealed === 0 ? '[]' : 'trechos',
    totalRef: args.totalMs === undefined ? undefined : String(args.totalMs),
  });
}

/** Os quatro estados de trecho, na mesma régua. */
export function traceWaterfallEveryStateSnippet(): string {
  const attributes = attrsMultilinha([
    'spans={trechos}',
    'totalMs={1200}',
    'status="complete"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  Um trecho por estado, na mesma régua: os quatro têm forma própria — na',
    '  marca e no preenchimento da barra —, e não só cor. A palavra de cada um',
    '  chega a quem não vê a forma.',
    '-->',
    `<TraceWaterfall${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}

/** Um trecho que quebrou. */
export function traceWaterfallFailureSnippet(): string {
  return build({ status: 'failed' });
}

/** Em andamento, com a execução ocupada. */
export function traceWaterfallRunningSnippet(): string {
  return build({ status: 'running' });
}

/**
 * O rastro pela metade — a revelação feita como esta família a faz.
 *
 * Não há contador de revelação: quem quer revelar corta a lista de trechos, e
 * o EIXO CONTINUA O MESMO — é isso que faz as barras restantes guardarem a
 * posição verdadeira em vez de reescalarem.
 */
export function traceWaterfallPartialSnippet(): string {
  const attributes = attrsMultilinha([
    'spans={trechos.slice(0, 3)}',
    'totalMs={1200}',
    'status="running"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  REVELAR É PASSAR MENOS TRECHOS, mantendo o eixo. As barras que sobram',
    '  guardam a posição verdadeira em vez de reescalarem.',
    '-->',
    `<TraceWaterfall${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}

/** Mais largo que a conversa: a camada rola, e é a única que rola. */
export function traceWaterfallWideSnippet(): string {
  return build({ status: 'running', spansRef: 'trechosLargos', totalRef: '4000' });
}

/** Rótulos longos, que alargam a coluna em vez de cortar. */
export function traceWaterfallLongLabelsSnippet(): string {
  return build({ status: 'running', spansRef: 'trechosLongos', totalRef: '900' });
}

/** Uma janela do rastro: o eixo é menor que os trechos que ele mostra. */
export function traceWaterfallClippedSnippet(): string {
  const attributes = attrsMultilinha([
    'spans={trechosDaJanela}',
    'totalMs={600}',
    'status="running"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  A JANELA: um eixo menor que o rastro recorta as barras das pontas, e',
    '  cada linha recortada avisa em palavras que o trecho continua fora dela.',
    '-->',
    `<TraceWaterfall${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}

/**
 * As duas larguras mínimas, na folha de quem consome.
 *
 * São elas que decidem quando a cascata passa a ser mais larga que a
 * conversa. Entram como propriedade personalizada num bloco de estilo, e não
 * como largura em `style` inline: é a única maneira de mudá-las sem tirar o
 * valor do tema e da escala de tipo. O `:global` é necessário porque a classe
 * é da folha compartilhada, e a especificidade tem de vencer a declaração que
 * a própria folha faz no elemento.
 */
export function traceWaterfallTightColumnsSnippet(): string {
  // Os atributos são escritos À MÃO aqui, e só aqui: a peça está aninhada num
  // invólucro, e o recuo de `attrsMultilinha` é o do nível de cima. Recuo
  // errado no painel ensina marcação torta a quem copia.
  const markup = [
    '<div data-apertado>',
    '  <TraceWaterfall',
    '    spans={trechos}',
    '    totalMs={1200}',
    '    status="running"',
    '    labels={rotulos}',
    '  />',
    '</div>',
    '',
    '<style>',
    '  /* As duas larguras MÍNIMAS, na folha de quem consome. */',
    '  [data-apertado] :global(.nds-trace-waterfall) {',
    '    --trace-waterfall-name-min: var(--spacing-16);',
    '    --trace-waterfall-axis-min: var(--spacing-20);',
    '  }',
    '</style>',
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}
