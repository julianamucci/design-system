<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';

	// `role="group"` sem nome não agrupa nada para quem usa leitor de tela: é o
	// `aria-labelledby` que a lib amarra deste cabeçalho ao grupo que faz o
	// trabalho.

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();
</script>

<ComboboxPrimitive.GroupHeading
	class={cn('nds-combobox-group-label', className)}
	data-slot="combobox-group-label"
	{...restProps}
>
	{@render children?.()}
</ComboboxPrimitive.GroupHeading>
