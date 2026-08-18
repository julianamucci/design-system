<script lang="ts">
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import NavigationMenuViewport from "./navigation-menu-viewport.svelte";

	let {
		ref = $bindable(null),
		// `value` é o item aberto no momento. Sem declará-lo aqui ele caía no
		// espalhamento e chegava à lib como valor CONTROLADO: quem escrevia
		// `bind:value` não recebia nada de volta e, pior, um `value` passado de
		// fora prendia o menu aberto. Declarado e religado com `bind:`, o mesmo
		// atributo serve para o valor inicial e para a leitura do estado.
		value = $bindable(""),
		class: className,
		viewport = true,
		children,
		...restProps
	}: NavigationMenuPrimitive.RootProps & {
		viewport?: boolean;
	} = $props();
</script>

<NavigationMenuPrimitive.Root
	bind:ref
	bind:value
	data-slot="navigation-menu"
	data-viewport={viewport}
	class={cn(
		"nds-navigation-menu",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	{#if viewport}
		<NavigationMenuViewport />
	{/if}
</NavigationMenuPrimitive.Root>
