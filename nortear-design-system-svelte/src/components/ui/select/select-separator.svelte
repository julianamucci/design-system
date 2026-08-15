<script lang="ts">
	import type { Separator as SeparatorPrimitive } from "bits-ui";
	import { Separator } from "@/components/ui/separator/index.js";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<!--
	`decorative`: dentro de um listbox a linha é DECORATIVA. Sem isso o primitivo
	emite `role="separator"` como filho direto de `role="listbox"`, que é filho
	não permitido (axe `aria-required-children`) — a lista inteira perde a
	validade semântica por causa de um traço. Quem separa para o leitor de tela é
	o grupo. Mesma decisão nas outras stacks.
-->
<Separator
	bind:ref
	decorative
	data-slot="select-separator"
	class={cn("nds-select-separator", className)}
	{...restProps}
/>
