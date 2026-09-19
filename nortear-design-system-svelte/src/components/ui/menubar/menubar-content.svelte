<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import MenubarPortal from "./menubar-portal.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { closeAfterTab } from "@/components/ui/dropdown-menu/tab-leaves-menu";
	import { useMenubarRoot } from "./tab-leaves-menu";

	/**
	 * O `id` do painel é NOSSO, e é carimbado no elemento à mão.
	 *
	 * A busca por letra do bits-ui (`Letras alfabéticas — typeahead em Items`, que
	 * o conteúdo compartilhado promete) só roda quando
	 * `target.closest('[data-menubar-content]').id` é igual ao `contentId` que a
	 * lib guarda. E o `menubar-content` dela consome o `id` recebido para montar o
	 * estado e NÃO o repassa ao `MenuContent` que renderiza o elemento: o painel
	 * nasce sem `id`, a comparação é sempre falsa, e o typeahead nunca dispara.
	 * Medido em 2026-09-03 — digitar `s` com o menu aberto deixava o foco onde
	 * estava, ainda depois de 600ms; as outras quatro stacks levavam para
	 * "Salvar". Passar o `id` como prop, sozinho, não resolve: ele é engolido no
	 * mesmo ponto.
	 *
	 * Como o `contentId` interno passa a ser exatamente o valor que enviamos, o
	 * conserto é carimbar esse mesmo valor no nó. As duas pontas voltam a
	 * concordar sem tocar na lib, e o `aria-controls` do gatilho — que aponta para
	 * esse id — passa a resolver para um elemento que existe.
	 *
	 * Se um bump do bits-ui passar a emitir o `id`, este efeito vira no-op: ele só
	 * escreve quando o atributo está vazio.
	 */
	const uid = $props.id();

	/**
	 * O painel de TOPO de um menu da barra.
	 *
	 * **`alignOffset: -1`, e o número é medido** (2026-09-19, decisão da dona). O
	 * contrato de alinhamento do painel da barra é sobre o TEXTO: o rótulo do
	 * primeiro item tem de nascer na mesma coluna do rótulo do gatilho, porque é
	 * o que a pessoa vê alinhado. Antes daqui o valor era `-4`, com um comentário
	 * dizendo que alinhava o texto — e o comentário era falso. Medido nesta
	 * stack, com a barra longe da borda da janela (o SEGUNDO gatilho):
	 *
	 *   alignOffset   texto do 1º item − texto do gatilho
	 *      0                 +1,08
	 *     -1                 +0,08   ← alinha
	 *     -4  (o de antes)   -2,92
	 *
	 * Os 0,08 de resíduo são constantes e não são do recuo: a `Playground` é
	 * `layout: 'centered'`, a barra pousa em coordenada fracionária, e as três
	 * medidas diferem entre si por 1,00 e 4,00 exatos. Entre os inteiros, `-1` é
	 * o de módulo mínimo — e o único dentro da tolerância de 0,75.
	 *
	 * A conta fecha e explica o 1: a lib ancora a BORDA do painel na borda do
	 * gatilho, e do lado de dentro somam-se borda(1) + `padding` do painel
	 * (`--spacing-1`, 4) + `padding-inline` do item (`--spacing-2`, 8) = 13,
	 * contra o `padding-inline` do gatilho (`--spacing-3`, 12). Sobra exatamente
	 * a borda de 1px — no eixo horizontal os dois `padding` quase se cancelam.
	 *
	 * É a mesma família da D15 (`menubar-sub-content.svelte`, `alignOffset: -5`),
	 * e são dois números diferentes de propósito: lá o eixo é o VERTICAL e a
	 * conta é −(borda + padding do painel); aqui só a borda entra. Mexer num não
	 * é mexer no outro.
	 *
	 * O `align="start"` abaixo NÃO é decorativo, e é o que separa este caso do
	 * sub-painel: no bits-ui o `alignOffset` só tem efeito quando o alinhamento
	 * é declarado. Aqui ele já estava declarado — e é por isso que o `-4` de
	 * antes ERA mesmo aplicado, ao contrário do que acontecia no sub-content
	 * antes da D15.
	 *
	 * O portão é o último `step` da `Playground` em `menubar.stories.ts`, que
	 * mede texto contra texto com tolerância 0,75 — menor que 1, porque `0` e
	 * `-1` ficam a exatamente 1px um do outro.
	 */
	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 8,
		alignOffset = -1,
		align = "start",
		side = "bottom",
		portalProps,
		id = `nds-menubar-content-${uid}`,
		onkeydown,
		...restProps
	}: MenubarPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof MenubarPortal>>;
	} = $props();

	// PATCH: a11y — typeahead morto: o painel da barra nascia sem o `id` que a lib compara (ver PATCHES.md#svelte-menu-content-id)
	$effect(() => {
		if (ref && !ref.id) ref.id = id;
	});

	const root = useMenubarRoot();

	// O `onkeydown` de quem consome segue primeiro; o Tab que a lib deixa aberto
	// fecha depois dela — ver `dropdown-menu/tab-leaves-menu.ts`.
	// PATCH: bugfix — Tab com o gatilho na ponta da página prendia o foco (ver PATCHES.md#svelte-menu-tab-edge)
	function handleKeydown(event: Parameters<NonNullable<typeof onkeydown>>[0]) {
		onkeydown?.(event);
		closeAfterTab(event, root);
	}
</script>

<MenubarPortal {...portalProps}>
	<MenubarPrimitive.Content
		bind:ref
		data-slot="menubar-content"
		{id}
		{align}
		{alignOffset}
		{side}
		{sideOffset}
		class={cn("nds-dropdown-menu-content", className)}
		onkeydown={handleKeydown}
		{...restProps}
	/>
</MenubarPortal>
