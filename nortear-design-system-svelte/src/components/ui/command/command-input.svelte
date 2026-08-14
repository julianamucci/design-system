<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import SearchIcon from '@lucide/svelte/icons/search';

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		...restProps
	}: CommandPrimitive.InputProps = $props();
</script>

<!--
	Invólucro + lupa + campo, nó por nó como o Vanilla (referência cross-stack).

	Antes o campo era montado por dentro do `InputGroup` e o invólucro saía com
	`class=""`. Três defeitos de uma vez:

	  · `.nds-command-input-wrapper` — que traz o padding lateral e a borda de
	    baixo que separa a busca da lista — nunca chegava a ser aplicado;
	  · `.nds-input-group` desenha moldura COMPLETA (borda em volta + raio), e o
	    invólucro do command já é uma borda de baixo: eram duas bordas
	    concorrentes, e a de fora não é o desenho que o design system define;
	  · a lupa ficava dentro de um `input-group-addon`, fora do alcance do
	    seletor `.nds-command-input-wrapper > svg`, e por isso nascia com os
	    24px do lucide em vez dos 16px do sistema, sem a opacidade de 50%.
-->
<div data-slot="command-input-wrapper" class="nds-command-input-wrapper">
	<!-- Decorativa: o nome acessível do campo vem do placeholder, e repetir
	     "buscar" no leitor de tela seria eco. -->
	<SearchIcon aria-hidden="true" />
	<CommandPrimitive.Input
		bind:ref
		bind:value
		data-slot="command-input"
		class={cn("nds-command-input", className)}
		{...restProps}
	/>
</div>
