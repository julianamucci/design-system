<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { buttonVariants, type ButtonVariant } from "@/components/ui/button/index.js";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		variant = "ghost",
		"aria-label": ariaLabel,
		...restProps
	}: CalendarPrimitive.NextButtonProps & {
		variant?: ButtonVariant;
	} = $props();
</script>

{#snippet Fallback()}
	<ChevronRightIcon class={cn("nds-size-4", className)} />
{/snippet}

<!-- Mesmo motivo do botão anterior: a lib mescla os props dela por último e
     descarta o `aria-label` de fora, deixando o botão anunciando "Next". -->
<CalendarPrimitive.NextButton bind:ref {...restProps}>
	{#snippet child({ props })}
		<!-- `props` é um saco de chaves desconhecidas, então o rótulo da lib chega
		     como `unknown`. A checagem de tipo em runtime é o que o transforma em
		     texto sem fingir que ele já era. -->
		{@const libLabel = typeof props["aria-label"] === "string" ? props["aria-label"] : undefined}
		<button
			{...props}
			aria-label={ariaLabel ?? libLabel}
			class={cn(buttonVariants({ variant }), "nds-calendar-nav-btn", className)}
		>
			{#if children}
				{@render children()}
			{:else}
				{@render Fallback()}
			{/if}
		</button>
	{/snippet}
</CalendarPrimitive.NextButton>
