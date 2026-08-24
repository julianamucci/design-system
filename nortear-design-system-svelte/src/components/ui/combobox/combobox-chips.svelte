<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '@/lib/utils.js';

	// A caixa que CRESCE: os chips e o campo de texto moram aqui dentro, e o
	// `<ComboboxInput>` é filho desta peça, não irmão dela. Limpar e gatilho
	// ficam de fora, irmãos desta caixa — é o que os mantém na primeira linha
	// quando os chips passam a ocupar mais de uma.
	//
	// Era `display: contents` na folha, e essa era a causa do defeito: sem caixa
	// própria, chip, texto, limpar e gatilho eram todos irmãos no mesmo flex que
	// quebrava, e quem sobrava caía para a linha de baixo.
	//
	// Quebrar em linhas ou rolar na horizontal é decisão do `chipsLayout` da
	// raiz, que a folha lê em `data-chips` no wrapper.

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();
</script>

<div class={cn('nds-combobox-chips', className)} data-slot="combobox-chips" {...restProps}>
	{@render children?.()}
</div>
