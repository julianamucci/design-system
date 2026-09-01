<script lang="ts" module>
	/**
	 * Medidas do botão apertado que cabem dentro da moldura.
	 *
	 * Era um `cva` com as quatro medidas mapeando para string VAZIA, e ao lado
	 * dele um `data-size` no elemento. Nenhuma folha do design system lê
	 * `[data-size]` para `.nds-input-group-button` — conferido —, então a opção
	 * prometia uma medida que nunca aplicava. Quem aplica é o `Button`, que rende
	 * `nds-button-xs` e companhia; por isso `size` é REPASSADO a ele.
	 */
	export type InputGroupButtonSize = "xs" | "sm" | "icon-xs" | "icon-sm";
</script>

<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { Button } from "@/components/ui/button/index.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		type = "button",
		variant = "ghost",
		size = "xs",
		...restProps
	}: Omit<ComponentProps<typeof Button>, "href" | "size"> & {
		size?: InputGroupButtonSize;
	} = $props();
</script>

<!-- `data-slot="input-group-button"` sobrescreve o `data-slot="button"` do
     próprio Button — é por ele que a story e a play acham o que AGE dentro da
     moldura, sem depender do texto nem da posição. A classe daqui só aperta a
     medida; o visual de botão continua vindo de `.nds-button`. -->
<Button
	bind:ref
	{type}
	{variant}
	{size}
	data-slot="input-group-button"
	class={cn("nds-input-group-button", className)}
	{...restProps}
>
	{@render children?.()}
</Button>
