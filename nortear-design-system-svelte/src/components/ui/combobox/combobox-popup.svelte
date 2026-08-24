<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';

	// Os dois nós saem do mesmo primitivo da lib: o de fora posiciona, o de
	// dentro pinta. As custom properties do `style` traduzem os nomes que a lib
	// publica em runtime para os que a regra de estilo compartilhada lê — sem
	// essa ponte, o popup sairia com a largura do CONTEÚDO em vez de acompanhar a
	// largura do campo.

	let {
		class: className,
		sideOffset = 4,
		children,
		...restProps
	}: { class?: string; sideOffset?: number; children?: Snippet } & Record<string, unknown> =
		$props();

	/**
	 * A lib marca ESTE nó como sendo a lista: manda `role="listbox"` e, no modo
	 * múltiplo, `aria-multiselectable`. No contrato quem carrega o papel de lista
	 * é a peça de dentro — dois `listbox` aninhados invalidariam a semântica dos
	 * dois, e `aria-multiselectable` só tem sentido junto do papel que saiu.
	 *
	 * Os dois atributos são tirados do objeto ANTES do espalhamento. Escrevê-los
	 * depois, com `undefined`, limpava o DOM em runtime mas deixava no markup o
	 * par estático `role="presentation"` + `aria-multiselectable`, que o
	 * compilador reprova — e conviver com o aviso é o que o esconde da leitura
	 * seguinte.
	 */
	function withoutListboxRole(props: Record<string, unknown>): Record<string, unknown> {
		const rest = { ...props };
		delete rest.role;
		delete rest['aria-multiselectable'];
		return rest;
	}
</script>

<ComboboxPrimitive.Content
	{sideOffset}
	style="--anchor-width: var(--bits-combobox-anchor-width); --available-height: var(--bits-combobox-content-available-height);"
	{...restProps}
>
	{#snippet child({ props, wrapperProps })}
		<div {...wrapperProps} class="nds-combobox-positioner" data-slot="combobox-positioner">
			<div
				{...withoutListboxRole(props)}
				class={cn('nds-combobox-popup', className)}
				data-slot="combobox-popup"
				role="presentation"
			>
				{@render children?.()}
			</div>
		</div>
	{/snippet}
</ComboboxPrimitive.Content>
