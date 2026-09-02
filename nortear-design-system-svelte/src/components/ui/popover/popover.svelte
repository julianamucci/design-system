<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	/**
	 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
	 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
	 *
	 * O Popover é NÃO-MODAL: o foco ENTRA no painel ao abrir (é o que o separa do
	 * tooltip), mas NÃO fica preso — `Tab` sai e segue a ordem da página. Por
	 * isso o painel nunca recebe `aria-modal`. `Escape` fecha e devolve o foco
	 * ao gatilho; clique fora fecha; o gatilho declara `aria-expanded` e
	 * `aria-haspopup="dialog"`; nenhuma região viva.
	 *
	 * Mecanismo desta stack: o bits-ui é a ÚNICA das cinco libs sem `modal` — o
	 * que ele tem é `trapFocus` no Content, e o padrão dele é `true`. Quem
	 * desliga é `popover-content.svelte`, e o porquê está no comentário de lá.
	 */
	let { open = $bindable(false), ...restProps }: PopoverPrimitive.RootProps = $props();
</script>

<PopoverPrimitive.Root bind:open {...restProps} />
