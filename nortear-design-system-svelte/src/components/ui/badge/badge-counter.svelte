<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<!-- Subparte em arquivo próprio, exportada pelo `index.ts` ao lado da raiz: é a
     forma que a stack já usa para peça de componente (alert-title,
     alert-description, alert-action). O badge não tinha subparte nenhuma até
     aqui, e alternativa era uma prop `count` na raiz — descartada porque a peça
     é conteúdo, não configuração: quem a usa escolhe o que vai dentro dela e
     onde ela entra na etiqueta.

     Ela é NEUTRA de propósito, e a cor não é escolha desta camada: a folha
     compartilhada pinta fundo `--secondary` com texto `--foreground` porque
     preencher o número com a cor da variante o deixa abaixo de 4.5:1 em parte
     dos temas. Quem carrega a variante é a borda da etiqueta, ao redor. -->
<span
	bind:this={ref}
	data-slot="badge-counter"
	class={cn("nds-badge-counter", className)}
	{...restProps}
>
	{@render children?.()}
</span>
