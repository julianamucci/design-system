<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { tick } from "svelte";
	import AlertDialogPortal from "./alert-dialog-portal.svelte";
	import AlertDialogOverlay from "./alert-dialog-overlay.svelte";
	import { cn, type WithoutChild, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		onOpenAutoFocus,
		...restProps
	}: WithoutChild<AlertDialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof AlertDialogPortal>>;
	} = $props();

	/**
	 * Foco inicial no Cancel — a saída segura.
	 *
	 * O conteúdo compartilhado documenta isso em `accessibility.item3` e
	 * `functional.item1`, e as outras quatro stacks entregam. Aqui não entregava:
	 * o `FocusScope` do bits-ui monta junto com a referência do painel e procura
	 * o primeiro tabbable num `requestAnimationFrame` em que o rodapé ainda não
	 * existe no DOM. Sem candidato, ele foca o próprio container — e só volta a
	 * procurar num `focusout`, que nunca chega. Medido pela sonda: o foco ficava
	 * no `div[data-slot="alert-dialog-content"]` de 0 a 550ms, com Cancel e
	 * Action já montados e com `tabindex="0"`.
	 *
	 * O efeito para quem usa: o leitor de tela anuncia o painel em vez de
	 * "Cancelar, botão", e é preciso um Tab a mais para alcançar a saída segura.
	 *
	 * `tick()` espera o commit pendente do Svelte — é ele que traz o rodapé.
	 */
	async function focarSaidaSegura(event: Event) {
		onOpenAutoFocus?.(event as never);
		if (event.defaultPrevented) return;
		event.preventDefault();
		await tick();
		const painel = ref;
		if (!painel) return;
		const alvo =
			painel.querySelector<HTMLElement>('[data-slot="alert-dialog-cancel"]') ??
			painel.querySelector<HTMLElement>(
				'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			) ??
			painel;
		alvo.focus();
	}
</script>

<AlertDialogPortal {...portalProps}>
	<AlertDialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		data-slot="alert-dialog-content"
		class={cn("nds-alert-dialog-content", className)}
		onOpenAutoFocus={focarSaidaSegura}
		{...restProps}
	/>
</AlertDialogPortal>
