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
export type PopoverContexto = {
  get modal(): boolean;
};

const KEY = Symbol('nds-popover');

export function createContextoPopover(ler: () => boolean): PopoverContexto {
  const contexto: PopoverContexto = {
    get modal() {
      return ler();
    },
  };
  setContext(KEY, contexto);
  return contexto;
}

export function usarContextoPopover(): PopoverContexto | undefined {
  return getContext<PopoverContexto | undefined>(KEY);
}
