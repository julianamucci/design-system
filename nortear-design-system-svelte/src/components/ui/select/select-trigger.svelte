<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: "sm" | "default";
	} = $props();

	// NOTA: falta `aria-controls` apontando para o listbox — o axe reprova
	// por atributo ARIA obrigatorio ausente (aria-required-attr). O bits-ui nao
	// emite nem o role nem o id do painel, e tentar ligar por observador nao
	// funcionou: o painel nao expoe id alcancavel a partir do trigger. Registrado
	// no FIXES-NEEDED; provavelmente precisa de contexto compartilhado, como o
	// ACCORDION_ITEM_IDS do accordion.
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	role="combobox"
	class={cn(
		"nds-select-trigger",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="nds-select-trigger-icon" />
</SelectPrimitive.Trigger>
