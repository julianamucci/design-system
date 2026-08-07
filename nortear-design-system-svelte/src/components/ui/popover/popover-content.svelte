<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import PopoverPortal from "./popover-portal.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		align = "center",
		portalProps,
		...restProps
	}: PopoverPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();

	// `role="dialog"` exige nome acessível (axe aria-dialog-name). Mesmo critério
	// do Vanilla, que é a referência cross-stack: um heading interno vira
	// aria-labelledby; sem heading, o texto do trigger vira aria-label.
	// Só age quando o consumidor não nomeou — nomear à mão sempre vence.
	$effect(() => {
		const el = ref;
		if (!el) return;
		if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return;

		const heading = el.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]');
		if (heading) {
			if (!heading.id) heading.id = `${el.id || "popover"}-title`;
			el.setAttribute("aria-labelledby", heading.id);
			return;
		}
		const trigger = el.ownerDocument.querySelector<HTMLElement>(
			'[aria-haspopup="dialog"][aria-expanded="true"]',
		);
		el.setAttribute("aria-label", trigger?.textContent?.trim() || "Popover");
	});
</script>

<PopoverPortal {...portalProps}>
	<!-- role="dialog": o bits-ui não emite role no conteúdo, mas põe
	     aria-haspopup="dialog" no trigger. Sem o par, o leitor de tela anuncia
	     "abre diálogo" e o que abre não é um diálogo. O Vanilla — referência
	     cross-stack — já define role="dialog" no painel. -->
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		role="dialog"
		{sideOffset}
		{align}
		class={cn("nds-popover-content", className)}
		{...restProps}
	/>
</PopoverPortal>
