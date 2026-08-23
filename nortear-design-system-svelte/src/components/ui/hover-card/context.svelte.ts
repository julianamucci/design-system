import { getContext, setContext } from 'svelte';

/**
 * Contexto do HoverCard — só o gatilho.
 *
 * O painel vive num portal no `<body>`, longe do gatilho no DOM, e é dele que
 * sai o nome acessível do `role="dialog"`. Procurar o gatilho por seletor daria,
 * numa tela com vários cartões, o mesmo nome a todos — era o que
 * `document.querySelector('[data-link-preview-trigger]')` fazia aqui. A
 * associação tem de vir da árvore de componentes.
 */
export type HoverCardContexto = {
  get trigger(): HTMLElement | null;
  set trigger(el: HTMLElement | null);
};

const KEY = Symbol('nds-hover-card');

export function createContextoHoverCard(): HoverCardContexto {
  let trigger = $state<HTMLElement | null>(null);
  const contexto: HoverCardContexto = {
    get trigger() {
      return trigger;
    },
    set trigger(el: HTMLElement | null) {
      trigger = el;
    },
  };
  setContext(KEY, contexto);
  return contexto;
}

export function usarContextoHoverCard(): HoverCardContexto | undefined {
  return getContext<HoverCardContexto | undefined>(KEY);
}
