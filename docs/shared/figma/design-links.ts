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
} as const;

export type FigmaNodeKey = keyof typeof figmaNodes;

/** Parâmetro pronto para `parameters.design` do addon-designs. */
export function figmaDesign(node: FigmaNodeKey) {
  return { type: 'figma' as const, url: `${BASE}?node-id=${figmaNodes[node]}` };
}
