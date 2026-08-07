<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { getContext } from "svelte";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { ACCORDION_ITEM_IDS, type AccordionItemIds } from "./accordion-a11y.js";

	const ids = getContext<AccordionItemIds | undefined>(ACCORDION_ITEM_IDS);

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps["level"];
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="nds-accordion-header">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(
			"nds-accordion-trigger",
			className
		)}
		{...restProps}
		id={ids?.triggerId}
		aria-controls={ids?.contentId}
	>
		<!-- O rótulo vive num <span> próprio: o sublinhado de hover é
		     `.nds-accordion-trigger:hover > span:first-child` e não deve
		     alcançar os ícones. Mesma marcação nas 4 stacks. -->
		<span>{@render children?.()}</span>
		<!-- Um único chevron que gira 180° ao abrir (ver accordion.css). -->
		<ChevronDownIcon data-slot="accordion-trigger-icon" class="nds-accordion-icon" />
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
