<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '@/lib/utils.js';

	// Sempre no fluxo, escondida por `visibility` quando a opção não está
	// escolhida: tirar o nó faria o rótulo dançar para o lado a cada escolha.

	let { class: className }: { class?: string } = $props();
</script>

<span class={cn('nds-combobox-item-indicator', className)} data-slot="combobox-item-indicator">
	<CheckIcon aria-hidden="true" />
</span>
