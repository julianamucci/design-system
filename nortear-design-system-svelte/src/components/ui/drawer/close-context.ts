import { getContext, setContext } from "svelte";

/**
 * Fechamento EXPLÍCITO da gaveta — e ele só existe quando `dismissible={false}`.
 *
 * O primitivo trata `dismissible={false}` como "não fecha por nada": a guarda
 * dele é `if (!opts.dismissible.current && !o) return`, dentro do
 * `onDialogOpenChange` do diálogo que ele embrulha, e ela engole TODO pedido de
 * fechamento que passe por ali — o do Escape, o do véu, o do arraste e também o
 * do botão de fechar, que é o mesmo caminho. Medido em navegador em 2026-09-03:
 * com a saída do rodapé clicada, o painel continuava aberto e a story reprovava
 * em "Portal dialog ainda aberto".
 *
 * Isso deixava a gaveta sem saída NENHUMA — armadilha de teclado, WCAG 2.1.2
 * (nível A) —, e contradizia o que o conteúdo compartilhado promete em
 * `functional.item7`: sem dispensa por gesto, mas COM saída explícita no
 * rodapé. Mesma causa e mesmo conserto já aplicados no stack React.
 *
 * O contorno não precisa de fork: a guarda só vale para o caminho INTERNO do
 * primitivo. A abertura desta raiz já é `$bindable` e chega ao primitivo por
 * `bind:open`, então escrever `open = false` aqui fecha a gaveta por fora da
 * guarda. É por isso que esta stack não paga o preço que o React pagou: lá foi
 * preciso passar a controlar `open` só para as não dispensáveis, e o controle
 * mudava a transição de entrada; aqui a abertura já era controlada para todas.
 */
export type DrawerCloseContext = {
	/** `null` com a dispensa LIGADA: nesse caso quem fecha é o primitivo. */
	readonly close: (() => void) | null;
};

const KEY = Symbol("nds-drawer-close");

export function setDrawerCloseContext(context: DrawerCloseContext): void {
	setContext(KEY, context);
}

export function useDrawerCloseContext(): DrawerCloseContext | undefined {
	return getContext<DrawerCloseContext | undefined>(KEY);
}
