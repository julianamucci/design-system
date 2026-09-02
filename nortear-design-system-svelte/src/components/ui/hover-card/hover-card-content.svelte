<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import HoverCardPortal from "./hover-card-portal.svelte";
	import { usarContextoHoverCard } from "./context.svelte.js";
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

	// Sem `role`: o bits-ui não emite papel no conteúdo, e desde 2026-09-02 o
	// design system também não. O painel é conteúdo DESCRITIVO — o gatilho o
	// aponta por `aria-describedby`, e é isso que faz o leitor de tela dizer o
	// CONTEÚDO do cartão em vez de só o gatilho. Ver o bloco canônico em
	// `hover-card.ts` do Vanilla.
	//
	// Sem nome próprio também: `aria-label` em elemento sem papel é
	// `aria-prohibited-attr` no axe. Os dois rótulos deixaram de ser extraídos do
	// `restProps` — não há mais valor calculado que eles pudessem sobrescrever.
	//
	// A associação é escrita quando o painel MONTA e desfeita quando ele desmonta,
	// que é exatamente a janela em que o alvo existe no documento: fechado, um
	// `aria-describedby` apontando para um `id` ausente é `aria-valid-attr-value`
	// no axe. O `id` é o que o primitivo já gera para o conteúdo.
	//
	// O efeito lê a ABERTURA do contexto, e não só a referência: o `PopperLayer`
	// do bits-ui de fato só renderiza o elemento com o cartão aberto, mas quem
	// devolve a referência a `null` no desmonte é a lib — depender só disso
	// deixaria a descrição presa se ela mudasse de comportamento. Com a abertura
	// no efeito, fechar SEMPRE dispara a limpeza.
	//
	// O gatilho vem do CONTEXTO, e não de uma busca no documento: com vários
	// cartões na mesma tela (a story Sides), o primeiro
	// `[data-link-preview-trigger]` seria descrito por todos eles.
	const contexto = usarContextoHoverCard();

	$effect(() => {
		const trigger = contexto?.trigger;
		const panel = ref;
		if (!contexto?.open || !trigger || !panel?.id) return;
		trigger.setAttribute("aria-describedby", panel.id);
		return () => {
			if (trigger.getAttribute("aria-describedby") === panel.id) {
				trigger.removeAttribute("aria-describedby");
			}
		};
	});
</script>

<HoverCardPortal {...portalProps}>
	<HoverCardPrimitive.Content
		bind:ref
		data-slot="hover-card-content"
		{align}
		{sideOffset}
		class={cn("nds-hover-card-content", className)}
		{...restProps}
	/>
</HoverCardPortal>
