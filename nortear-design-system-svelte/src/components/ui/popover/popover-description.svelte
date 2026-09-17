<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<!-- `<p>`, e não `<div>`: era a única das cinco a sair sem semântica de
     parágrafo — vanilla (que é a referência), vue, react e angular já saíam em
     `<p>`. A folha compartilhada conta com isso: `.nds-popover-description`
     zera a margem justamente porque o agente de usuário dá `1em` vertical ao
     parágrafo, e num container flex margem NÃO colapsa. -->
<p
	bind:this={ref}
	data-slot="popover-description"
	class={cn("nds-popover-description", className)}
	{...restProps}
>
	{@render children?.()}
</p>
