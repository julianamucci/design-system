<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import DrawerPortal from "./drawer-portal.svelte";
	import DrawerOverlay from "./drawer-overlay.svelte";
	import { cn } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import type { WithoutChildrenOrChild } from "@/lib/utils.js";
	import { useDrawerDirection } from "./direction-context.js";

	/**
	 * `data-direction` é o que dá posição ao painel.
	 *
	 * A folha compartilhada ancora dezessete seletores neste atributo — borda,
	 * cantos, alça, cabeçalho e as transições das quatro direções. A lib de
	 * gesto escreve o `data-vaul-drawer-direction` dela no mesmo elemento e pode
	 * continuar escrevendo; o que a folha lê é este, porque o contrato de markup
	 * é do design system e não da dependência de parte das stacks.
	 *
	 * A direção vem da raiz pelo contexto — é lá que ela é prop.
	 */
	const drawerDirection = useDrawerDirection();

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
		data-direction={drawerDirection.direction}
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
