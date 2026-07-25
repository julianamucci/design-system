<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
	import { mode } from "mode-watcher";
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	let { ...restProps }: SonnerProps = $props();
</script>

<Sonner
	theme={mode.current}
	class="toaster"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border);"
	{...restProps}
>
	{#snippet loadingIcon()}
		<Loader2Icon class="nds-toast-icon nds-toast-icon-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="nds-toast-icon" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="nds-toast-icon" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="nds-toast-icon" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="nds-toast-icon" />
	{/snippet}
</Sonner>
