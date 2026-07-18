<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const toggleVariants = tv({
		base: "nds-toggle",
		variants: {
			variant: {
				default: "",
				outline: "",
			},
			// PATCH: theme — alturas via tokens (--height-*) (ver PATCHES.md#toggle-dimension-tokens)
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

	export type ToggleVariant = VariantProps<typeof toggleVariants>["variant"];
	export type ToggleSize = VariantProps<typeof toggleVariants>["size"];
	export type ToggleVariants = VariantProps<typeof toggleVariants>;
</script>

<script lang="ts">
	import { Toggle as TogglePrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = "default",
		variant = "default",
		...restProps
	}: TogglePrimitive.RootProps & {
		variant?: ToggleVariant;
		size?: ToggleSize;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	data-slot="toggle"
	data-variant={variant}
	data-size={size}
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
