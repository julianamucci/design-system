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
		closeLabel = "Fechar",
		onClosePress,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
		showCloseButton?: boolean;
		/**
		 * Avisa que o X do canto foi acionado — é o `close-press` que o bits-ui
		 * NÃO publica. O `onOpenChange` diz que o diálogo fechou, nunca por onde;
		 * das quatro saídas, esta é a única que mora dentro deste wrapper, então
		 * é daqui que ela tem de sair. Quem escuta traduz em `DialogCloseReason`
		 * pelo `close-reason.ts` ao lado; o primitivo não conhece analytics.
		 *
		 * Fica FORA do `restProps` de propósito: espalhado no `Content` viraria
		 * atributo inválido no elemento do painel.
		 */
		onClosePress?: () => void;
		/**
		 * Nome acessível do X do canto. Vai num `<span class="nds-sr-only">` e não
		 * num `aria-label`: é o mecanismo que o conteúdo compartilhado documenta, e
		 * texto real sobrevive à tradução automática da página, que ignora
		 * `aria-label`.
		 *
		 * A prop existe porque o rótulo estava CRAVADO em português aqui dentro:
		 * quem consome o design system noutro idioma tinha de reescrever o
		 * primitivo para trocar uma palavra. O default preserva todo call site.
		 */
		closeLabel?: string;
	} = $props();
</script>

<DialogPortal {...portalProps}>
	<!--
		Overlay e painel são IRMÃOS, sempre: é o arranjo em que o painel fica fixo
		no centro sem depender do overlay para posicionar, e o véu não rola.
	-->
	<DialogOverlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn("nds-dialog-content", className)}
		{...restProps}
	>
		{@render children?.()}
		{#if showCloseButton}
			<!--
				O `onclick` vai no `DialogPrimitive.Close`, e não no `Button`: a lib
				faz `mergeProps(restProps, closeState.props)`, que ENCADEIA os dois
				manipuladores. Escrito depois do `{...props}` no botão, ele venceria
				o handler que fecha o diálogo — é o mesmo padrão que o Cancelar do
				rodapé desta família já encadeia à mão.
			-->
			<DialogPrimitive.Close data-slot="dialog-close" onclick={onClosePress}>
				{#snippet child({ props })}
					<Button variant="ghost" class="nds-dialog-close-position" size="icon-sm" {...props}>
						<XIcon  />
						<span class="nds-sr-only">{closeLabel}</span>
					</Button>
				{/snippet}
			</DialogPrimitive.Close>
		{/if}
	</DialogPrimitive.Content>
</DialogPortal>
