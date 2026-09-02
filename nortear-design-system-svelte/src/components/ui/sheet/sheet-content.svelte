<!--
	Decisão de acessibilidade do Sheet — bloco canônico no sheet.ts do Vanilla.
	Em resumo: painel modal que entra pela borda, com role="dialog",
	aria-modal="true", foco preso, foco devolvido ao gatilho no fecho, Escape e
	clique no véu fechando, rolagem da página travada, corpo rolável com papel e
	nome, e NENHUMA região viva.

	O mecanismo desta stack, medido em node_modules: o Dialog.Content do bits-ui
	escreve role="dialog" e aria-modal="true" por conta própria — é a única das
	quatro libs que não precisa do wrapper para isso — e empilha FocusScope
	(trapFocus, padrão TRUE), EscapeLayer, DismissibleLayer e ScrollLock
	(preventScroll, padrão TRUE). Aqui não existe prop modal: o painel é sempre
	modal, e é por isso que este wrapper não tem o que decidir.
-->
<script lang="ts" module>
	export type Side = "top" | "right" | "bottom" | "left";
</script>

<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import SheetPortal from "./sheet-portal.svelte";
	import SheetOverlay from "./sheet-overlay.svelte";
	import { Button } from "@/components/ui/button/index.js";
	import XIcon from '@lucide/svelte/icons/x';
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		side = "right",
		showCloseButton = true,
		closeLabel = "Fechar",
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
		side?: Side;
		showCloseButton?: boolean;
		/**
		 * Nome acessível do botão X. Era a palavra "Fechar" escrita direto no
		 * markup, e essa era a única string de interface do Sheet presa a um
		 * idioma: numa página em inglês ou espanhol o leitor de tela ouvia
		 * português, sem que nada na chamada pudesse mudar isso.
		 */
		closeLabel?: string;
		children: Snippet;
	} = $props();
</script>

<SheetPortal {...portalProps}>
	<SheetOverlay />
	<SheetPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		data-side={side}
		class={cn(
			"nds-sheet-content",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<SheetPrimitive.Close data-slot="sheet-close">
				{#snippet child({ props })}
					<Button variant="ghost" class="nds-sheet-close-position" size="icon-sm" {...props}>
						<XIcon  />
						<span class="nds-sr-only">{closeLabel}</span>
					</Button>
				{/snippet}
			</SheetPrimitive.Close>
		{/if}
	</SheetPrimitive.Content>
</SheetPortal>
