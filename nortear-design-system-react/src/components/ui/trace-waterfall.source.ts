/**
 * Snippet do painel Code da cascata de trechos — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções
 * rodarem fora do navegador, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento, e com
 * o sufixo `Source` no FIM do nome. Fábrica curried devolveria função em vez
 * de string, e as checagens que leem o snippet nunca chegariam ao snippet.
 *
 * OS TRECHOS ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis trechos
 * com seis campos cada ocupariam a tela inteira do painel e não ensinariam
 * nada que o contrato já não diga — o que o snippet mostra é a CHAMADA, e o
 * que ela precisa: uma lista de trechos, um eixo e os rótulos.
 */
import { indentar, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { TraceWaterfall } from "@/components/ui/trace-waterfall";';

export type TraceWaterfallSnippetOptions = {
  /** Em que pé está a execução que escreve o rastro. */
  status?: string;
  /** A expressão que produz os trechos. */
  spansRef?: string;
  /** O eixo, já escrito como número. */
  totalRef?: string;
};

/** A tag, sempre com um atributo por linha. */
function tag(parts: Array<string | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part));
  return `<TraceWaterfall\n${list.map((part) => indentar(part)).join('\n')}\n/>`;
}

function build(opts: TraceWaterfallSnippetOptions): string {
  return jsxSnippet(
    IMPORT,
    tag([
      `spans={${opts.spansRef ?? 'trechos'}}`,
      `totalMs={${opts.totalRef ?? '1200'}}`,
      `status="${opts.status ?? 'running'}"`,
      'labels={rotulos}',
    ]),
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const traceWaterfallSource: SourceTransform<{
  status: string;
  revealed: number;
  totalMs: number;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: text(args.status),
    // Sem trecho nenhum a chamada continua existindo, e é o que a story
    // mostra: a guarda de dentro do componente é que decide se alguma coisa
    // chega à tela.
    spansRef: args.revealed === 0 ? '[]' : 'trechos',
    totalRef: args.totalMs === undefined ? undefined : String(args.totalMs),
  });
};

/** Os quatro estados de trecho, na mesma régua. */
export function traceWaterfallEveryStateSource(): string {
  return jsxSnippet(
    IMPORT,
    [
      '// Um trecho por estado, na mesma régua: os quatro têm forma própria —',
      '// na marca e no preenchimento da barra —, e não só cor. A palavra de',
      '// cada um chega a quem não vê a forma.',
      tag([
        'spans={trechos}',
        'totalMs={1200}',
        'status="complete"',
        'labels={rotulos}',
      ]),
    ].join('\n'),
  );
}

/** Um trecho que quebrou. */
export function traceWaterfallFailureSource(): string {
  return build({ status: 'failed' });
}

/** Em andamento, com a execução ocupada. */
export function traceWaterfallRunningSource(): string {
  return build({ status: 'running' });
}

/**
 * O rastro pela metade — a revelação feita como esta família a faz.
 *
 * Não há contador de revelação: quem quer revelar corta a lista de trechos, e
 * o EIXO CONTINUA O MESMO — é isso que faz as barras restantes guardarem a
 * posição verdadeira em vez de reescalarem.
 */
export function traceWaterfallPartialSource(): string {
  return jsxSnippet(
    IMPORT,
    [
      '// REVELAR É PASSAR MENOS TRECHOS, mantendo o eixo. As barras que',
      '// sobram guardam a posição verdadeira em vez de reescalarem para',
      '// ocupar a régua inteira.',
      tag([
        'spans={trechos.slice(0, 3)}',
        'totalMs={1200}',
        'status="running"',
        'labels={rotulos}',
      ]),
    ].join('\n'),
  );
}

/** Mais largo que a conversa: a camada rola, e é a única que rola. */
export function traceWaterfallWideSource(): string {
  return build({ status: 'running', spansRef: 'trechosLargos', totalRef: '4000' });
}

/** Rótulos longos, que alargam a coluna em vez de cortar. */
export function traceWaterfallLongLabelsSource(): string {
  return build({ status: 'running', spansRef: 'trechosLongos', totalRef: '900' });
}

/** Uma janela do rastro: o eixo é menor que os trechos que ele mostra. */
export function traceWaterfallClippedSource(): string {
  return jsxSnippet(
    IMPORT,
    [
      '// A JANELA: um eixo menor que o rastro recorta as barras das pontas,',
      '// e cada linha recortada avisa em palavras que o trecho continua fora',
      '// dela.',
      tag([
        'spans={trechosDaJanela}',
        'totalMs={600}',
        'status="running"',
        'labels={rotulos}',
      ]),
    ].join('\n'),
  );
}

/**
 * As duas larguras mínimas, na folha de quem consome.
 *
 * São elas que decidem quando a cascata passa a ser mais larga que a
 * conversa. Entram como propriedade personalizada, e não como largura em
 * `style`: é a única maneira de mudá-las sem tirar o valor do tema e da
 * escala de tipo.
 */
export function traceWaterfallTightColumnsSource(): string {
  return jsxSnippet(
    IMPORT,
    [
      tag([
        'spans={trechos}',
        'totalMs={1200}',
        'status="running"',
        'labels={rotulos}',
      ]),
      '',
      '/* As duas larguras MÍNIMAS, na folha de quem consome. */',
      '.nds-trace-waterfall {',
      '  --trace-waterfall-name-min: var(--spacing-16);',
      '  --trace-waterfall-axis-min: var(--spacing-20);',
      '}',
    ].join('\n'),
  );
}
