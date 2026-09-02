<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";

	/**
	 * ─── Decisão de acessibilidade (bloco canônico no drawer da stack vanilla) ─
	 *
	 * Foco preso enquanto o painel existe, `role="dialog"` com nome vindo do
	 * título, `aria-modal`, Escape e clique no véu fechando, foco de volta ao
	 * gatilho, rolagem da página travada, corpo rolável com `tabindex="0"` e
	 * `role="group"` só quando nomeado, e NENHUMA região viva.
	 *
	 * O mecanismo desta stack: o primitivo compõe o Dialog da lib de baixo, que
	 * prende o foco, trava a rolagem e escreve `aria-modal="true"` sozinho — por
	 * isso o `DrawerContent` daqui não o escreve. Não existe modo não-modal
	 * nessa lib: o painel é sempre modal.
	 *
	 * Diverge do Sheet em quatro pontos deliberados: aqui existe gesto de
	 * arrastar (extra de ponteiro, nunca o único caminho — WCAG 2.5.7), existe
	 * alça decorativa, NÃO existe botão de fechar próprio (a saída visível é a
	 * do rodapé), e a largura sai de `--drawer-width`/`--drawer-max-width` em
	 * vez dos tokens do Sheet.
	 */

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
