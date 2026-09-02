<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import DrawerPortal from "./drawer-portal.svelte";
	import DrawerOverlay from "./drawer-overlay.svelte";
	import { cn } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		...restProps
	}: DrawerPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DrawerPortal>>;
	} = $props();
</script>

<DrawerPortal {...portalProps}>
	<DrawerOverlay />
	<DrawerPrimitive.Content
		bind:ref
		data-slot="drawer-content"
		class={cn("nds-drawer-content", className)}
		{...restProps}
	>
		<!-- Alça: pura afordância. O CSS só a mostra na direção de baixo, e ela
		     não recebe foco nem nome — anunciá-la só somaria ruído. -->
		<div
			class="nds-drawer-handle"
			aria-hidden="true"
		></div>
		{@render children?.()}
	</DrawerPrimitive.Content>
</DrawerPortal>
