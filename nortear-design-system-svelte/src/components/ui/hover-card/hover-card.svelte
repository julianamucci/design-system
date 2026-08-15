<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from "bits-ui";
	import { criarContextoHoverCard } from "./context.svelte.js";

	// PATCH: api — `defaultOpen` não existe no LinkPreview do bits-ui, mas é a
	// API documentada do HoverCard nas 5 stacks (ver PATCHES.md#svelte-hovercard-defaultopen).
	// Vira o valor inicial de `open`, preservando `bind:open` no consumidor.
	//
	// Espera padrão do design system: 600ms para abrir, 300ms para fechar. O
	// bits-ui traz 700/300, e este arquivo trazia 0/0 — o cartão abria no mesmo
	// instante do hover, que é justamente o que a diretriz de uso desaconselha,
	// e a story chamada "Default (700ms / 300ms)" documentava um tempo que nunca
	// existiu.
	let {
		defaultOpen = false,
		open = $bindable(defaultOpen),
		openDelay = 600,
		closeDelay = 300,
		...restProps
	}: HoverCardPrimitive.RootProps & { defaultOpen?: boolean } = $props();

	criarContextoHoverCard();
</script>

<HoverCardPrimitive.Root bind:open {openDelay} {closeDelay} {...restProps} />
