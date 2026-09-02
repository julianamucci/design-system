<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { createContextoPopover } from "./context.svelte.js";

	/**
	 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
	 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
	 *
	 * O Popover é NÃO-MODAL POR PADRÃO: o foco ENTRA no painel ao abrir (é o que
	 * o separa do tooltip), mas NÃO fica preso — `Tab` sai e segue a ordem da
	 * página. Por isso o painel só recebe `aria-modal` no modo modal. `Escape`
	 * fecha e devolve o foco ao gatilho; clique fora fecha; o gatilho declara
	 * `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
	 *
	 * `modal` foi ENTREGUE nas cinco em 2026-09-02: prende o foco, trava a
	 * rolagem e anuncia `aria-modal`, os três juntos. O padrão continua
	 * não-modal.
	 *
	 * Mecanismo desta stack: o bits-ui é a ÚNICA das quatro libs sem `modal` — o
	 * que ele tem, os dois no Content, é `trapFocus` (padrão da LIB `true`) e
	 * `preventScroll` (padrão `false`). São esses dois que passam a ser o
	 * mecanismo de `modal` aqui; quem os liga é `popover-content.svelte`, lendo
	 * o contexto que esta raiz publica.
	 */
	let {
		open = $bindable(false),
		/**
		 * Modo MODAL. Padrão `false`, que é o popover normal desta casa.
		 *
		 * `true` prende o foco no painel, trava a rolagem da página e faz o
		 * painel anunciar `aria-modal="true"`. Os três andam juntos: anunciar
		 * inércia sem prender o foco é mentir para quem usa leitor de tela.
		 *
		 * A prop é NOSSA — a raiz da lib não tem `modal` para receber, então ela
		 * não entra no spread abaixo.
		 */
		modal = false,
		...restProps
	}: PopoverPrimitive.RootProps & { modal?: boolean } = $props();

	createContextoPopover(() => modal === true);
</script>

<PopoverPrimitive.Root bind:open {...restProps} />
