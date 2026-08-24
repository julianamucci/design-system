<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';

	// A caixa de posicionamento em si é emitida pelo Popup: a lib entrega os dois
	// nós — o que posiciona e o que pinta — num primitivo só, e é lá que os dois
	// saem com a classe e o `data-slot` do contrato. Aqui fica o portal, que tira
	// o painel de dentro do fluxo e o desenha acima do resto da página.

	let { children, ...restProps }: { children?: Snippet } & Record<string, unknown> = $props();
</script>

<ComboboxPrimitive.Portal {...restProps}>
	{@render children?.()}
</ComboboxPrimitive.Portal>
