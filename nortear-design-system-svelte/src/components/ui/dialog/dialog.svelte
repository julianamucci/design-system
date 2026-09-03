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
	 */
	import { Dialog as DialogPrimitive } from "bits-ui";

	let { open = $bindable(false), ...restProps }: DialogPrimitive.RootProps = $props();
</script>

<DialogPrimitive.Root bind:open {...restProps} />
