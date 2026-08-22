<script lang="ts">
	/**
	 * Alterna em vez de só remover: o painel Interactions reexecuta a play no
	 * MESMO DOM, e um botão que só sabe remover deixa a segunda rodada sem bloco
	 * nenhum para copiar. O rótulo acompanha o estado para que a play consiga
	 * estabelecer a própria precondição.
	 */
	import CodeBlock from "./code-block.svelte";
	import { Button } from "@/components/ui/button";

	let { code }: { code: string } = $props();
	let visible = $state(true);
</script>

<div class="nds-stack" data-spacing="md">
	{#if visible}
		<CodeBlock {code} language="ts" />
	{/if}
	<Button variant="outline" onclick={() => (visible = !visible)}>
		{visible ? "Remover o bloco" : "Restaurar o bloco"}
	</Button>
</div>
