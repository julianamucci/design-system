<script lang="ts">
	import { PinInput as InputOTPPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	// A lib não filtra caractere nenhum sem `pattern`, e `inputmode="numeric"` é
	// só uma dica de teclado de software: num teclado físico a letra entrava num
	// código de seis DÍGITOS sem nada recusá-la. O conteúdo compartilhado já
	// documentava "apenas dígitos" como padrão, e as stacks sem lib filtram —
	// aqui o default passa a cumprir o que está escrito. Quem quer alfanumérico
	// continua passando o próprio `pattern`.
	const APENAS_DIGITOS = "^\\d+$";

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(""),
		pattern = APENAS_DIGITOS,
		...restProps
	}: InputOTPPrimitive.RootProps & { pattern?: string } = $props();
</script>

<InputOTPPrimitive.Root
	bind:ref
	bind:value
	{pattern}
	data-slot="input-otp"
	spellcheck={false}
	class={cn(
		"nds-input-otp-container",
		className
	)}
	{...restProps}
/>
