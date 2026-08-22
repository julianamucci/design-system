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
		// Os dois rótulos saem do `restProps` DE PROPÓSITO: espalhados junto com
		// o resto, eles vêm depois do valor calculado e o sobrescrevem — e como
		// quem compõe escreve `aria-label={rotulo || undefined}`, o `undefined`
		// apagava o nome de todo painel sem rótulo explícito. O axe reprovava em
		// `aria-dialog-name` e a causa não aparecia em lugar nenhum do markup.
		"aria-label": rotulo,
		"aria-labelledby": labelledBy,
		...restProps
	}: HoverCardPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof HoverCardPortal>>;
	} = $props();

	// Mesmo critério do Vanilla (referência cross-stack): `role="dialog"` exige
	// nome acessível. Ele sai do rótulo que quem compõe declara e, sem ele, do
	// texto do gatilho — a mesma regra das outras quatro stacks.
	//
	// O gatilho vem do CONTEXTO, não de uma busca no documento: com vários
	// cartões na mesma tela (a story Sides), o primeiro
	// `[data-link-preview-trigger]` daria o mesmo nome a todos os painéis.
	//
	// Ligado por atributo, e não escrito por `$effect`: o painel monta depois do
	// gatilho e o `$derived` acompanha sozinho quando a referência chega — um
	// efeito que roda uma vez deixaria o painel sem nome, e é isso que o axe
	// reprova em `aria-dialog-name`.
	const contexto = usarContextoHoverCard();

	const nameAutomatico = $derived(
		rotulo || labelledBy
			? rotulo
			: contexto?.gatilho?.textContent?.trim() || "Prévia",
	);
</script>

<HoverCardPortal {...portalProps}>
	<!-- role="dialog": o bits-ui não emite role no conteúdo. O Vanilla já
	     define, e é o que torna a prévia anunciável pelo leitor de tela. Sem
	     `aria-modal`: a ausência já significa não-modal. -->
	<HoverCardPrimitive.Content
		bind:ref
		data-slot="hover-card-content"
		role="dialog"
		{align}
		{sideOffset}
		class={cn("nds-hover-card-content", className)}
		{...restProps}
		aria-label={nameAutomatico}
		aria-labelledby={labelledBy}
	/>
</HoverCardPortal>
