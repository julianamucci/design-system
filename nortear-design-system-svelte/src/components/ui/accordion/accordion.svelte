<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: AccordionPrimitive.RootProps = $props();

	// O modo fica registrado no DOM, e não só na prop: sem isso nada distingue um
	// accordion single de um multiple depois de montado. Mesmo atributo nas 4 stacks.
	const mode = $derived(restProps.type);
</script>

<AccordionPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="accordion"
	data-type={mode}
	class={cn("nds-accordion", className)}
	{...restProps}
/>
