/**
 * Transforms do painel Code da cascata de trechos.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o
 * snippet nunca chegariam ao snippet.
 *
 * OS TRECHOS ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis trechos
 * com seis campos cada ocupariam a tela inteira do painel e não ensinariam
 * nada que o contrato já não diga — o que o snippet mostra é a TAG, e o que
 * ela precisa: uma lista de trechos, um eixo e os rótulos.
 */
import { indentar, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type TraceWaterfallSnippetOptions = {
  /** Em que pé está a execução que escreve o rastro. */
  status?: string;
  /** O nome da constante com os trechos. */
  spansRef?: string;
  /** O eixo, já escrito como número. */
  totalRef?: string;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { TraceWaterfall } from '@/components/ui/trace-waterfall';";

/**
 * Os rótulos que o exemplo DECLARA.
 *
 * `:labels="rotulos"` nomeia texto de interface, que é de quem consome — e o
 * exemplo não o declarava em lugar nenhum: quem copiasse recebia um `labels`
 * indefinido, e é ele que conta a leitura a quem não vê a barra.
 */
const ROTULOS = [
  'const rotulos = {',
  "  region: 'Tempo do atendimento',",
  "  axis: 'Eixo de {total} ms',",
  "  duration: '{duration} ms',",
  "  reading: 'Começa em {start} ms e dura {duration} ms.',",
  "  clipped: 'Continua fora da janela mostrada.',",
  "  state: { pending: 'Por começar', running: 'Em andamento', done: 'Concluído', failed: 'Falhou' },",
  '};',
].join('\n');

/** O `<script setup>` de cada exemplo: o que importa e o que declara. */
const SETUP = [IMPORT, '', ROTULOS].join('\n');

/**
 * A tag da peça, com um atributo por linha.
 *
 * Ela não tem evento nenhum e não abre espaço nenhum: um trecho não faz nada,
 * e a cascata não tem parte de quem consome. O snippet é só o que ela recebe.
 */
function traceWaterfallTag(opts: TraceWaterfallSnippetOptions): string {
  const attributes = [
    `:spans="${opts.spansRef ?? 'trechos'}"`,
    `:total-ms="${opts.totalRef ?? '1200'}"`,
    `status="${text(opts.status, 'running')}"`,
    ':labels="rotulos"',
  ];

  return ['<TraceWaterfall', ...attributes.map((part) => indentar(part)), '/>'].join('\n');
}

function build(opts: TraceWaterfallSnippetOptions): string {
  return vueSnippet(SETUP, traceWaterfallTag(opts));
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const traceWaterfallSource: SourceTransform<{
  status: string;
  revealed: number;
  totalMs: number;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem trecho nenhum a chamada continua existindo, e é o que a story
    // mostra: a peça é que decide não desenhar.
    spansRef: args.revealed === 0 ? '[]' : 'trechos',
    totalRef: args.totalMs === undefined ? undefined : String(args.totalMs),
  });
};

/** Os quatro estados de trecho, na mesma régua. */
export function traceWaterfallEveryStateSnippet(): string {
  return vueSnippet(
    SETUP,
    [
      '<!-- Um trecho por estado, na mesma régua: os quatro têm forma própria —',
      '     na marca e no preenchimento da barra —, e não só cor. A palavra de',
      '     cada um chega a quem não vê a forma. -->',
      traceWaterfallTag({ status: 'complete' }),
    ].join('\n'),
  );
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
  return vueSnippet(
    SETUP,
    [
      '<!-- REVELAR É PASSAR MENOS TRECHOS, mantendo o eixo. As barras que',
      '     sobram guardam a posição verdadeira em vez de reescalarem. -->',
      traceWaterfallTag({ status: 'running', spansRef: 'trechos.slice(0, 3)' }),
    ].join('\n'),
  );
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
  return vueSnippet(
    SETUP,
    [
      '<!-- A JANELA: um eixo menor que o rastro recorta as barras das pontas,',
      '     e cada linha recortada avisa em palavras que o trecho continua',
      '     fora dela. -->',
      traceWaterfallTag({ status: 'running', spansRef: 'trechosDaJanela', totalRef: '600' }),
    ].join('\n'),
  );
}

/**
 * As duas larguras mínimas, na folha de quem consome.
 *
 * São elas que decidem quando a cascata passa a ser mais larga que a
 * conversa. Entram por propriedade personalizada, e não como largura em
 * `style`: é a única maneira de mudá-las sem tirar o valor do tema e da
 * escala de tipo.
 */
export function traceWaterfallTightColumnsSnippet(): string {
  const stylesheet = [
    '<style>',
    '/* As duas larguras MÍNIMAS, na folha de quem consome. */',
    '.nds-trace-waterfall {',
    '  --trace-waterfall-name-min: var(--spacing-16);',
    '  --trace-waterfall-axis-min: var(--spacing-20);',
    '}',
    '</' + 'style>',
  ].join('\n');

  return [build({ status: 'running' }), stylesheet].join('\n\n');
}
