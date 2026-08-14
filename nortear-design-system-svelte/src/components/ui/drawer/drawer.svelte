<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";

	/**
	 * `autoFocus` nasce `false` no primitivo desta stack, e o efeito é
	 * silencioso: ao abrir, o `onOpenAutoFocus` do painel chama
	 * `preventDefault()` e o foco FICA no gatilho, fora do painel. O foco
	 * continua preso (Tab não escapa), mas quem navega por teclado precisa de um
	 * Tab só para entrar no diálogo, e o leitor de tela não anuncia o painel que
	 * acabou de abrir.
	 *
	 * As outras stacks levam o foco para dentro na abertura, e é isso que o
	 * conteúdo compartilhado documenta (`functional.item3`,
	 * `accessibility.item4`) e o que a WCAG 2.4.3 espera de um modal. O default
	 * do design system é `true`; quem precisar do comportamento do primitivo
	 * ainda pode passar `autoFocus={false}`.
	 */
	let {
		shouldScaleBackground = true,
		autoFocus = true,
		open = $bindable(false),
		activeSnapPoint = $bindable(null),
		...restProps
	}: DrawerPrimitive.RootProps = $props();
</script>

<DrawerPrimitive.Root
	{shouldScaleBackground}
	{autoFocus}
	bind:open
	bind:activeSnapPoint
	{...restProps}
/>
