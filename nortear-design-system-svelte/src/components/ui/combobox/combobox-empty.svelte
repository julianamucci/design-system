<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '@/lib/utils.js';
	import { getComboboxState } from './combobox-context.js';

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();

	// Irmã da lista, e não filha: uma mensagem sem papel dentro de
	// `role="listbox"` é filho não permitido, e a lista inteira perderia a
	// validade semântica por causa de um texto.
	const combobox = getComboboxState();
</script>

{#if combobox.matchCount === 0}
	<div class={cn('nds-combobox-empty', className)} data-slot="combobox-empty" {...restProps}>
		{@render children?.()}
	</div>
{/if}
