<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';
	import ComboboxItemIndicator from './combobox-item-indicator.svelte';
	import { getComboboxState } from './combobox-context.js';

	let {
		value,
		label = undefined,
		disabled = false,
		class: className,
		children,
		...restProps
	}: {
		value: string;
		label?: string;
		disabled?: boolean;
		class?: string;
		children?: Snippet<[{ selected: boolean; highlighted: boolean }]>;
	} & Record<string, unknown> = $props();

	const combobox = getComboboxState();
	const text = $derived(label ?? value);

	// Filtrar é do design system: o combobox da lib espera a lista JÁ filtrada.
	// Cada opção decide se continua na lista, com a MESMA conta que a mensagem de
	// vazio usa para aparecer.
	// O item é remontado a partir das próprias props. `group` não entra: nesta
	// composição o grupo é um INVÓLUCRO, e a peça de item não o enxerga — um
	// filtro por grupo aqui recebe `undefined`, e é divergência de forma de
	// composição, não de capacidade.
	const visible = $derived(combobox.matches({ value, label: text, disabled }));

	// `aria-selected="false"` é escrito por nós, depois do espalhamento: a lib
	// OMITE o atributo quando a opção não está escolhida, e a regra de estilo
	// esconde a marca de escolhido justamente por `[aria-selected="false"]` — sem
	// o atributo, toda opção apareceria marcada.
</script>

{#if visible}
	<ComboboxPrimitive.Item {value} label={text} {disabled} {...restProps}>
		{#snippet child({ props, selected, highlighted })}
			<div
				{...props}
				class={cn('nds-combobox-item', className)}
				data-slot="combobox-item"
				aria-selected={selected ? 'true' : 'false'}
				aria-disabled={disabled ? 'true' : undefined}
			>
				{#if children}
					{@render children({ selected, highlighted })}
				{:else}
					<span data-slot="combobox-item-text">{text}</span>
					<ComboboxItemIndicator />
				{/if}
			</div>
		{/snippet}
	</ComboboxPrimitive.Item>
{/if}
