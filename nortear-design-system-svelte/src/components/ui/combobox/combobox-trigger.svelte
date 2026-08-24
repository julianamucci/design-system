<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';
	import ComboboxIcon from './combobox-icon.svelte';

	// `tabindex="-1"` é escrito por nós: quem carrega o foco é a busca, e o Tab
	// tem de SAIR do conjunto em vez de parar num segundo alvo que repete o que a
	// seta para baixo já faz.

	let {
		class: className,
		'aria-label': ariaLabel = 'Abrir lista',
		children,
		...restProps
	}: { class?: string; 'aria-label'?: string; children?: Snippet } & Record<string, unknown> =
		$props();
</script>

<ComboboxPrimitive.Trigger {...restProps}>
	{#snippet child({ props })}
		<button
			{...props}
			type="button"
			class={cn('nds-combobox-trigger', className)}
			data-slot="combobox-trigger"
			tabindex={-1}
			aria-label={ariaLabel}
		>
			{#if children}
				{@render children()}
			{:else}
				<ComboboxIcon />
			{/if}
		</button>
	{/snippet}
</ComboboxPrimitive.Trigger>
