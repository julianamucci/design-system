<script lang="ts">
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...props
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<!-- A moldura. Borda, arredondamento e anel de foco são DELA; o campo interno
     fica nu, e os três estados (foco, inválido, desabilitado) saem de `:has()`
     na folha compartilhada — nada aqui os escreve.

     O papel está declarado DE PROPÓSITO, e não deixado implícito. Em `drawer` e
     `sheet` o corpo era um `<div>` sem papel e o `aria-label` era descartado em
     silêncio (`aria-prohibited-attr`); `role="group"` é justamente um dos papéis
     que ACEITAM nome, então "o nome é de quem compõe" aqui é promessa que se
     cumpre.

     O nome é OPCIONAL, e nunca inventado: com um campo só dentro da moldura,
     quem nomeia é o `<label>` do campo, e nomear o grupo também faz o leitor de
     tela dizer as mesmas palavras duas vezes. Ele ganha utilidade quando a
     moldura guarda MAIS DE UM controle. -->
<div
	bind:this={ref}
	data-slot="input-group"
	role="group"
	class={cn("nds-input-group", className)}
	{...props}
>
	{@render children?.()}
</div>
