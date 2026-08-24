<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';

	// Os dois nós saem do mesmo primitivo da lib: o de fora posiciona, o de
	// dentro pinta. As custom properties do `style` traduzem os nomes que a lib
	// publica em runtime para os que a regra de estilo compartilhada lê — sem
	// essa ponte, o popup sairia com a largura do CONTEÚDO em vez de acompanhar a
	// largura do campo.
	//
	// `role="presentation"` é escrito depois do espalhamento: a lib marca este nó
	// como sendo a lista, e no contrato quem carrega `role="listbox"` é a de
	// dentro. Dois deles aninhados invalidariam a semântica dos dois.

	let {
		class: className,
		sideOffset = 4,
		children,
		...restProps
	}: { class?: string; sideOffset?: number; children?: Snippet } & Record<string, unknown> =
		$props();
</script>

<ComboboxPrimitive.Content
	{sideOffset}
	style="--anchor-width: var(--bits-combobox-anchor-width); --available-height: var(--bits-combobox-content-available-height);"
	{...restProps}
>
	{#snippet child({ props, wrapperProps })}
		<div {...wrapperProps} class="nds-combobox-positioner" data-slot="combobox-positioner">
			<div
				{...props}
				class={cn('nds-combobox-popup', className)}
				data-slot="combobox-popup"
				role="presentation"
				aria-multiselectable={undefined}
			>
				{@render children?.()}
			</div>
		</div>
	{/snippet}
</ComboboxPrimitive.Content>
