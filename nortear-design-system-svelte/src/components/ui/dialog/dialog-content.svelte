<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import DialogPortal from "./dialog-portal.svelte";
	import type { Snippet } from "svelte";
	// Import direto do arquivo, e não `import * as Dialog from "./index.js"`:
	// pelo namespace o overlay entrava como `Dialog.Overlay` e nenhuma varredura
	// por nome enxergava o uso — a peça parecia exportada e nunca renderizada.
	import DialogOverlay from "./dialog-overlay.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { Button } from "@/components/ui/button/index.js";
	import XIcon from '@lucide/svelte/icons/x';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		showCloseButton = true,
		scroll = false,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
		showCloseButton?: boolean;
		/**
		 * Rota B — o painel sai do centro fixo e entra no fluxo do overlay, que
		 * passa a ser quem rola. O cabeçalho sobe junto com o conteúdo.
		 *
		 * Para manter cabeçalho e rodapé parados (rota A), deixe em `false` e
		 * pendure `.nds-dialog-body-scroll` no corpo. Ver o docblock de
		 * `dialog.svelte`.
		 */
		scroll?: boolean;
	} = $props();

	// Clique na BARRA DE ROLAGEM do overlay não é clique fora: o ponteiro cai
	// além da caixa de conteúdo do elemento, e o primitivo desta stack não faz
	// essa conta antes de dispensar — arrastar a barra fechava o diálogo. Só
	// vale na rota B, que é a única em que o overlay rola.
	function ignoreScrollbarPress(event: PointerEvent): void {
		const target = event.target as HTMLElement | null;
		if (!target) return;
		if (event.offsetX > target.clientWidth || event.offsetY > target.clientHeight) {
			event.preventDefault();
		}
	}
</script>

{#snippet panel()}
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn("nds-dialog-content", scroll && "nds-dialog-content-scroll", className)}
		onInteractOutside={scroll ? ignoreScrollbarPress : undefined}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<DialogPrimitive.Close data-slot="dialog-close">
				{#snippet child({ props })}
					<Button variant="ghost" class="nds-dialog-close-position" size="icon-sm" {...props}>
						<XIcon  />
						<span class="nds-sr-only">Fechar</span>
					</Button>
				{/snippet}
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
{/snippet}

<DialogPortal {...portalProps}>
	<!--
		Na rota B o painel é FILHO do overlay: rolagem de um elemento só alcança o
		que está dentro dele. Na rota A eles seguem irmãos, que é o arranjo em que
		o painel fica fixo no centro sem depender do overlay para posicionar.
	-->
	{#if scroll}
		<DialogOverlay scroll>
			{@render panel()}
		</DialogOverlay>
	{:else}
		<DialogOverlay />
		{@render panel()}
	{/if}
</DialogPortal>
