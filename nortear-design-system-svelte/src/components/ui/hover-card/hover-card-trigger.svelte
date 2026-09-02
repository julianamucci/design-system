<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from "bits-ui";
	import { createAttachmentKey } from "svelte/attachments";
	import { usarContextoHoverCard } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		child,
		children,
		...restProps
	}: HoverCardPrimitive.TriggerProps = $props();

	const contexto = usarContextoHoverCard();

	// Registro do gatilho por ANEXO, e não por `bind:ref`: o anexo roda no
	// próprio elemento, com desmontagem, e não depende da ordem em que o
	// primitivo devolve a referência — que muda de valor a cada recomputo dos
	// props (o `data-state` do gatilho muda a cada abertura).
	//
	// É deste elemento que o painel tira o nome acessível.
	const REGISTRAR = createAttachmentKey();

	function anexo(el: Element) {
		if (!contexto) return;
		contexto.trigger = el as HTMLElement;
		return () => {
			if (contexto.trigger === el) contexto.trigger = null;
		};
	}

	// O bits-ui descreve o gatilho como um botão de menu: `role="button"`,
	// `aria-haspopup="dialog"` e `aria-expanded`. Nenhuma das outras quatro
	// stacks emite isso, e o conteúdo compartilhado documenta o contrário — o
	// cartão é conteúdo SUPLEMENTAR, não um menu que o leitor comanda, e quem
	// tem estado é o painel, não o link.
	//
	// Não dá para corrigir por props: o `mergeProps` do primitivo aplica os
	// dele DEPOIS dos de quem consome, então o valor de fora perde. A saída é
	// interceptar o snippet `child`, que é onde os props passam antes de chegar
	// ao elemento — e é também onde `data-slot` entra, para sobreviver ao
	// mesmo merge.
	function menuNoState(props: Record<string, unknown>): Record<string, unknown> {
		const limpos: Record<string, unknown> = {
			...props,
			"data-slot": "hover-card-trigger",
			[REGISTRAR]: anexo,
		};
		delete limpos.role;
		delete limpos["aria-haspopup"];
		delete limpos["aria-expanded"];
		// `aria-controls` sai pelo mesmo motivo dos três acima, e é o quarto que
		// o bits-ui emite sozinho: nenhuma das outras quatro stacks o tem, e
		// depois que o gatilho passou a apontar o conteúdo por
		// `aria-describedby` ele ficou redundante — a relação já está dita, e
		// dita pelo atributo que os leitores de tela de fato anunciam.
		delete limpos["aria-controls"];
		return limpos;
	}
</script>

<HoverCardPrimitive.Trigger bind:ref {...restProps}>
	{#snippet child({ props })}
		{@const limpos = menuNoState(props as Record<string, unknown>)}
		{#if child}
			{@render child({ props: limpos })}
		{:else}
			<a {...limpos}>{@render children?.()}</a>
		{/if}
	{/snippet}
</HoverCardPrimitive.Trigger>
