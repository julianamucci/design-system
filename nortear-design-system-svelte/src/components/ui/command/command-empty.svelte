<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { useCommandEmptyContext } from "./command-context.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> = $props();

	const empty = useCommandEmptyContext();
</script>

<!--
	"Nenhum resultado" — e o ponto não é desenhar a frase, é ANUNCIÁ-LA.

	É a única região viva do componente, e o único ponto da paleta em que a
	mudança acontece FORA do foco e sem outro canal: o foco fica no campo de
	busca, a lista esvazia, e não sobra item nenhum para onde navegar.

	─── A medição do axe, que continua valendo ────────────────────────────────

	Feita no axe-core desta versão (`ariaRequiredChildrenEvaluate`), e é ela que
	explica por que a região viva ficou FORA da lista, e não por que ela vira
	`role="option"`:

	  · `role="status"` DENTRO de `role="listbox"` reprova como filho não
	    permitido — só `option` e `group` são;
	  · um `<div>` sem papel ali é pior: o avaliador desce até o nó de texto,
	    `isContent` devolve verdadeiro, e a regra reprova;
	  · um listbox vazio, sem filho nenhum, cai em `reviewEmpty` e sai como
	    "incomplete", que não reprova.

	Ou seja: dentro da lista não havia lugar para uma região viva. O que essa
	leitura tinha de errado era a PREMISSA — a de que a mensagem precisava
	morar dentro da lista. Antes de 2026-09-02 ela morava, saía como
	`role="option"` desabilitado, e por isso era desenhada sem nunca ser
	anunciada, enquanto `accessibility.screenReader.onFilter` prometia a região
	viva nas cinco docs pages.

	─── O que mudou em 2026-09-02 ────────────────────────────────────────────

	A mensagem saiu do `Command.List` e virou um `<div role="status">` próprio —
	a forma do Vanilla, que é a referência. Uma mensagem só: a que se vê é a que
	anuncia, e é por isso que ela não fica escondida.

	Duas condições, e as duas são o motivo de este componente não embrulhar mais
	o `Command.Empty` da lib:

	  · o elemento fica MONTADO o tempo todo. Região viva criada no instante em
	    que a busca esvazia não anuncia nada — o leitor de tela lê a mudança de
	    conteúdo DENTRO de uma região que já existia, e o primitivo monta e
	    desmonta o nó;
	  · o elemento fica FORA da lista, pela medição acima.

	O que entra e sai é o CONTEÚDO e a classe. `.nds-command-empty` traz 24px de
	`padding-block`, e mantê-la com a lista cheia deixaria um vão embaixo dos
	resultados. Sem a classe e sem conteúdo o nó continua no DOM e na árvore de
	acessibilidade, com altura zero — o oposto de `display: none`, e é o que
	preserva o anúncio da PRÓXIMA busca sem resultado.

	A condição é a mesma que a lib usava (`filtered.count === 0`), lida do mesmo
	estado: o que a paleta DESENHA não mudou. Mudou onde a frase mora e o fato de
	ela passar a ser anunciada. O estado chega pelo contexto que
	`command.svelte` publica a partir de `onStateChange`.
-->
<div
	bind:this={ref}
	data-slot="command-empty"
	role="status"
	aria-live="polite"
	aria-atomic="true"
	data-empty={empty?.empty ? "" : undefined}
	class={cn(empty?.empty && "nds-command-empty", className)}
	{...restProps}
>
	{#if empty?.empty}{@render children?.()}{/if}
</div>
