import { getContext, setContext } from 'svelte';

/**
 * Contexto do Popover — só o modo modal.
 *
 * Quem decide o modo é a raiz e quem precisa agir sobre ele é o painel: é o
 * painel que prende o foco, trava a rolagem e anuncia `aria-modal`. O bits-ui é
 * a única das quatro libs sem `modal` nenhum, então não há contexto de lib de
 * onde ler — a associação tem de vir da árvore de componentes, como no
 * HoverCard ao lado, e pelo mesmo motivo: o painel vive num portal no `<body>`.
 */
/**
 * Por qual caminho o painel fechou, no vocabulário do DESIGN SYSTEM — as mesmas
 * quatro palavras do `drawer_close`, para a família ser uma dimensão só no GA4.
 *
 *   escape        tecla Escape
 *   overlay       saiu do painel sem decidir nada: clique fora, Tab para fora
 *                 do painel ou foco levado a outro elemento da página (os dois
 *                 só no modo não-modal), ou clique no gatilho de novo
 *   close-button  o `popover-close` desta stack
 *   api           fechado por código — é aqui que cai "salvou e fechou"
 */
export type PopoverCloseReason = 'escape' | 'overlay' | 'close-button' | 'api';

export type PopoverContexto = {
  get modal(): boolean;
  /**
   * Anota o motivo do fechamento que está para acontecer. O bits-ui não o
   * publica em `onOpenChange`, mas o gesto é observável — o painel, o gatilho
   * e o botão de fechar o anotam, e a raiz o entrega junto com a mudança.
   */
  anotarMotivo(reason: PopoverCloseReason): void;
  /**
   * Fecha o painel por um caminho que a LIB não tem, os dois só no modo
   * não-modal: o `Tab` para fora do painel e o foco levado a outro elemento
   * da página (`popover-content.svelte`, `handleKeydown` e
   * `handleFocusOutside`).
   *
   * Quem pode escrever no `open` ligável é a raiz, e escrever nele fecha o
   * painel EM SILÊNCIO: o `onOpenChange` da lib só roda quando quem fecha é a
   * própria lib. Por isso o motivo viaja junto desta chamada, e é a raiz quem
   * o entrega.
   */
  dismiss(reason: PopoverCloseReason): void;
  /**
   * O gatilho desta instância — para onde o foco volta quando o `Tab` sai do
   * painel. O painel mora em portal no fim do `<body>`, então não há como
   * achá-lo subindo a árvore; `popover-trigger.svelte` o registra aqui.
   */
  readonly triggerElement: HTMLElement | null;
  registerTrigger(el: HTMLElement | null): void;
};

const KEY = Symbol('nds-popover');

export function createContextoPopover(
  ler: () => boolean,
  anotar: (reason: PopoverCloseReason) => void,
  dismiss: (reason: PopoverCloseReason) => void,
): PopoverContexto {
  let triggerElement: HTMLElement | null = null;
  const contexto: PopoverContexto = {
    get modal() {
      return ler();
    },
    anotarMotivo: anotar,
    dismiss,
    get triggerElement() {
      return triggerElement;
    },
    registerTrigger(el) {
      triggerElement = el;
    },
  };
  setContext(KEY, contexto);
  return contexto;
}

export function usarContextoPopover(): PopoverContexto | undefined {
  return getContext<PopoverContexto | undefined>(KEY);
}
