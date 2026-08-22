<script lang="ts">
	import { Button } from "@/components/ui/button/index.js";
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import { cn } from "@/lib/utils.js";
	import { LABELS_SIDEBAR_DEFAULT } from "@shared/primitives/sidebar-a11y-labels";
	import type { ComponentProps } from "svelte";
	import { useSidebar } from "./context.svelte.js";

	// `label` é o nome acessível: o botão carrega só um ícone, e o ícone é
	// `aria-hidden`. O padrão vem do conteúdo compartilhado, em português — o
	// controle principal do componente anunciava "Toggle Sidebar" até aqui.
	let {
		ref = $bindable(null),
		class: className,
		label = LABELS_SIDEBAR_DEFAULT.alternar,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		label?: string;
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
</script>

<Button
	bind:ref
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon-sm"
	class={cn(className)}
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<PanelLeftIcon  />
	<span class="nds-sr-only">{label}</span>
</Button>
