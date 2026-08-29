<script lang="ts">
	/**
	 * Documento em Markdown desenhado a partir de uma ÁRVORE, nunca de HTML.
	 *
	 * O texto vem de fora do código — numa interface conversacional, de um modelo
	 * — e aqui não existe `{@html}`: cada nó vira elemento do template e cada
	 * texto vira interpolação. Não há superfície de XSS a sanitizar porque não há
	 * caminho para marcação.
	 *
	 * A árvore e a decisão de streaming vêm de `@shared/primitives/markdown-ast`,
	 * que as cinco stacks compartilham. O que é desta stack é só o desenho.
	 * Estrutura e cores em `nds/markdown.css`.
	 */
	import type { HTMLAttributes } from "svelte/elements";
	import MarkdownBlock from "./markdown-block.svelte";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { parseForRender, type MdBlockKind } from "@shared/primitives/markdown-ast";

	let {
		ref = $bindable(null),
		content,
		streaming = false,
		allow,
		allowedProtocols,
		onLinkClick,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** O texto em Markdown. Vem de fora do código e é tratado como não confiável. */
		content: string;
		/** Ligue enquanto o texto ainda chega. */
		streaming?: boolean;
		/** Quais blocos podem ser estruturados. O que fica de fora vira texto. */
		allow?: readonly MdBlockKind[];
		/** Esquemas de endereço aceitos em link e imagem. */
		allowedProtocols?: readonly string[];
		/** Chamado no clique de um link, com o endereço já validado. */
		onLinkClick?: (url: string) => void;
	} = $props();

	const tree = $derived(parseForRender(content, { streaming, allow, allowedProtocols }));
</script>

<!--
	`aria-busy` enquanto gera, para quem ouve saber que o conteúdo ainda muda.

	E NÃO é região viva: anunciar a cada trecho tornaria a leitura impossível. A
	resposta é anunciada uma vez, inteira, quando termina — que é o que o leitor
	de tela faz sozinho ao encontrar o documento parado.
-->
<div
	bind:this={ref}
	data-slot="markdown"
	class={cn("nds-markdown", className)}
	data-streaming={String(streaming)}
	data-allow={allow ? allow.join(" ") : undefined}
	aria-busy={streaming ? "true" : undefined}
	{...restProps}
>
	{#each tree.children as node, i (i)}
		<MarkdownBlock {node} {allowedProtocols} {onLinkClick} />
	{/each}
</div>
