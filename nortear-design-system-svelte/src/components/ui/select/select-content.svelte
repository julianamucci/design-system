<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import SelectPortal from "./select-portal.svelte";
	import SelectScrollUpButton from "./select-scroll-up-button.svelte";
	import SelectScrollDownButton from "./select-scroll-down-button.svelte";
	import { cn, type WithoutChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		portalProps,
		children,
		preventScroll = true,
		...restProps
	}: WithoutChild<SelectPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SelectPortal>>;
	} = $props();

	// Id próprio e estável: o trigger precisa apontar `aria-controls` para cá, e
	// depender do id gerado pelo bits-ui não funciona — nem sempre existe.
	const contentId = `nds-select-content-${crypto.randomUUID().slice(0, 8)}`;
</script>

<SelectPortal {...portalProps}>
	<!-- aria-label: o conteúdo do select é um listbox, e listbox sem nome
	     acessível é violação de axe (aria-input-field-name). O React já nomeia
	     a lista com "Opções"; aqui não havia nome nenhum. Consumidor que passar
	     o seu continua vencendo, porque restProps vem depois. -->
	<SelectPrimitive.Content
		bind:ref
		{sideOffset}
		{preventScroll}
		data-slot="select-content"
		id={contentId}
		aria-label="Opções"
		class={cn(
			"nds-select-content",
			className
		)}
		{...restProps}
	>
		<SelectScrollUpButton />
		<SelectPrimitive.Viewport
			class={cn(
				"nds-select-viewport"
			)}
		>
			{@render children?.()}
		</SelectPrimitive.Viewport>
		<SelectScrollDownButton />
	</SelectPrimitive.Content>
</SelectPortal>
