<script lang="ts">
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

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
	>
		{@render children?.()}
		<ChevronDownIcon data-slot="accordion-trigger-icon" class="nds-accordion-icon nds-accordion-icon-closed" />
		<ChevronUpIcon data-slot="accordion-trigger-icon" class="nds-accordion-icon nds-accordion-icon-open" />
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
