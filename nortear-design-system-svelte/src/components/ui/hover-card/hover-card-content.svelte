<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import HoverCardPortal from "./hover-card-portal.svelte";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		align = "center",
		sideOffset = 4,
		portalProps,
		...restProps
	}: HoverCardPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof HoverCardPortal>>;
	} = $props();

	// Mesmo critério do Vanilla (referência cross-stack): `role="dialog"` exige
	// nome acessível — heading interno vira aria-labelledby, senão o texto do
	// trigger vira aria-label. Só age quando o consumidor não nomeou.
	$effect(() => {
		const el = ref;
		if (!el) return;
		if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return;

		const heading = el.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]');
		if (heading) {
			if (!heading.id) heading.id = `${el.id || "hover-card"}-title`;
			el.setAttribute("aria-labelledby", heading.id);
			return;
		}
		const trigger = el.ownerDocument.querySelector<HTMLElement>('[data-link-preview-trigger]');
		el.setAttribute("aria-label", trigger?.textContent?.trim() || "Prévia");
	});
</script>

<HoverCardPortal {...portalProps}>
	<!-- role="dialog": o bits-ui não emite role no conteúdo. O Vanilla já
	     define, e é o que torna a prévia anunciável pelo leitor de tela. -->
	<HoverCardPrimitive.Content
		bind:ref
		data-slot="hover-card-content"
		role="dialog"
		{align}
		{sideOffset}
		class={cn("nds-hover-card-content", className)}
		{...restProps}
	/>
</HoverCardPortal>
