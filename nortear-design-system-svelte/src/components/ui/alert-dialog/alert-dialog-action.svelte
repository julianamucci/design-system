<script lang="ts">
	import {
		AlertDialog as AlertDialogPrimitive,
		Dialog as DialogPrimitive,
	} from "bits-ui";
	import {
		buttonVariants,
		type ButtonVariant,
		type ButtonSize,
	} from "@/components/ui/button/index.js";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		size = "default",
		...restProps
	}: AlertDialogPrimitive.ActionProps & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	} = $props();
</script>

<!--
	`AlertDialogPrimitive.Action` é apenas um slot estilizado: o `DialogActionState`
	do bits-ui expõe id e atributos e não registra handler de clique, então
	confirmar não fechava o diálogo — só o Cancelar fechava.

	`Dialog.Close` lê o mesmo `DialogRootContext` que `AlertDialog.Root` publica e
	fecha pelo caminho oficial (`handleClose` → `onOpenChange`), sem registrar o
	botão como `cancelNode` do root (o que `AlertDialog.Cancel` faria, roubando do
	Cancelar a marcação usada para foco inicial).

	O `onclick` do consumidor é composto antes do fechamento por `mergeProps`, logo
	continua disparando; `event.preventDefault()` nele mantém o diálogo aberto.
-->
<DialogPrimitive.Close
	bind:ref
	data-slot="alert-dialog-action"
	class={cn(buttonVariants({ variant, size }), "cn-alert-dialog-action", className)}
	{...restProps}
/>
