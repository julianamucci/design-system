<script lang="ts">
	import { cn } from '@/lib/utils.js';

	// Dentro de um `role="listbox"` o traço é DECORATIVO: `role="separator"` ali
	// não é descendente permitido, e quem separa para o leitor de tela é o
	// agrupamento. Mesma decisão já tomada no separador do Select.

	let { class: className, ...restProps }: { class?: string } & Record<string, unknown> = $props();
</script>

<div
	class={cn('nds-combobox-separator', className)}
	data-slot="combobox-separator"
	aria-hidden="true"
	{...restProps}
></div>
