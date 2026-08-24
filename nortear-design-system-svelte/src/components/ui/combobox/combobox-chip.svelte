<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '@/lib/utils.js';
	import { getComboboxState, setChipValue } from './combobox-context.js';

	let {
		value,
		label = undefined,
		class: className,
		children,
		...restProps
	}: {
		value: string;
		/** Sobrepõe o rótulo vindo das opções da raiz. */
		label?: string;
		class?: string;
		children?: Snippet;
	} & Record<string, unknown> = $props();

	const combobox = getComboboxState();
	const text = $derived(label ?? combobox.labelFor(value));

	// O botão de remover é filho do chip e precisa saber o que remove — desce
	// por contexto para não obrigar quem compõe a repetir o valor duas vezes.
	setChipValue(() => value);
</script>

<span
	class={cn('nds-combobox-chip', className)}
	data-slot="combobox-chip"
	data-value={value}
	data-disabled={combobox.disabled ? '' : undefined}
	{...restProps}
>
	<span data-slot="combobox-chip-text">{text}</span>
	{@render children?.()}
</span>
