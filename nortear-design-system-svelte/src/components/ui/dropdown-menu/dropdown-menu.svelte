<script lang="ts">
	/**
	 * CONTRATO DE ACESSIBILIDADE DO MENU — versão curta; o bloco canônico, com a
	 * medição das cinco stacks, está no cabeçalho do `dropdown-menu` do Vanilla.
	 *
	 * Cumprido igual em todas: `aria-haspopup="menu"` + `aria-expanded` no
	 * gatilho; `role="menu"` no painel e `menuitem` / `menuitemcheckbox` /
	 * `menuitemradio` nos itens; setas, `Home`/`End` e typeahead; `Escape` fecha
	 * e devolve o foco ao gatilho; nenhuma região viva.
	 *
	 * O item DESABILITADO: a seta POUSA nele. Decisão do design system tomada em
	 * 2026-09-02 e válida nas cinco stacks — a WAI-ARIA APG pede que o item
	 * desabilitado siga alcançável pela seta para ser ANUNCIADO, porque tirá-lo
	 * da roda esconde de quem navega de ouvido que a opção existe e está
	 * indisponível. O que ele não faz é ATIVAR.
	 *
	 * MECANISMO DESTA STACK: a lib pulava o item, e nenhuma prop invertia isso.
	 * Vale reparar em ONDE, porque não é onde parece: a SETA não passa por
	 * `#getCandidateNodes` de `bits/menu/menu.svelte.js` — quem a atende é o
	 * `RovingFocusGroup` de `internal/roving-focus-group`, cujo seletor vem de
	 * `candidateAttr` e embute `:not([data-disabled])`. Como esse grupo é
	 * compartilhado com abas, barra de ferramentas e escolha única, o patch
	 * (`patches/bits-ui+2.19.0.patch`) não mexe nele: informa o
	 * `candidateSelector` do menu, que tem precedência, e tira o filtro de
	 * `#getCandidateNodes`, que serve typeahead e `Home`/`End`. Como o nome do
	 * arquivo carrega a versão, um bump o desliga em silêncio: quem reprova
	 * nesse caso é `src/lib/patches-aplicados.test.ts`. A story `ItemDisabled`
	 * aperta a seta e verifica onde o foco pousa. Medido na fonte em 2026-09-02.
	 */
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	let { open = $bindable(false), ...restProps }: DropdownMenuPrimitive.RootProps = $props();
</script>

<DropdownMenuPrimitive.Root bind:open {...restProps} />
