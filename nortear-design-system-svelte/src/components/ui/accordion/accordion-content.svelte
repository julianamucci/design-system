<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { getContext } from "svelte";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import { ACCORDION_ITEM_IDS, type AccordionItemIds } from "./accordion-a11y.js";

	const ids = getContext<AccordionItemIds | undefined>(ACCORDION_ITEM_IDS);

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.ContentProps> = $props();
</script>

<AccordionPrimitive.Content
	bind:ref
	data-slot="accordion-content"
	class="nds-accordion-content"
	hiddenUntilFound
	{...restProps}
	id={ids?.contentId}
>
	<div
		class={cn(
			"nds-accordion-content-body",
			className
		)}
	>
		{@render children?.()}
	</div>
</AccordionPrimitive.Content>
