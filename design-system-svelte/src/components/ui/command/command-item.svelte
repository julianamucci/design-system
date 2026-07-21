<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn("nds-command-item", className)}
	{...restProps}
>
	{@render children?.()}
	<CheckIcon class="nds-command-item-check" />
</CommandPrimitive.Item>
