<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();
</script>

<ComboboxPrimitive.Group
	class={cn('nds-combobox-group', className)}
	data-slot="combobox-group"
	{...restProps}
>
	{@render children?.()}
</ComboboxPrimitive.Group>
