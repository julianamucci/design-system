<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { setDrawerCloseContext } from "./close-context.js";
	import { setDrawerDirectionContext } from "./direction-context.js";

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
	 * isso o `DrawerContent` daqui não o escreve. O modo não-modal EXISTE nessa
	 * lib — ela publica `modal` com padrão `true` —, e ele chega ao primitivo por
	 * `restProps`, como nas outras stacks; o padrão do design system é modal, que
	 * é coisa diferente de não haver alternativa.
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
	/**
	 * `shouldScaleBackground` e `activeSnapPoint` NÃO são declarados aqui, e a
	 * ausência é a decisão.
	 *
	 * Os dois são capacidade da lib de gestos, e o design system não os tem: a
	 * stack de referência não escala o fundo da página e não expõe pontos de
	 * parada intermediários — o motor de arraste compartilhado deixou os dois de
	 * fora de propósito, porque ponto de parada é capacidade que só o ponteiro
	 * alcança (WCAG 2.5.7) e a escala do fundo é enfeite que nenhuma stack liga.
	 * Ligar `shouldScaleBackground` por padrão aqui dava ao painel desta stack um
	 * comportamento que ele não tem em nenhuma outra.
	 *
	 * Quem precisar de um dos dois ainda pode passá-lo: `restProps` os carrega
	 * até a lib. O que muda é o PADRÃO, que volta a ser o dela — e o dela é o
	 * mesmo do design system.
	 */
	/**
	 * `direction` é declarada aqui com o default do primitivo porque a folha
	 * compartilhada precisa dele por escrito: é este valor que o painel emite
	 * como `data-direction`, e sem atributo o painel não tem posição nenhuma.
	 * Ver `direction-context.ts`. A prop continua chegando à lib, intacta.
	 */
	let {
		autoFocus = true,
		dismissible = true,
		direction = "bottom",
		open = $bindable(false),
		...restProps
	}: DrawerPrimitive.RootProps = $props();

	/**
	 * A saída explícita da gaveta não dispensável.
	 *
	 * O porquê inteiro — a guarda do primitivo, a armadilha de teclado que ela
	 * criava e por que escrever `open` a contorna — está no docblock de
	 * `close-context.ts`. Aqui só se publica o caminho: com a dispensa LIGADA o
	 * contexto entrega `null` e o `DrawerClose` segue pelo primitivo; com ela
	 * DESLIGADA, o `DrawerClose` chama esta função. Nunca os dois na mesma vez,
	 * então não há pedido em dobro para proteger.
	 */
	function closeExplicitly(): void {
		open = false;
	}

	setDrawerCloseContext({
		get close() {
			return dismissible ? null : closeExplicitly;
		},
	});

	setDrawerDirectionContext({
		get direction() {
			return direction;
		},
	});
</script>

<DrawerPrimitive.Root
	{autoFocus}
	{dismissible}
	{direction}
	bind:open
	{...restProps}
/>
