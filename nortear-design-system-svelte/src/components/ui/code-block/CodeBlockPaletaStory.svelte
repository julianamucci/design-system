<script lang="ts">
	/**
	 * Paleta inteira em uma tela: os trechos do colhedor compartilhado — que
	 * juntos acendem os ONZE tokens — e uma linha em destaque, que é o SEGUNDO
	 * fundo possível.
	 *
	 * Os trechos vêm do colhedor e não da docs page: os itens de lá são
	 * idiomáticos por stack, e a medição das cinco só é comparável sobre dados
	 * idênticos.
	 */
	import CodeBlock from "./code-block.svelte";
	import { PALETTE_TRECHOS } from "@shared/testing/code-block-probe";

	let { code }: { code: string } = $props();
</script>

<div class="nds-stack" data-spacing="md">
	{#each PALETTE_TRECHOS as trecho (trecho.language)}
		<CodeBlock code={trecho.code} language={trecho.language} showLineNumbers={false} />
	{/each}
	<CodeBlock {code} language="ts" highlightLines={[2]} />
</div>
