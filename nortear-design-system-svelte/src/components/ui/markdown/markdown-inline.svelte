<script lang="ts">
	/**
	 * O conteúdo de frase de um bloco: texto, ênfase, código curto, link e imagem.
	 *
	 * Componente próprio porque a estrutura é RECURSIVA — ênfase dentro de link,
	 * link dentro de ênfase — e a recursão pede um componente que possa se
	 * referenciar pelo próprio nome.
	 *
	 * Nada de `{@html}` aqui: cada nó vira elemento do template e cada texto vira
	 * interpolação. Não há superfície de XSS a sanitizar porque não há caminho
	 * para marcação.
	 */
	import Self from "./markdown-inline.svelte";
	import { isSafeUrl, type MdInline } from "@shared/primitives/markdown-ast";

	let {
		nodes,
		allowedProtocols,
		onLinkClick,
	}: {
		nodes: MdInline[];
		allowedProtocols?: readonly string[];
		onLinkClick?: (url: string) => void;
	} = $props();

	/** Endereço absoluto sai do site — não vaze o referenciador para ele. */
	const isExternal = (url: string) => /^https?:/i.test(url);

	/**
	 * O parser já recusou o que não presta — link de esquema fora da lista nem
	 * chega aqui como link. A pergunta é feita de novo no ponto em que o endereço
	 * encosta no DOM: assim a garantia não depende de quem chamou o parser antes,
	 * e fica onde uma varredura de segurança consegue vê-la.
	 */
	const safeHref = (url: string) => (isSafeUrl(url, allowedProtocols) ? url : undefined);

	function handleLink(event: MouseEvent, url: string) {
		if (!onLinkClick) return;
		// Com ouvinte, quem navega é a aplicação — é o que permite empurrar a rota
		// sem recarregar. O `href` continua ali, então abrir em outra aba e copiar
		// o endereço seguem funcionando.
		event.preventDefault();
		onLinkClick(url);
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- regra do router SvelteKit; o projeto roda Storybook sem router, e o endereço aqui já passou por isSafeUrl (guideline 09) -->
{#each nodes as node, i (i)}{#if node.type === "text"}{node.value}{:else if node.type === "strong"}<strong
			><Self nodes={node.children} {allowedProtocols} {onLinkClick} /></strong
		>{:else if node.type === "emphasis"}<em
			><Self nodes={node.children} {allowedProtocols} {onLinkClick} /></em
		>{:else if node.type === "delete"}<s
			><Self nodes={node.children} {allowedProtocols} {onLinkClick} /></s
		>{:else if node.type === "inlineCode"}<!--
			Duas classes: o desenho é o de `.nds-code-inline`, e a segunda só desfaz
			o `nowrap` dela — trecho longo de resposta precisa quebrar.
		--><code class="nds-code-inline nds-markdown-inline-code">{node.value}</code
		>{:else if node.type === "link"}<!--
			`title` fica de fora de propósito: ele só aparece ao pousar o ponteiro,
			então guardar informação ali é escondê-la de quem navega por teclado ou
			ouve a página.
		--><a
			class="nds-markdown-link"
			href={safeHref(node.url)}
			rel={isExternal(node.url) ? "noreferrer" : undefined}
			onclick={(event) => handleLink(event, node.url)}
			><Self nodes={node.children} {allowedProtocols} {onLinkClick} /></a
		>{:else if node.type === "image"}<!--
			Descrição vazia deixa a imagem decorativa, e é o certo quando não há
			descrição: ler o endereço no lugar dela seria ruído. Escrever a descrição
			é de quem escreveu o texto.
		--><img class="nds-markdown-image" src={safeHref(node.url)} alt={node.alt} loading="lazy" />{:else if node.type === "break"}<br
		/>{/if}{/each}
<!-- eslint-enable svelte/no-navigation-without-resolve -->
