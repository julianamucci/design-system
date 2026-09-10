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
 *   overlay       saiu do painel sem decidir nada: clique fora, foco que saiu,
 *                 ou clique no gatilho de novo
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
};

const KEY = Symbol('nds-popover');

export function createContextoPopover(
  ler: () => boolean,
  anotar: (reason: PopoverCloseReason) => void,
): PopoverContexto {
  const contexto: PopoverContexto = {
    get modal() {
      return ler();
    },
    anotarMotivo: anotar,
  };
  setContext(KEY, contexto);
  return contexto;
}

export function usarContextoPopover(): PopoverContexto | undefined {
  return getContext<PopoverContexto | undefined>(KEY);
}
