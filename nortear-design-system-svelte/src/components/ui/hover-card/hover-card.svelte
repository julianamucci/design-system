<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from "bits-ui";

	// PATCH: api — `defaultOpen` não existe no LinkPreview do bits-ui, mas é a
	// API documentada do HoverCard nas 4 stacks (ver PATCHES.md#svelte-hovercard-defaultopen).
	// Vira o valor inicial de `open`, preservando `bind:open` no consumidor.
	let {
		defaultOpen = false,
		open = $bindable(defaultOpen),
		openDelay = 0,
		closeDelay = 0,
		...restProps
	}: HoverCardPrimitive.RootProps & { defaultOpen?: boolean } = $props();
</script>

<HoverCardPrimitive.Root bind:open {openDelay} {closeDelay} {...restProps} />
