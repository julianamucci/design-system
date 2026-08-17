<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		disabled = false,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<!--
  ─── Aba desabilitada: `aria-disabled`, nunca o `disabled` do primitivo ───────

  O padrão WAI-ARIA para `tab` manda a aba desabilitada continuar alcançável
  pela seta, para que o leitor de tela a anuncie como indisponível. `disabled`
  nativo faz o oposto: some do alcance do foco.

  Duas coisas medidas na fonte da lib, e é o que obriga a repassar `false`:

  1. O estado do trigger emite `disabled` NATIVO quando recebe a prop
     (`disabled: boolToTrueOrUndef(...)`), e o merge dele vence o que vem do
     call site — não dá para desfazer por atributo.
  2. O grupo de foco itinerante da lib escolhe os candidatos por SELETOR:
     `[data-…-trigger]:not([data-disabled])`. O `data-disabled` que o estado
     emite junto tira a aba da lista de candidatos, ou seja, a seta pula por
     cima dela. Por isso este stack não emite `data-disabled` na aba
     desabilitada — emiti-lo desfaria exatamente a decisão que ele implementa.
     `aria-disabled` é o atributo que as cinco stacks compartilham, e é ele que
     a asserção verifica.

  Com `disabled={false}` o primitivo trata a aba como qualquer outra: mantém a
  seta, o Home/End e o `tabindex` itinerante. Quem barra a ATIVAÇÃO é a guarda
  em fase de captura instalada por `tabs-list.svelte` — ela roda antes dos
  ouvintes do primitivo e é a única posição em que isso é determinístico.
-->
<TabsPrimitive.Trigger
	bind:ref
	{...restProps}
	disabled={false}
	aria-disabled={disabled ? "true" : undefined}
	data-slot="tabs-trigger"
	class={cn("nds-tabs-trigger", className)}
/>
