<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '@/lib/utils.js';
	import { getComboboxState } from './combobox-context.js';

	let {
		class: className,
		'aria-label': ariaLabel = 'Limpar',
		...restProps
	}: { class?: string; 'aria-label'?: string } & Record<string, unknown> = $props();

	const combobox = getComboboxState();

	function handlePointer(event: MouseEvent): void {
		// Sem isto o foco sai do campo antes do clique e a lista fecha por perda
		// de foco no meio do gesto.
		event.preventDefault();
	}

	function handleClick(): void {
		combobox.clearAll();
	}
</script>

<button
	type="button"
	class={cn('nds-combobox-clear', className)}
	data-slot="combobox-clear"
	aria-label={ariaLabel}
	disabled={combobox.disabled}
	onmousedown={handlePointer}
	onclick={handleClick}
	{...restProps}
>
	<XIcon aria-hidden="true" />
</button>
