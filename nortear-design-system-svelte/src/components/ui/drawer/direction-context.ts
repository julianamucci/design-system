import { getContext, setContext } from "svelte";

/**
 * A direção, da raiz para o painel.
 *
 * A folha compartilhada posiciona o painel por `[data-direction]` — borda,
 * cantos, alça, cabeçalho e as transições das quatro direções saem dali. Sem o
 * atributo, o painel não tem posição nenhuma.
 *
 * O atributo é escrito pelo wrapper, e não herdado da lib de gesto: o
 * `data-vaul-drawer-direction` que ela injeta continua no elemento, mas é NOME
 * DELA, e só três das cinco stacks a carregam. O contrato de markup do design
 * system não pode ser batizado com o nome de uma dependência que parte das
 * implementações não tem — quem cumpre o contrato aqui é o wrapper.
 *
 * A lib desta stack tem um contexto próprio com a direção dentro, mas ele não
 * é exportado pelo pacote (o `index.d.ts` publica só componentes e tipos), e
 * alcançá-lo por subcaminho seria depender de detalhe interno para escrever um
 * atributo que justamente deixou de ser dela. A direção é prop da RAIZ e quem
 * precisa do atributo é o painel, então ela desce por este contexto.
 */
export type DrawerDirection = "top" | "bottom" | "left" | "right";

export type DrawerDirectionContext = {
	readonly direction: DrawerDirection;
};

const KEY = Symbol("nds-drawer-direction");

export function setDrawerDirectionContext(context: DrawerDirectionContext): void {
	setContext(KEY, context);
}

/** `"bottom"` por omissão — é o default da raiz e o do primitivo. */
export function useDrawerDirection(): DrawerDirectionContext {
	return (
		getContext<DrawerDirectionContext | undefined>(KEY) ?? { direction: "bottom" }
	);
}
