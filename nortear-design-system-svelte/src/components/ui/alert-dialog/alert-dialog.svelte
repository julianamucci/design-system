<script lang="ts">
	/**
	 * O modal que NÃO pode ser dispensado por engano.
	 *
	 * O bloco canônico da divergência com o Dialog está no cabeçalho do
	 * `alert-dialog.ts` do Vanilla; aqui fica a versão curta mais o mecanismo
	 * desta stack.
	 *
	 *   · PAPEL: o estado do Content emite `role="alertdialog"` quando a
	 *     variante é `alert-dialog`, e `role="dialog"` no Dialog comum.
	 *   · CLIQUE NO VÉU NÃO FECHA: o `Content` do alert-dialog nasce com
	 *     `interactOutsideBehavior = "ignore"` — o padrão da peça, não uma
	 *     escolha de quem consome.
	 *   · ESCAPE FECHA, e equivale a cancelar: o `EscapeLayer` é o mesmo do
	 *     Dialog.
	 *   · O foco entra no CANCEL — e aqui isso é do design system, não da lib:
	 *     ver o `onOpenAutoFocus` de `alert-dialog-content.svelte`, com a
	 *     medição que o motivou.
	 *
	 * Corolário: a saída visível é o par Cancel + Action do rodapé, e por isso
	 * o rodapé não é opcional aqui — este componente não tem X no canto.
	 */
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	let { open = $bindable(false), ...restProps }: AlertDialogPrimitive.RootProps = $props();
</script>

<AlertDialogPrimitive.Root bind:open {...restProps} />
