/**
 * ─── Ponte Figma ↔ código ────────────────────────────────────────────────────
 * Consumido pelo `@storybook/addon-designs` via `parameters.design` nas stories.
 *
 * Os node-ids vivem AQUI, num lugar só. Espalhados pelos arquivos de story eles
 * envelheceriam em silêncio: `combineAsVariants` troca o id do componente, e um
 * link quebrado no addon não falha teste nenhum — só mostra painel vazio.
 *
 * Para descobrir o id de um nó: selecione no Figma e leia o `node-id` da URL,
 * trocando `:` por `-`.
 */

export const FIGMA_FILE_KEY = 'XXAmIFVBKHClzx7YdUSkEb';

const BASE = `https://www.figma.com/design/${FIGMA_FILE_KEY}/Nortear-DS`;

/**
 * Nó por papel, não por nome de arquivo de story — o mesmo nó serve a mais de
 * uma story quando elas demonstram a mesma peça.
 */
export const figmaNodes = {
  /** Componente montado: 3 itens, o último sem divisória. */
  accordion: '13-32',
  /** Variant set do item — é onde vive o eixo Estado. */
  accordionItem: '12-32',
  /** Variant set do gatilho — slots Rótulo/Ícone e a rotação do chevron. */
  accordionTrigger: '49-83',
  /** Painel, com o slot Conteúdo. */
  accordionContent: '7-8',
  /** Página de documentação do componente. */
  accordionDocs: '14-90',
  /** Frame de spec do movimento. */
  accordionTimeline: '13-53',

  /**
   * Variant set do button: eixos variant (6) × size (8, incluindo os icon-*).
   * Estados e ícones são propriedades booleanas, não variantes — por isso as
   * cinco stories de button apontam todas para cá: não há nó separado por
   * estado que uma story de estado pudesse referenciar.
   */
  button: '156-2',
  /** Página de documentação do componente. */
  buttonDocs: '159-2',
  /** Frame de spec do movimento (hover 1.05 / press 0.95). */
  buttonTimeline: '168-26',

  /**
   * Variant set do alert: eixo variant (5). Conteúdo e composição são
   * propriedades, e o ícone acompanha a variante — não há nó por estado.
   */
  alert: '194-16',
  /** Página de documentação do componente. */
  alertDocs: '196-85',
  /** Frame de spec do glow que percorre a borda. */
  alertGlow: '197-85',

  /**
   * Componente montado do alert-dialog: cortina + painel, com cabeçalho e
   * rodapé como instâncias dos dois sets abaixo. Não há eixo de variante nem de
   * tamanho — a severidade vem da variante do Button da ação.
   */
  alertDialog: '212-3',
  /** Variant set do cabeçalho — eixo Layout (Esquerda | Centralizado). */
  alertDialogHeader: '246-88',
  /** Variant set do rodapé — eixo Layout (Linha | Empilhado). */
  alertDialogFooter: '239-134',
  /** Página de documentação do componente. */
  alertDialogDocs: '215-60',
  /** Frame de spec do movimento (entrada em spring, saída em exit). */
  alertDialogTimeline: '214-34',

  /**
   * Variant set do aspect-ratio: eixo único `ratio` (16/9, 4/3, 1, 3/4, 21/9).
   * Sem eixo de estado nem de tamanho — o CSS não declara nenhum dos dois, e a
   * largura é do contexto. O conteúdo é troca de instância.
   */
  aspectRatio: '307-25',
  /** Página de documentação do componente. */
  aspectRatioDocs: '308-7',

  /**
   * Variant set do avatar: eixo único `size` (sm, md, lg, xl, 2xl). Foto,
   * iniciais e status são propriedades — conteúdo por eixo multiplicaria a
   * matriz por três e daria colunas iguais na tela.
   */
  avatar: '322-23',
  /** Componente da fila sobreposta, com o contador do excedente. */
  avatarGroup: '322-24',
  /** Página de documentação do componente. */
  avatarDocs: '323-17',

  /**
   * Variant set do badge: eixo único `variant` (default, secondary,
   * destructive, outline). Rótulo e ícone são propriedades. Sem eixo de estado:
   * o foco é do <button> ou do <a> que envolve o badge, nunca dele.
   */
  badge: '333-17',
  /** Página de documentação do componente. */
  badgeDocs: '334-24',

  /**
   * Trilha montada: instâncias de Link, Separator e Page. Não é variant set —
   * o breadcrumb é composição, e o que tem eixo é o link.
   */
  breadcrumb: '353-298',
  /** Variant set do link — eixo `state` (default, hover, focus). */
  breadcrumbLink: '353-12',
  /** Página de documentação do componente. */
  breadcrumbDocs: '354-38',

  /** Página com os 80 ícones lucide gerados do pacote do repo. */
  icons: '171-2',
} as const;

export type FigmaNodeKey = keyof typeof figmaNodes;

/**
 * Parâmetro pronto para `parameters.design` do addon-designs.
 *
 * `name` rotula a aba — só faz sentido quando a story aponta para mais de um
 * nó (`design: [figmaDesign('a', 'Cabeçalho'), figmaDesign('b', 'Rodapé')]`).
 */
export function figmaDesign(node: FigmaNodeKey, name?: string) {
  const design = { type: 'figma' as const, url: `${BASE}?node-id=${figmaNodes[node]}` };
  return name ? { ...design, name } : design;
}
