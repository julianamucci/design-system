<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from "svelte-sonner";
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
		// Sem atalho por padrão: a lib concatena o atalho ao nome da região
		// ("Notificações altKey+T"), e o leitor de tela o anunciava. Com a lista
		// vazia o nome é só o rótulo.
		//
		// A lista vazia DEPENDE DE PATCH, e sem ele é pior que o atalho: a lib
		// testa o atalho com `hotkey.every(...)`, e `[].every(...)` é verdadeiro —
		// TODA tecla contava como o atalho, a pilha expandia e roubava o foco, e o
		// Enter no botão de ação deixava de dispará-la. Medido em 2026-09-14 pela
		// story de ação, com prova pareada. O `svelte-sonner+1.2.1.patch` acrescenta
		// a guarda `length > 0`, que a lib do sonner para react já tem. Não tire o
		// patch mantendo a lista vazia.
		hotkey = [],
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

	// O tema da região acompanha a classe `dark` do DOCUMENTO.
	//
	// Vinha de `mode.current`, do `mode-watcher`, que só muda quando alguém chama
	// `setMode` — a barra de temas do Storybook chama, mas quem escreve a classe
	// por outro caminho não. A folha da lib pinta a DESCRIÇÃO pelo tema DELA
	// (`#3f3f3f` no claro, `#e8e8e8` no escuro) sempre que a notificação não usa
	// `richColors`. Medido em 2026-09-14 pela story de descrição, com a classe
	// `dark` posta direto no documento: descrição `rgb(63, 63, 63)` sobre
	// `rgb(36, 49, 56)`, 1.27:1. É o mesmo observador das outras stacks de lib.
	//
	// O observador é solto no desmonte (retorno do `$effect`), e `theme` explícito
	// de quem consome continua vencendo, porque `{...restProps}` vem depois no
	// markup. Prova: `expectDescriptionReadable` em
	// `docs/shared/testing/sonner-probe.ts`.
	let documentTheme = $state<'light' | 'dark'>('light');

	$effect(() => {
		const root = document.documentElement;
		const read = () => (root.classList.contains('dark') ? 'dark' : 'light');
		documentTheme = read();
		const observer = new MutationObserver(() => {
			documentTheme = read();
		});
		observer.observe(root, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
	});
</script>

<Sonner
	theme={documentTheme}
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border); --border-radius: var(--radius);"
	{position}
	{hotkey}
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
