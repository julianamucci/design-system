<script lang="ts" module>
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { cva, type VariantProps } from "class-variance-authority";

	export const buttonVariants = cva("nds-button", {
		
		variants: {
			variant: {
				default: "nds-button-default",
				outline: "nds-button-outline",
				secondary: "nds-button-secondary",
				ghost: "nds-button-ghost",
				destructive: "nds-button-destructive",
				link: "nds-button-link",
			},
			size: {
				default: "",
				xs: "nds-button-xs",
				sm: "nds-button-sm",
				lg: "nds-button-lg",
				icon: "nds-button-icon",
				"icon-xs": "nds-button-icon-xs",
				"icon-sm": "nds-button-icon-sm",
				"icon-lg": "nds-button-icon-lg",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();

	// PATCH: security — validar protocolo de href para evitar XSS via javascript:/data:/vbscript: (ver guideline 09-seguranca-xss.md)
	function isSafeUrl(url: string | undefined): url is string {
		if (!url) return false;
		try {
			const parsed = new URL(url, "https://placeholder.invalid");
			return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol);
		} catch {
			return url.startsWith("#") || url.startsWith("/");
		}
	}
	const safeHref = $derived(isSafeUrl(href) ? href : undefined);
</script>

{#if href}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- regra do router SvelteKit; projeto roda Storybook sem router e o href externo é validado por isSafeUrl (guideline 09) -->
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : safeHref}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
