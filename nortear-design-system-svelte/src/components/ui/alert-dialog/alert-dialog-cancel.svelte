<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
	import {
		buttonVariants,
		type ButtonVariant,
		type ButtonSize,
	} from "@/components/ui/button/index.js";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "outline",
		size = "default",
		onclick,
		onkeydown,
		...restProps
	}: AlertDialogPrimitive.CancelProps & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	} = $props();

	// Mesmo caso do AlertDialogAction: o bits-ui fecha no `onkeydown` com
	// `preventDefault()` e nunca emite `click`, então o `onclick` do consumidor
	// não rodava na ativação por teclado (WCAG 2.1.1).
	function handleKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement }
	) {
		onkeydown?.(event);
		/* v8 ignore next -- só dispara se o handler do consumidor chamar
		   preventDefault para segurar o diálogo aberto; nenhuma story faz isso. */
		if (event.defaultPrevented) return;
		if (event.key !== "Enter" && event.key !== " ") return;
		onclick?.(event as unknown as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
	}
</script>

<AlertDialogPrimitive.Cancel
	bind:ref
	data-slot="alert-dialog-cancel"
	class={cn(buttonVariants({ variant, size }), "cn-alert-dialog-cancel", className)}
	{onclick}
	onkeydown={handleKeydown}
	{...restProps}
/>
