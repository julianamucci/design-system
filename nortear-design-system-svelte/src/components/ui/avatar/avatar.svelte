<script lang="ts">
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		loadingStatus = $bindable("loading"),
		delayMs,
		size = "md",
		class: className,
		...restProps
	}: AvatarPrimitive.RootProps & {
		/** Atraso da troca entre fallback e imagem. Nesta lib a prop é da raiz. */
		delayMs?: number;
		/** Presets do CSS: sm 24 · md 32 · lg 40 · xl 48 · 2xl 64. */
		size?: "sm" | "md" | "lg" | "xl" | "2xl";
	} = $props();
</script>

<AvatarPrimitive.Root
	bind:ref
	bind:loadingStatus
	{delayMs}
	data-slot="avatar"
	data-size={size}
	class={cn(
		"nds-avatar",
		className
	)}
	{...restProps}
/>
