<script lang="ts" module>
	import { cva, type VariantProps } from "class-variance-authority";

	export const sidebarMenuButtonVariants = cva("nds-sidebar-menu-button", {
		
		variants: {
			variant: {
				default: "",
				outline: "nds-sidebar-menu-button-outline",
			},
			size: {
				default: "",
				sm: "",
				lg: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type SidebarMenuButtonVariant = VariantProps<
		typeof sidebarMenuButtonVariants
	>["variant"];
	export type SidebarMenuButtonSize = VariantProps<typeof sidebarMenuButtonVariants>["size"];
</script>

<script lang="ts">
	import * as Tooltip from "@/components/ui/tooltip/index.js";
	import { cn, type WithElementRef, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import { mergeProps } from "bits-ui";
	import type { ComponentProps, Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { useSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		variant = "default",
		size = "default",
		isActive = false,
		tooltipContent,
		tooltipContentProps,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
		isActive?: boolean;
		variant?: SidebarMenuButtonVariant;
		size?: SidebarMenuButtonSize;
		tooltipContent?: Snippet | string;
		tooltipContentProps?: WithoutChildrenOrChild<ComponentProps<typeof Tooltip.Content>>;
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} = $props();

	const sidebar = useSidebar();

	// Identificação do elemento. Fica fora de `buttonProps` porque entra por
	// último no merge: quando o item tem tooltip, o gatilho passa os próprios
	// atributos por cima, entre eles um `data-slot` seu. Se ele vencesse, o
	// elemento deixaria de se anunciar como o botão do menu e o seletor do
	// design system não casaria com nada. O elemento É o botão do sidebar; o
	// tooltip é comportamento acoplado a ele, não a sua identidade.
	const identidade = {
		"data-slot": "sidebar-menu-button",
		"data-sidebar": "menu-button",
	};

	const buttonProps = $derived({
		class: cn(sidebarMenuButtonVariants({ variant, size }), className),
		...identidade,
		"data-size": size,
		// "true" quando ativo e ausente quando não: é a forma que a folha
		// compartilhada casa, e a mesma que as outras implementações emitem.
		"data-active": isActive ? "true" : undefined,
		...restProps,
	});
</script>

{#snippet Button({ props }: { props?: Record<string, unknown> })}
	{@const mergedProps = mergeProps(buttonProps, props, identidade)}
	{#if child}
		{@render child({ props: mergedProps })}
	{:else}
		<button bind:this={ref} {...mergedProps}>
			{@render children?.()}
		</button>
	{/if}
{/snippet}

{#if !tooltipContent}
	{@render Button({})}
{:else}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render Button({ props })}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content
			side="right"
			align="center"
			hidden={sidebar.state !== "collapsed" || sidebar.isMobile}
			{...tooltipContentProps}
		>
			{#if typeof tooltipContent === "string"}
				{tooltipContent}
			{:else if tooltipContent}
				{@render tooltipContent()}
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
{/if}
