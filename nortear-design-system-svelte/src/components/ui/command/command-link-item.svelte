<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { useCommandLabelRegistry } from "./command-context.js";

	let {
		ref = $bindable(null),
		class: className,
		value,
		...restProps
	}: CommandPrimitive.LinkItemProps = $props();

	/**
	 * O comando que navega também é filtrado pelo rótulo (C9) — mesmo caminho
	 * do `command-item.svelte`, ver `command-context.ts`.
	 */
	const labels = useCommandLabelRegistry();

	$effect(() => {
		if (value) labels?.track(value, ref);
	});
	$effect(() => {
		const registered = value;
		return () => {
			if (registered) labels?.forget(registered);
		};
	});
</script>

<CommandPrimitive.LinkItem
	bind:ref
	data-slot="command-item"
	class={cn("nds-command-item", className)}
	{value}
	{...restProps}
/>
