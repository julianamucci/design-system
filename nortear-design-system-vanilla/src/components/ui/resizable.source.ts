// Snippet do painel Code do Resizable — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/** Um painel do grupo, como a fábrica o recebe. */
export type ResizableSnippetPanel = {
  /** Texto do bloco que a story põe dentro do painel. */
  titulo: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
};

/** O que as stories usam da `ResizablePanelOptions`. */
export type ResizableSnippetOptions = {
  direction?: 'horizontal' | 'vertical';
  withHandle?: boolean;
  disabled?: boolean;
  /**
   * Nome acessível dos divisores. Uma string nomeia todos; um array nomeia um a
   * um, que é o que um grupo de três painéis precisa — dois separadores com o
   * mesmo nome são dois controles indistinguíveis para quem só ouve.
   */
  'aria-label'?: string | string[];
  panels?: ResizableSnippetPanel[];
  /** Expressão de `onLayout`, quando a story guarda os tamanhos. */
  onLayout?: string;
  /** Mostra a linha de limpeza — a fábrica escuta o documento durante o arrasto. */
  destroy?: boolean;
  // ─── Controls do Playground ────────────────────────────────────────────────
  // Não são opções da fábrica: são os três números do painel de controls, que
  // viram os dois painéis do exemplo.
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
};

const PANELS_DEFAULT: ResizableSnippetPanel[] = [
  { titulo: 'Sidebar', defaultSize: 30, minSize: 15 },
  { titulo: 'Conteúdo principal', defaultSize: 70, minSize: 30 },
];

const LABEL_DEFAULT = 'Redimensionar Sidebar e Conteúdo — use setas para ajustar';

/**
 * O bloco que preenche um painel.
 *
 * Quem rola é o painel (`overflow: auto` na folha compartilhada, e ele é
 * focável); um segundo contêiner rolável aqui dentro esconderia conteúdo de
 * quem não usa mouse.
 */
const CONTENT_BLOCK = `// Quem rola é o próprio painel, que é focável. Um segundo contêiner rolável
// aqui dentro deixaria o conteúdo alcançável só com mouse.
function bloco(titulo) {
  const el = document.createElement('div');
  el.className = 'nds-p-4 nds-text-body nds-font-medium';
  el.textContent = titulo;
  return el;
}`;

/** O valor de `aria-label`: uma string, ou um nome por divisor. */
function labelValue(rotulo: string | string[] | undefined): string {
  const valor = rotulo ?? LABEL_DEFAULT;
  if (!Array.isArray(valor)) return texto(valor);
  return `[\n${valor.map((r) => `    ${texto(r)},`).join('\n')}\n  ]`;
}

/** `panels: [ … ]`, um painel por linha, já recuado para dentro da chamada. */
function blockPanels(panels: ResizableSnippetPanel[]): string {
  const linhas = panels.map((p) => {
    const pairs = opcoes([
      ['defaultSize', p.defaultSize !== undefined ? String(p.defaultSize) : undefined],
      // 10 é o piso que a fábrica assume; 100 é o teto.
      ['minSize', p.minSize !== undefined && p.minSize !== 10 ? String(p.minSize) : undefined],
      ['maxSize', p.maxSize !== undefined && p.maxSize !== 100 ? String(p.maxSize) : undefined],
      ['content', `bloco(${texto(p.titulo)})`],
    ]);
    return `    { ${pairs.map((par) => par.replace(/,$/, '')).join(', ')} },`;
  });
  return `[\n${linhas.join('\n')}\n  ]`;
}

/**
 * Os painéis do exemplo.
 *
 * Sem `panels` declarado, os três números dos controls do Playground viram o
 * par sidebar + conteúdo, que é exatamente o que aquela story monta.
 */
function panelsOf(o: ResizableSnippetOptions): ResizableSnippetPanel[] {
  if (o.panels) return o.panels;
  if (o.defaultSize === undefined && o.minSize === undefined && o.maxSize === undefined) {
    return PANELS_DEFAULT;
  }
  const primeiro = o.defaultSize ?? 30;
  return [
    { titulo: 'Sidebar', defaultSize: primeiro, minSize: o.minSize, maxSize: o.maxSize },
    { titulo: 'Conteúdo principal', defaultSize: 100 - primeiro, minSize: o.minSize },
  ];
}

