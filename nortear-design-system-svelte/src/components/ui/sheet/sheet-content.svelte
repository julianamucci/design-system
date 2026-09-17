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
	import { isSheetCloseTrigger } from "./close-reason";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		side = "right",
		showCloseButton = true,
		closeLabel = "Fechar",
		onClosePress,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
		side?: Side;
		showCloseButton?: boolean;
		/**
		 * Avisa que um controle de fechar foi acionado — é o `close-press` que o
		 * bits-ui NÃO publica. O `onOpenChange` diz que o painel fechou, nunca
		 * por onde. Quem escuta traduz em `SheetCloseReason` pelo
		 * `close-reason.ts` ao lado; o primitivo não conhece analytics.
		 *
		 * Vale para TODO `[data-slot="sheet-close"]` do painel, e não só para o X
		 * que este wrapper monta: o rodapé é de quem compõe, e o ouvinte de
		 * captura abaixo é o que alcança os botões que não nascem aqui.
		 *
		 * Fica FORA do `restProps` de propósito: espalhado no `Content` viraria
		 * atributo inválido no elemento do painel.
		 */
		onClosePress?: () => void;
		/**
		 * Nome acessível do botão X. Era a palavra "Fechar" escrita direto no
		 * markup, e essa era a única string de interface do Sheet presa a um
		 * idioma: numa página em inglês ou espanhol o leitor de tela ouvia
		 * português, sem que nada na chamada pudesse mudar isso.
		 */
		closeLabel?: string;
		children: Snippet;
	} = $props();

	/**
	 * DELEGAÇÃO na captura do painel — o que faltava a esta stack.
	 *
	 * O rodapé é de quem compõe: um ouvinte por botão só alcançaria o X que este
	 * wrapper monta, e era essa a lacuna que obrigava cada `SheetClose` a
	 * espalhar um manipulador à mão. Um esquecido fechava o painel relatando
	 * `api` — "decisão de dentro" para um clique que foi de botão —, e nada
	 * reprovava. Mesma delegação do `sheet.ts` do Vanilla, que é a referência do
	 * contrato.
	 *
	 * CAPTURA, e não borbulha: o painel é ANCESTRAL dos controles de fechar, e a
	 * fase de captura nele corre antes de o clique chegar ao botão — ou seja,
	 * antes de a lib fechar o painel e emitir o `onOpenChange` que lê a anotação.
	 */
	$effect(() => {
		const panel = ref;
		if (!panel) return;
		const onClickCapture = (event: MouseEvent) => {
			if (isSheetCloseTrigger(event.target)) onClosePress?.();
		};
		panel.addEventListener('click', onClickCapture, true);
		return () => panel.removeEventListener('click', onClickCapture, true);
	});
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
			<!--
				O `onclick` vai no `SheetPrimitive.Close`, e não no `Button`: a lib
				faz `mergeProps(restProps, closeState.props)`, que ENCADEIA os dois
				manipuladores. Escrito depois do `{...props}` no botão, ele venceria
				o handler que fecha o painel — é a quarta ocorrência do mesmo padrão
				nesta família.
			-->
			<SheetPrimitive.Close data-slot="sheet-close" onclick={onClosePress}>
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
