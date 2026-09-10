<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import { tick, untrack } from "svelte";
	import AlertDialogPortal from "./alert-dialog-portal.svelte";
	import AlertDialogOverlay from "./alert-dialog-overlay.svelte";
	import { setDescriptionRegistry } from "./alert-dialog-description-registry.js";
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
	 * `aria-describedby` sai do registro das descrições montadas, e não do
	 * estado da lib — ver `alert-dialog-description-registry.ts`. Sem descrição
	 * o atributo não é declarado (D4); com ela, aponta para o id dela; quando ela
	 * sai, o atributo sai junto. Um `aria-describedby` explícito de quem consome
	 * vence o registro.
	 *
	 * `untrack` no registro: quem registra é o `$effect` da descrição, e ler a
	 * lista ali dentro faria o efeito depender dela e se registrar de novo a
	 * cada mudança, sem fim.
	 */
	let descriptionIds = $state<string[]>([]);
	setDescriptionRegistry({
		register(id) {
			untrack(() => {
				descriptionIds = [...descriptionIds, id];
			});
			return () => {
				untrack(() => {
					descriptionIds = descriptionIds.filter((current) => current !== id);
				});
			};
		},
	});
	const describedBy = $derived(
		restProps["aria-describedby"] ??
			(descriptionIds.length > 0 ? descriptionIds.join(" ") : undefined)
	);

	/**
	 * Foco inicial no Cancel — a saída segura (D3), por escolha EXPLÍCITA, e
	 * não pela ordem do rodapé: o alvo é procurado pelo slot do Cancelar, então
	 * reordenar o rodapé ou abrir pelo toque não muda para onde o foco vai.
	 *
	 * O conteúdo compartilhado documenta isso em `accessibility.item3` e
	 * `functional.item1`. Deixado à lib, não acontecia: o `FocusScope` do bits-ui
	 * monta junto com a referência do painel e procura o primeiro tabbable num
	 * `requestAnimationFrame` em que o rodapé ainda não existe no DOM. Sem
	 * candidato, ele foca o próprio container — e só volta a procurar num
	 * `focusout`, que nunca chega. Medido pela sonda: o foco ficava no
	 * `div[data-slot="alert-dialog-content"]` de 0 a 550ms, com Cancel e Action
	 * já montados e com `tabindex="0"`.
	 *
	 * O efeito para quem usa: o leitor de tela anuncia o painel em vez de
	 * "Cancelar, botão", e é preciso um Tab a mais para alcançar a saída segura.
	 *
	 * `tick()` espera o commit pendente do Svelte — é ele que traz o rodapé.
	 */
	async function focusSafeExit(event: Event) {
		onOpenAutoFocus?.(event as never);
		if (event.defaultPrevented) return;
		event.preventDefault();
		await tick();
		const panel = ref;
		if (!panel) return;
		const target =
			panel.querySelector<HTMLElement>('[data-slot="alert-dialog-cancel"]') ??
			panel.querySelector<HTMLElement>(
				'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			) ??
			panel;
		target.focus();
	}
</script>

<AlertDialogPortal {...portalProps}>
	<AlertDialogOverlay />
	<AlertDialogPrimitive.Content
		bind:ref
		data-slot="alert-dialog-content"
		class={cn("nds-alert-dialog-content", className)}
		onOpenAutoFocus={focusSafeExit}
		{...restProps}
		aria-describedby={describedBy}
	/>
</AlertDialogPortal>
