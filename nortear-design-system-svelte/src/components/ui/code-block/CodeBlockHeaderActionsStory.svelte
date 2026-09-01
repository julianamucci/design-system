<script lang="ts">
	/**
	 * A fila de controles do cabeçalho.
	 *
	 * Existe como componente porque o encaixe `actions` é um snippet, e snippet
	 * não se declara dentro de um `.stories.ts` — a mesma razão de
	 * `CodeBlockRemovivelStory`. O controle entra ANTES do copiar sem que este
	 * arquivo precise ordenar nada: quem posiciona é o componente, e é isso que
	 * a play verifica.
	 */
	import CodeBlock from "./code-block.svelte";
	import { Button } from "@/components/ui/button";

	let { code, runLabel }: { code: string; runLabel: string } = $props();
</script>

<CodeBlock {code} language="ts" title="lista.ts">
	{#snippet actions()}
		<Button variant="ghost" size="sm">{runLabel}</Button>
	{/snippet}
</CodeBlock>
