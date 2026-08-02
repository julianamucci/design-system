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
		onclick,
		onkeydown,
		...restProps
	}: AlertDialogPrimitive.ActionProps & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	} = $props();

	// O `DialogCloseState` do bits-ui trata Enter/Espaço no próprio `onkeydown`:
	// dá `preventDefault()` e fecha direto, sem emitir `click`. Sem esta ponte o
	// `onclick` do consumidor só rodava com mouse — a confirmação era inoperável
	// por teclado (WCAG 2.1.1) mesmo com o diálogo fechando.
	//
	// A ordem espelha o caminho do clique: handler do consumidor primeiro,
	// fechamento depois; `preventDefault()` no handler mantém o diálogo aberto.
	function handleKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement }
	) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;
		if (event.key !== "Enter" && event.key !== " ") return;
		onclick?.(event as unknown as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
	}
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
	{onclick}
	onkeydown={handleKeydown}
	{...restProps}
/>
