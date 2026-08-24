<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '@/lib/utils.js';
	import { getComboboxState } from './combobox-context.js';

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();

	// O `for` aponta o id que a raiz gerou, e não um id descoberto pelo DOM: o
	// campo é o único elemento focável do conjunto, e ligar o rótulo a ele é o
	// que faz o clique no texto levar o cursor para a busca.
	const combobox = getComboboxState();
</script>

<label
	for={combobox.inputId}
	class={cn('nds-combobox-label', className)}
	data-slot="combobox-label"
	{...restProps}
>
	{@render children?.()}
</label>
