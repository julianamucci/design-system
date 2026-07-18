<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { Input } from "@/components/ui/input/index.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Input> = $props();
</script>

<Input
	bind:ref
	data-slot="input-group-control"
	class={cn("nds-input-group-control", className)}
	bind:value
	{...props}
/>
