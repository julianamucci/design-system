<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { setContext } from "svelte";
	import { cn } from "@/lib/utils.js";
	import { ACCORDION_ITEM_IDS, type AccordionItemIds } from "./accordion-a11y.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AccordionPrimitive.ItemProps = $props();

	// Ver accordion-a11y.ts: o bits-ui não liga trigger e painel por id.
	const uid = $props.id();
	setContext<AccordionItemIds>(ACCORDION_ITEM_IDS, {
		triggerId: `${uid}-trigger`,
		contentId: `${uid}-content`,
	});
</script>

<AccordionPrimitive.Item
	bind:ref
	data-slot="accordion-item"
	class={cn("nds-accordion-item", className)}
	{...restProps}
/>
