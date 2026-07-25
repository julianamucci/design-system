<script lang="ts" module>
	import { cva, type VariantProps } from "class-variance-authority";

	export const badgeVariants = cva("nds-badge", {
		
		variants: {
			variant: {
				default: "nds-badge-default",
				secondary: "nds-badge-secondary",
				destructive: "nds-badge-destructive",
				outline: "nds-badge-outline",
				ghost: "nds-badge-ghost",
				link: "nds-badge-link",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
