<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = "horizontal",
		class: className,
		thumbAriaLabels,
		thumbAriaLabel = "Valor",
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
		thumbAriaLabels?: string[];
		thumbAriaLabel?: string;
	} = $props();
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="slider"
	{orientation}
	class={cn(
		"nds-slider",
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slot="slider-track"
			data-orientation={orientation}
			class={cn(
				"nds-slider-track"
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn(
					"nds-slider-range"
				)}
			/>
		</span>
		{#each thumbItems as thumb (thumb)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				aria-label={thumbAriaLabels?.[thumb.index] ?? thumbAriaLabel}
				class="nds-slider-thumb"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
