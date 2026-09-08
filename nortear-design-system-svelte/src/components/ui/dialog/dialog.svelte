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
	 * ─── Conteúdo mais alto que a janela: UMA saída ────────────────────────
	 *
	 * CORPO ROLÁVEL. O painel fica parado e centralizado, o cabeçalho e o rodapé
	 * não saem da tela, e a rolagem acontece dentro do corpo. Nada muda no
	 * componente: quem compõe pendura `.nds-dialog-body-scroll` no elemento do
	 * corpo, com `tabindex="0"`, `role="group"` e nome.
	 *
	 * Houve uma segunda rota — o painel entrava no FLUXO do overlay e a PÁGINA
	 * rolava —, retirada em 2026-09-08: modal que rola junto com a página desfaz
	 * a promessa de interromper, e duas saídas opostas para o mesmo problema
	 * obrigam cada tela a escolher sem critério. Saíram a prop `scroll`, o ramo
	 * que fazia o painel virar filho do overlay e o par de classes que a pintava.
	 */
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { open = $bindable(false), ...restProps }: DialogPrimitive.RootProps = $props();
</script>

<DialogPrimitive.Root bind:open {...restProps} />
