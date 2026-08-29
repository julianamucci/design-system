<script lang="ts">
	/**
	 * Um bloco do documento. Recursivo: citação e item de lista contêm blocos.
	 *
	 * Bloco de código é delegado ao CodeBlock e tabela à Table — os dois já
	 * resolvidos pelo design system, com destaque de sintaxe pelos tokens do tema
	 * e com a região rolável alcançável por teclado.
	 */
	import Self from "./markdown-block.svelte";
	import MarkdownInline from "./markdown-inline.svelte";
	import { cn } from "@/lib/utils.js";
	import { CodeBlock } from "@/components/ui/code-block";
	import * as Table from "@/components/ui/table";
	import type { MdInline, MdListItem, MdNode } from "@shared/primitives/markdown-ast";

	let {
		node,
		allowedProtocols,
		onLinkClick,
	}: {
		node: MdNode;
		allowedProtocols?: readonly string[];
		onLinkClick?: (url: string) => void;
	} = $props();

	/** A escada de tipos tem quatro degraus; o documento aceita seis níveis. */
	const headingClass = (depth: number) => `nds-text-h${Math.min(depth, 4)}`;

	/**
	 * Item de lista quase sempre tem um parágrafo só. Desembrulhá-lo evita uma
	 * caixa a mais entre o marcador e o texto, e é o que faz a caixa de tarefa
	 * ficar na mesma linha do conteúdo.
	 */
	function inlineOnly(item: MdListItem): MdInline[] | null {
		const blocks = item.children;
		if (blocks.length === 1 && blocks[0].type === "paragraph") return blocks[0].children;
		return null;
	}

	/** O texto simples de um bloco, para quando só um rótulo cabe. */
	function plainText(nodes: MdNode[]): string {
		const inline = (list: MdInline[]): string =>
			list
				.map((n) =>
					n.type === "text" || n.type === "inlineCode"
						? n.value
						: n.type === "image"
							? n.alt
							: n.type === "break"
								? " "
								: inline(n.children),
				)
				.join("");

		return nodes
			.map((n) =>
				n.type === "paragraph" || n.type === "heading"
					? inline(n.children)
					: n.type === "code" || n.type === "raw"
						? n.value
						: n.type === "list"
							? n.items.map((i) => plainText(i.children)).join(" ")
							: n.type === "blockquote"
								? plainText(n.children)
								: "",
			)
			.join(" ")
			.trim();
	}
</script>

{#if node.type === "paragraph"}
	<p class="nds-markdown-paragraph">
		<MarkdownInline nodes={node.children} {allowedProtocols} {onLinkClick} />
	</p>
{:else if node.type === "heading"}
	<svelte:element
		this={`h${node.depth}`}
		class={cn(headingClass(node.depth), "nds-markdown-heading")}
	>
		<MarkdownInline nodes={node.children} {allowedProtocols} {onLinkClick} />
	</svelte:element>
{:else if node.type === "code"}
	<CodeBlock code={node.value} language={node.lang ?? undefined} />
{:else if node.type === "blockquote"}
	<blockquote class="nds-markdown-quote">
		{#each node.children as child, i (i)}
			<Self node={child} {allowedProtocols} {onLinkClick} />
		{/each}
	</blockquote>
{:else if node.type === "list"}
	<svelte:element
		this={node.ordered ? "ol" : "ul"}
		class="nds-markdown-list"
		start={node.ordered && node.start !== null && node.start !== 1 ? node.start : undefined}
	>
		{#each node.items as item, i (i)}
			<li class={cn("nds-markdown-item", item.checked !== null && "nds-markdown-task")}>
				<!--
					Item de tarefa: a caixa é um `checkbox` desabilitado de verdade, e não
					um glifo — ela anuncia "marcada" ou "não marcada", que é a informação
					que o texto carregava.

					E toda caixa precisa de NOME. Sem ele o axe reprova por controle de
					formulário sem rótulo, e com razão: a caixa seria anunciada sozinha,
					sem dizer o que está marcado. O nome é o próprio texto do item, e por
					isso o texto vai DENTRO de um `<label>` — assim ele é o nome e o
					conteúdo ao mesmo tempo, sem ser lido duas vezes.
				-->
				{#if item.checked !== null && inlineOnly(item)}
					<label class="nds-markdown-task-label">
						<input type="checkbox" checked={item.checked} disabled />
						<MarkdownInline nodes={inlineOnly(item)!} {allowedProtocols} {onLinkClick} />
					</label>
				{:else}
					<!--
						Item com mais de um bloco: `<label>` só aceita conteúdo de frase,
						então uma lista aninhada dentro dele seria markup inválido. Aqui o
						nome vem por atributo, com o texto simples do item.
					-->
					{#if item.checked !== null}
						<input
							type="checkbox"
							checked={item.checked}
							disabled
							aria-label={plainText(item.children)}
						/>
					{/if}
					{#if inlineOnly(item)}
						<MarkdownInline nodes={inlineOnly(item)!} {allowedProtocols} {onLinkClick} />
					{:else}
						{#each item.children as child, c (c)}
							<Self node={child} {allowedProtocols} {onLinkClick} />
						{/each}
					{/if}
				{/if}
			</li>
		{/each}
	</svelte:element>
{:else if node.type === "thematicBreak"}
	<hr class="nds-markdown-rule" />
{:else if node.type === "table"}
	<Table.Root class="nds-markdown-table">
		{#if node.rows.some((r) => r.header)}
			<Table.Header>
				{#each node.rows.filter((r) => r.header) as row, r (r)}
					<Table.Row>
						{#each row.cells as cell, c (c)}
							<Table.Head scope="col" data-align={node.align[c] ?? undefined}>
								<MarkdownInline nodes={cell} {allowedProtocols} {onLinkClick} />
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
		{/if}
		<Table.Body>
			{#each node.rows.filter((r) => !r.header) as row, r (r)}
				<Table.Row>
					{#each row.cells as cell, c (c)}
						<td data-slot="table-cell" data-align={node.align[c] ?? undefined}>
							<MarkdownInline nodes={cell} {allowedProtocols} {onLinkClick} />
						</td>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{:else if node.type === "raw"}
	<!--
		O que a lista branca recusou, o que o parser não estruturou e a construção
		ainda aberta durante o streaming. Sai como TEXTO: bloco que desaparece deixa
		quem lê sem saber que havia algo ali.

		A interpolação fica COLADA nas tags: este parágrafo desenha com
		`white-space: pre-wrap`, então recuo do template apareceria na tela.
	-->
	<p class="nds-markdown-raw">{node.value}</p>
{/if}
