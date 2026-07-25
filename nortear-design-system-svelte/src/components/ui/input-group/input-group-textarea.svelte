<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import { Textarea } from "@/components/ui/textarea/index.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Textarea> = $props();
</script>

<Textarea
	bind:ref
	data-slot="input-group-control"
	class={cn("nds-input-group-control", className)}
	bind:value
	{...props}
/>
