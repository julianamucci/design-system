<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: CalendarPrimitive.GridHeadProps = $props();
</script>

<!--
`aria-hidden`: a linha dos dias da semana aparece na tela mas fica fora da
árvore de acessibilidade, porque cada dia já anuncia a data por extenso —
repetir a coluna a cada célula só encompridaria a leitura. O React e o Vue já
faziam isso; aqui e no Vanilla o cabeçalho era lido, e a mesma tabela soava
diferente dependendo da stack.
-->
<CalendarPrimitive.GridHead bind:ref aria-hidden="true" class={cn(className)} {...restProps} />
