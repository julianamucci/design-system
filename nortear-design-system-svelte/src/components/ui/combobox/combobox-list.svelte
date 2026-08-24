<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';
	import { getComboboxState } from './combobox-context.js';

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();

	// O `{#key}` remonta as opções a cada mudança do que foi digitado, e é o que
	// faz a PRIMEIRA opção sobrevivente virar a ativa.
	//
	// Sem ele o defeito é silencioso: a lib elege a opção ativa no mesmo instante
	// da digitação, antes de o filtro tirar as que não casam, e
	// `aria-activedescendant` segue apontando um item que acabou de sair do
	// documento — o leitor de tela anuncia uma opção fantasma.
	const combobox = getComboboxState();
</script>

<ComboboxPrimitive.Viewport {...restProps}>
	{#snippet child({ props })}
		<div
			{...props}
			id={combobox.listboxId}
			class={cn('nds-combobox-list', className)}
			data-slot="combobox-list"
			role="listbox"
			aria-multiselectable={combobox.multiple ? 'true' : undefined}
		>
			{#key combobox.query}
				{@render children?.()}
			{/key}
		</div>
	{/snippet}
</ComboboxPrimitive.Viewport>
