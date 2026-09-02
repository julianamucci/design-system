import { getContext, setContext } from 'svelte';

/**
 * Contexto do HoverCard — o gatilho e a abertura da raiz.
 *
 * O painel vive num portal no `<body>`, longe do gatilho no DOM, e precisa
 * escrever `aria-describedby` NELE enquanto está aberto. Procurar o gatilho por
 * seletor daria, numa tela com vários cartões, sempre o mesmo — era o que
 * `document.querySelector('[data-link-preview-trigger]')` fazia aqui. A
 * associação tem de vir da árvore de componentes.
 *
 * A ABERTURA entra aqui porque é ela que decide quando a descrição existe, e o
 * conteúdo não tem outra via para lê-la: quem carrega o estado ligável é a
 * raiz.
 */
export type HoverCardContexto = {
  get trigger(): HTMLElement | null;
  set trigger(el: HTMLElement | null);
  /** Abertura da raiz, lida do estado ligável dela. */
  get open(): boolean;
};

const KEY = Symbol('nds-hover-card');

export function createContextoHoverCard(open: () => boolean): HoverCardContexto {
  let trigger = $state<HTMLElement | null>(null);
  const contexto: HoverCardContexto = {
    get trigger() {
      return trigger;
    },
    set trigger(el: HTMLElement | null) {
      trigger = el;
    },
    get open() {
      return open();
    },
  };
  setContext(KEY, contexto);
  return contexto;
}

export function usarContextoHoverCard(): HoverCardContexto | undefined {
  return getContext<HoverCardContexto | undefined>(KEY);
}
