<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ContextMenuPrimitive.TriggerProps = $props();
</script>

<!--
	Acessibilidade — versão curta. Bloco canônico das cinco stacks: cabeçalho de
	`context-menu.ts` no Vanilla. Do popup para dentro vale o contrato do
	DropdownMenu inteiro, porque aqui as peças SÃO as de `bits/menu`. O que
	diverge é a abertura:

	1. O gatilho NÃO se anuncia. `ContextMenuTriggerState.props`, em
	   `bits/menu/menu.svelte.js`, entrega `data-state`, `data-disabled`, o
	   atributo de marcação da lib e `tabindex: -1` — nada de `aria-haspopup`
	   nem `aria-expanded`, ao contrário do gatilho do DropdownMenu, que é um
	   botão e carrega os dois. É escolha das quatro libs e está certa:
	   `aria-haspopup` não vale em `generic`, o papel implícito desta `<div>`. O
	   preço está pago por escrito no conteúdo compartilhado
	   (`accessibility.warning`, `notes.tip5`).
	2. `tabindex={0}` é REQUISITO, não enfeite: a tecla Menu e Shift+F10
	   disparam `contextmenu` no elemento FOCADO, e a lib nasce com
	   `tabindex="-1"`, que NÃO põe a área na ordem de tabulação. O valor chega
	   porque o `mergeProps` da lib restaura por último o `tabindex` recebido de
	   fora — conferido na fonte, não suposto.
	3. É também para ele que o foco volta ao fechar; sem a parada de tabulação o
	   foco caía no `<body>` — medido em sonda, contra o que
	   `testes.functional.item2` promete.
-->
<ContextMenuPrimitive.Trigger
	bind:ref
	data-slot="context-menu-trigger"
	class={cn("nds-context-menu-trigger", className)}
	tabindex={0}
	{...restProps}
/>
