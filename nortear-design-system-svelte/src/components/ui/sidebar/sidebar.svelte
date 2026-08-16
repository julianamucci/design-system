<script lang="ts">
	import * as Sheet from "@/components/ui/sheet/index.js";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { ROTULOS_SIDEBAR_PADRAO } from "@shared/primitives/sidebar-a11y-labels";
	import { SIDEBAR_WIDTH_MOBILE } from "./constants.js";
	import { useSidebar } from "./context.svelte.js";

	// `mobileTitle` e `mobileDescription` nomeiam a gaveta para quem usa leitor
	// de tela — um diálogo sem nome é anunciado como "diálogo" e mais nada. O
	// padrão vem do conteúdo compartilhado, em português; são props porque o
	// texto é do produto, não do design system.
	let {
		ref = $bindable(null),
		side = "left",
		variant = "sidebar",
		collapsible = "offcanvas",
		mobileTitle = ROTULOS_SIDEBAR_PADRAO.tituloMovel,
		mobileDescription = ROTULOS_SIDEBAR_PADRAO.descricaoMovel,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		side?: "left" | "right";
		variant?: "sidebar" | "floating" | "inset";
		collapsible?: "offcanvas" | "icon" | "none";
		mobileTitle?: string;
		mobileDescription?: string;
	} = $props();

	const sidebar = useSidebar();
</script>

{#if collapsible === "none"}
	<div
		class={cn("nds-sidebar-static", className)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
{:else if sidebar.isMobile}
	<Sheet.Root
		bind:open={() => sidebar.openMobile, (v) => sidebar.setOpenMobile(v)}
		{...restProps}
	>
		<Sheet.Content
			bind:ref
			data-sidebar="sidebar"
			data-slot="sidebar"
			data-mobile="true"
			class={cn("nds-sidebar-mobile", className)}
			style="--sidebar-width: {SIDEBAR_WIDTH_MOBILE};"
			{side}
		>
			<Sheet.Header class="nds-sr-only">
				<Sheet.Title>{mobileTitle}</Sheet.Title>
				<Sheet.Description>{mobileDescription}</Sheet.Description>
			</Sheet.Header>
			<div class="nds-sidebar-mobile-inner">
				{@render children?.()}
			</div>
		</Sheet.Content>
	</Sheet.Root>
{:else}
	<div
		bind:this={ref}
		class="nds-sidebar-root"
		data-state={sidebar.state}
		data-collapsible={sidebar.state === "collapsed" ? collapsible : ""}
		data-variant={variant}
		data-side={side}
		data-slot="sidebar"
	>
		<!-- This is what handles the sidebar gap on desktop -->
		<div
			data-slot="sidebar-gap"
			class={cn("nds-sidebar-gap-inner")}
		></div>
		<div
			data-slot="sidebar-container"
			class={cn("nds-sidebar-panel", className)}
			{...restProps}
		>
			<div
				data-sidebar="sidebar"
				data-slot="sidebar-inner"
				class="nds-sidebar-inner"
			>
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