/** As opções da fábrica. Só o que difere do padrão entra. */
function groupLines(o: ResizableSnippetOptions, panels: ResizableSnippetPanel[]): string[] {
  return opcoes([
    // `horizontal` é o padrão da fábrica.
    ['direction', o.direction === 'vertical' ? texto('vertical') : undefined],
    ['withHandle', o.withHandle ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    // Um `role="separator"` focável sem nome é anunciado como "separador, 30":
    // não há como saber o que aquele número redimensiona.
    ['aria-label', labelValue(o['aria-label'])],
    ['onLayout', o.onLayout],
    ['panels', blockPanels(panels)],
  ]);
}

/** A linha final: o grupo entra na página, e a limpeza quando ela é o assunto. */
function blockFinal(o: ResizableSnippetOptions, variavel: string): string {
  if (!o.destroy) return montar(variavel);
  return `${montar(variavel)}

// Durante o arrasto a fábrica escuta \`mousemove\` e \`mouseup\` no documento.
// Quem tira o grupo da página com o botão ainda pressionado solta os dois aqui.
${variavel}.destroy();`;
}

/**
 * A nota de altura.
 *
 * O grupo reparte o espaço do contêiner; num contêiner de altura automática não
 * há espaço a repartir e os painéis colapsam. A medida é de quem consome — por
 * isso a nota, e não um valor cravado no snippet.
 */
const HEIGHT_NOTA = `// O grupo reparte o espaço do contêiner: ele precisa de altura definida, senão
// os painéis colapsam. Num grupo vertical isso vale sempre.
`;

/** A chamada real de `createResizablePanel` com as opções da story. */
export function resizableSnippet(o: ResizableSnippetOptions = {}): string {
  const panels = panelsOf(o);
  return snippet(
    importing('resizable', 'createResizablePanel'),
    CONTENT_BLOCK,
    `${HEIGHT_NOTA}const grupo = ${chamada('createResizablePanel', groupLines(o, panels))};`,
    blockFinal(o, 'grupo'),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const resizableSource: SourceTransform<ResizableSnippetOptions> = (_gerado, ctx) =>
  resizableSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function resizableSourceWith(
  fixas: ResizableSnippetOptions,
): SourceTransform<ResizableSnippetOptions> {
  return (_gerado, ctx) => resizableSnippet({ ...ctx.args, ...fixas });
}

/**
 * Um grupo dentro do painel de outro.
 *
 * Cada grupo nomeia o PRÓPRIO divisor e governa só os próprios painéis: o de
 * dentro entra no de fora como conteúdo, e um ajuste num não move o outro.
 */
export function resizableNestedSnippet(groupOptions: {
  externo: ResizableSnippetOptions;
  interno: ResizableSnippetOptions;
  /** Título do painel do grupo externo que fica ao lado do grupo de dentro. */
  neighbour: ResizableSnippetPanel;
}): string {
  const { externo, interno, neighbour } = groupOptions;
  const panelsInternos = panelsOf(interno);

  const neighbourPairs = opcoes([
    ['defaultSize', neighbour.defaultSize !== undefined ? String(neighbour.defaultSize) : undefined],
    ['minSize', neighbour.minSize !== undefined && neighbour.minSize !== 10 ? String(neighbour.minSize) : undefined],
    ['content', `bloco(${texto(neighbour.titulo)})`],
  ]);

  const linesExternas = opcoes([
    ['direction', externo.direction === 'vertical' ? texto('vertical') : undefined],
    ['withHandle', externo.withHandle ? 'true' : undefined],
    ['aria-label', labelValue(externo['aria-label'])],
    [
      'panels',
      `[\n    { ${neighbourPairs.map((p) => p.replace(/,$/, '')).join(', ')} },\n    { defaultSize: ${
        externo.panels?.[1]?.defaultSize ?? 70
      }, minSize: ${externo.panels?.[1]?.minSize ?? 30}, content: interno },\n  ]`,
    ],
  ]);

  return snippet(
    importing('resizable', 'createResizablePanel'),
    CONTENT_BLOCK,
    `// O grupo de dentro é outro grupo, com nome de divisor próprio: percorrer os
// divisores a partir da raiz do de fora alcançaria também os dele.
const interno = ${chamada('createResizablePanel', groupLines(interno, panelsInternos))};`,
    `${HEIGHT_NOTA}const externo = ${chamada('createResizablePanel', linesExternas)};`,
    blockFinal(externo, 'externo'),
  );
}

/** Transform de story para o grupo aninhado. */
export function resizableSourceNested(groupOptions: {
  externo: ResizableSnippetOptions;
  interno: ResizableSnippetOptions;
  neighbour: ResizableSnippetPanel;
}): SourceTransform<ResizableSnippetOptions> {
  return () => resizableNestedSnippet(groupOptions);
}
