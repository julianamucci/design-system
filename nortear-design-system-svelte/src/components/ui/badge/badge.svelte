<script lang="ts" module>
	import { cva, type VariantProps } from "class-variance-authority";

	export const badgeVariants = cva("nds-badge", {
		
		variants: {
			variant: {
				default: "nds-badge-default",
				secondary: "nds-badge-secondary",
				destructive: "nds-badge-destructive",
				outline: "nds-badge-outline",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<!-- Sempre <span>: a prop href saiu do contrato. A orientação do componente é
     envolver o badge em <a> ou <button>, e não transformá-lo no elemento
     interativo — nenhuma outra stack o fazia, e nenhuma docs page o documenta. -->
<span
	bind:this={ref}
	data-slot="badge"
	data-variant={variant}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</span>
