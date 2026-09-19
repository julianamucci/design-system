<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import DropdownMenuPortal from "./dropdown-menu-portal.svelte";
	import { closeAfterTab, useDropdownMenuRoot } from "./tab-leaves-menu";
	import { keepRootOpenOnSubEscape, useMenuSub } from "./sub-escape";

	let {
		ref = $bindable(null),
		class: className,
		// D15 — o que se fixa aqui é o RESULTADO: o topo do PRIMEIRO ITEM do
		// submenu alinha com o topo do sub-gatilho que o abriu, e o subpainel
		// encosta no painel pai. Os três números abaixo são o que essa medida
		// pede NESTA lib, e a lição é que dois deles não se derivam de token
		// nenhum — se derivam do que o bits-ui deixou de fazer.
		//
		// **`align` é o número que faltava, e sem ele os outros dois não têm
		// efeito.** O `menu-sub-content.svelte` do bits fixa `side = "right"` e
		// NÃO fixa `align`, então o subpainel cai no `align = "center"` do
		// `floating-layer-content.svelte` — o Radix e a reka fixam `"start"` no
		// sub-content, o bits não. Duas consequências medidas em 2026-09-19,
		// bits-ui 2.19.0:
		//
		//   1. o subpainel nasce CENTRADO no sub-gatilho, então o desvio do
		//      primeiro item depende da ALTURA do painel: −14px com dois itens
		//      (DropdownMenu, ContextMenu) e −29px com os cinco do Menubar;
		//   2. o `alignOffset` vira INERTE. O `offset` do floating-ui só aplica
		//      `alignmentAxis` quando a colocação TEM alinhamento (`right-start`),
		//      e `right` puro não tem — medido: `0` e `−4` dão exatamente o mesmo
		//      resultado do padrão da lib, dentro do ruído de subpixel.
		//
		// Por isso o `alignOffset: -4` declarado em 2026-09-18 não mudou nada:
		// ele não piorou o desenho, ele nunca chegou a existir.
		//
		// **`alignOffset: -5`, e não o `-4` da primeira redação da D15.** Com
		// `align="start"` a lib encosta o TOPO DA CAIXA no topo do sub-gatilho, e
		// o primeiro item desce o `padding: var(--spacing-1)` MAIS o `border: 1px`
		// do painel (`nds/dropdown-menu.css`). O `-4` contava só o padding e
		// esquecia a borda. Medido nos três membros: `-4` deixa o item +1px
		// abaixo, `-5` deixa 0,00.
		//
		// E `-5` é o melhor dos dois nas três densidades: o padding é 4px no
		// default, 3,2px no condensado e 5px no confortável, então a soma com a
		// borda vai de 5 a 6 — com `-5` o desvio fica em {0; −0,8; +1,0} e com
		// `-4` em {+1; +0,2; +2}. A asserção mede na densidade default, onde `-5`
		// sai 0,00 e a tolerância de 0,75 separa os dois candidatos; nas outras
		// duas o número certo seria outro, e a saída honesta seria ler o padding
		// computado em vez de um inteiro — não é o caso hoje, e fica registrado.
		//
		// `sideOffset: 0` encosta o subpainel no sub-gatilho, e ele tem dentes:
		// medido, o vão lateral acompanha o número (0 → 0,00; 8 → 8,00). No bits
		// ele NÃO é herdado do painel pai — o `SubContent` cai no `sideOffset = 0`
		// do `floating-layer-content.svelte`, então o `0` daqui coincide com o
		// padrão da lib. É declarado para que o número seja nosso, e não dela.
		sideOffset = 0,
		align = "start",
		alignOffset = -5,
		onkeydown,
		...restProps
	}: DropdownMenuPrimitive.SubContentProps = $props();

	const root = useDropdownMenuRoot();
	const sub = useMenuSub();

	// Escape aqui dentro fecha só este submenu e devolve o foco ao gatilho dele;
	// o menu de cima segue aberto. Ouvinte de captura no nó que a lib entrega por
	// `ref`, antes da camada de Escape do bits — ver `sub-escape.ts`.
	$effect(() => {
		if (!ref || !sub) return;
		return keepRootOpenOnSubEscape(ref, sub);
	});

	// O portal tira este painel da árvore DOM do raiz: o Tab apertado aqui não
	// passa pelo ouvinte de lá. O mesmo fechamento — ver `tab-leaves-menu.ts`.
	// PATCH: bugfix — Tab com o gatilho na ponta da página prendia o foco (ver PATCHES.md#svelte-menu-tab-edge)
	function handleKeydown(event: Parameters<NonNullable<typeof onkeydown>>[0]) {
		onkeydown?.(event);
		closeAfterTab(event, root);
	}
</script>

<!--
	Duas correções moram aqui — as mesmas que o submenu da barra de menus e o do
	menu de contexto já tinham recebido, e que este ficou sem.

	1. **A classe do painel.** O `class` saía como `cn("", className)` — o submenu
	   renderizava sem fundo, sem borda e sem sombra. As outras stacks reusam o
	   painel do menu raiz.

	2. **O portal.** Sem ele o painel do submenu nasce DENTRO do painel do menu
	   raiz, que tem `overflow-y: auto` — o raiz passava a rolar e o axe acusava
	   `scrollable-region-focusable` na story `WithSubmenu`, uma região rolável
	   cujos itens têm `tabindex="-1"`. Medido em 2026-09-10: reprovava com a
	   folha antiga também, então não era efeito da saída sem animação (D5).
-->
<DropdownMenuPortal>
	<DropdownMenuPrimitive.SubContent
		bind:ref
		data-slot="dropdown-menu-sub-content"
		{sideOffset}
		{align}
		{alignOffset}
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</DropdownMenuPortal>
