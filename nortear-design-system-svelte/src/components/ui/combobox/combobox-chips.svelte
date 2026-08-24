<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '@/lib/utils.js';

	// `display: contents` na folha, e é de propósito: uma caixa de flex própria
	// faria os chips deixarem de quebrar linha junto com o texto do campo.

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();
</script>

<div class={cn('nds-combobox-chips', className)} data-slot="combobox-chips" {...restProps}>
	{@render children?.()}
</div>
