<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '@/lib/utils.js';
	import { getChipValue, getComboboxState } from './combobox-context.js';

	let {
		class: className,
		'aria-label': ariaLabel = undefined,
		removeLabel = 'Remover',
		...restProps
	}: {
		class?: string;
		'aria-label'?: string;
		/** Verbo do nome acessível; o rótulo do chip entra depois dele. */
		removeLabel?: string;
	} & Record<string, unknown> = $props();

	const combobox = getComboboxState();
	const readChipValue = getChipValue();
	const value = $derived(readChipValue());

	// Nome PRÓPRIO, nunca só "Remover": numa lista de cinco chips, cinco botões
	// com o mesmo nome são indistinguíveis para quem navega por lista de
	// controles do leitor de tela.
	const accessibleName = $derived(ariaLabel ?? `${removeLabel} ${combobox.labelFor(value)}`);

	function handlePointer(event: MouseEvent): void {
		// `mousedown` levaria o foco para fora do input antes do clique, e o campo
		// fecharia por perda de foco no meio do gesto.
		event.preventDefault();
	}

	function handleClick(event: MouseEvent): void {
		event.stopPropagation();
		combobox.deselect(value);
	}
</script>

<button
	type="button"
	class={cn('nds-combobox-chip-remove', className)}
	data-slot="combobox-chip-remove"
	aria-label={accessibleName}
	disabled={combobox.disabled}
	onmousedown={handlePointer}
	onclick={handleClick}
	{...restProps}
>
	<XIcon aria-hidden="true" />
</button>
