<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { mode } from "mode-watcher";
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { CLOSE_LABEL, REGION_LABEL } from './labels';

	// `position` tem default explícito aqui: o default da lib é `bottom-right`, e o
	// do design system é `top-right` — decisão da dona. Declarar no wrapper é o que
	// faz o código dizer o que a docs page publica e o que toda story usa.
	let {
		containerAriaLabel,
		toastOptions: toastOptionsProp,
		position = 'top-right',
		...restProps
	}: SonnerProps = $props();

	// `toastOptions` é MESCLADO, e não substituído: passar só `classes` não pode
	// apagar o rótulo do botão de fechar.
	//
	// Por isso `containerAriaLabel` e `toastOptions` entram DEPOIS de
	// `{...restProps}` no markup — a mesma ordem das outras stacks de lib. Aqui os
	// dois já saem do rest pela desestruturação, então a ordem não muda o
	// resultado hoje; ela tira a armadilha de o spread vencer o mesclado no dia em
	// que alguém parar de desestruturar. A sobreposição de quem consome continua
	// vindo do `??` e do spread de `toastOptionsProp`.
	const toastOptions = $derived({
		closeButtonAriaLabel: CLOSE_LABEL,
		...(toastOptionsProp ?? {}),
	});
</script>

<Sonner
	theme={mode.current}
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	{position}
	{...restProps}
	containerAriaLabel={containerAriaLabel ?? REGION_LABEL}
	{toastOptions}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="nds-sonner-icon nds-sonner-icon-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="nds-sonner-icon" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="nds-sonner-icon" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="nds-sonner-icon" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="nds-sonner-icon" />
	{/snippet}
</Sonner>
