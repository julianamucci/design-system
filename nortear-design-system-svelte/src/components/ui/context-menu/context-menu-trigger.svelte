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
	`tabindex={0}` não é enfeite (mesma nota do stack Angular):
	1. a tecla Menu e Shift+F10 disparam `contextmenu` no elemento FOCADO — sem
	   foco possível, quem não usa mouse nunca abre o menu, e o conteúdo
	   compartilhado documenta esse caminho em `accessibility.keyboard`;
	2. ao fechar, o foco precisa ter para onde voltar. A lib nasce com
	   `tabindex="-1"` aqui, o que não põe a área na ordem de tabulação — medido
	   em sonda antes desta correção, com o foco caindo no `<body>`.
-->
<ContextMenuPrimitive.Trigger
	bind:ref
	data-slot="context-menu-trigger"
	class={cn("nds-context-menu-trigger", className)}
	tabindex={0}
	{...restProps}
/>
