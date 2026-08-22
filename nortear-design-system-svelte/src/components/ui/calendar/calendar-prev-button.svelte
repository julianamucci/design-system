<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import { buttonVariants, type ButtonVariant } from "@/components/ui/button/index.js";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		variant = "ghost",
		"aria-label": ariaLabel,
		...restProps
	}: CalendarPrimitive.PrevButtonProps & {
		variant?: ButtonVariant;
	} = $props();
</script>

{#snippet Fallback()}
	<ChevronLeftIcon class={cn("nds-size-4", className)} />
{/snippet}

<!--
Renderizado pelo snippet `child`, e não deixando a lib montar o botão: ela
mescla os props DELA por último, então o `aria-label` que se passa de fora é
descartado e o botão anuncia "Previous" — em inglês, e sem dizer do que é
anterior. Com o `child` o elemento é nosso, e o rótulo traduzido chega.
-->
<CalendarPrimitive.PrevButton bind:ref {...restProps}>
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
</CalendarPrimitive.PrevButton>
