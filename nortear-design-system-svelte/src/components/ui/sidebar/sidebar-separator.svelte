<script lang="ts">
	import { Separator } from "@/components/ui/separator/index.js";
	import { cn } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComponentProps<typeof Separator> = $props();
</script>

<!--
	`decorative={false}`: o separador da Sidebar divide GRUPOS de navegação, e a
	divisão faz parte da estrutura da informação — por isso ele é anunciado, como
	já acontece no Vanilla e no Angular, onde `role="separator"` está cravado.
	Ficava implícito enquanto o primitivo do bits-ui nascia semântico; agora que o
	padrão do design system é decorativo, a exceção precisa ser dita.
-->
<Separator
	bind:ref
	decorative={false}
	data-slot="sidebar-separator"
	data-sidebar="separator"
	class={cn("nds-sidebar-separator", className)}
	{...restProps}
/>
