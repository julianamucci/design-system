<script lang="ts">
	/**
	 * Diálogo modal comum.
	 *
	 * O bloco canônico da decisão de acessibilidade (dez itens, medidos na
	 * fonte das cinco libs) está no cabeçalho do `dialog.ts` do Vanilla; aqui
	 * fica a versão curta mais o mecanismo desta stack.
	 *
	 * Prende o foco, trava a rolagem da página, fecha por Escape E por clique
	 * no véu, e devolve o foco ao gatilho. Mecanismo: o `Content` do bits-ui
	 * monta `FocusScope` com `trapFocus` padrão true, `ScrollLock` com
	 * `preventScroll` padrão true, `EscapeLayer` e `DismissibleLayer`; o
	 * papel e o `aria-modal` saem do próprio estado do Content, e o gatilho
	 * emite `aria-haspopup="dialog"` sozinho.
	 *
	 * O que o separa do AlertDialog: o mesmo estado emite
	 * `role="alertdialog"` quando a variante é `alert-dialog`, e ali o
	 * `interactOutsideBehavior` nasce em `"ignore"` — clique no véu não
	 * fecha, porque a decisão é crítica e exige escolha explícita. Escape fecha
	 * nos dois.
	 *
	 * ─── Conteúdo mais alto que a janela: as DUAS rotas ─────────────────────
	 *
	 * Rota A — CORPO ROLÁVEL. O painel fica parado e centralizado, o cabeçalho
	 * e o rodapé não saem da tela, e a rolagem acontece dentro do corpo. Nada
	 * muda no componente: quem compõe pendura `.nds-dialog-body-scroll` no
	 * elemento do corpo, com `tabindex="0"`, `role="group"` e nome.
	 *
	 * Rota B — OVERLAY ROLANDO. O painel entra no FLUXO do overlay, e quem
	 * rola é o overlay: o cabeçalho sobe junto com o conteúdo e sai da tela.
	 * Serve para conteúdo que se lê de ponta a ponta (um contrato, um artigo),
	 * em que fixar o cabeçalho rouba altura útil. Liga-se com `scroll` no
	 * Content, que põe `.nds-dialog-overlay-scroll` e
	 * `.nds-dialog-content-scroll` — o par que `dialog.css` declara para as
	 * cinco stacks.
	 *
	 * A FORMA da rota B diverge por stack, e isso é divergência de API de
	 * framework: não há fonte de verdade e não se "alinha". Aqui é uma prop
	 * booleana do Content, na mesma família de `showCloseButton`.
	 */
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { open = $bindable(false), ...restProps }: DialogPrimitive.RootProps = $props();
</script>

<DialogPrimitive.Root bind:open {...restProps} />
