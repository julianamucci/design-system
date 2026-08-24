<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '@/lib/utils.js';
	import { getComboboxState } from './combobox-context.js';

	let {
		class: className,
		children,
		...restProps
	}: { class?: string; children?: Snippet } & Record<string, unknown> = $props();

	const combobox = getComboboxState();

	let element: HTMLDivElement | null = $state(null);

	// QUEM PARECE UM CAMPO é esta caixa, não o `<input>`: a borda, o fundo e o
	// anel de foco moram aqui, e é o que permite os chips conviverem com o texto
	// dentro da mesma moldura.
	//
	// `data-chips` sai daqui porque a folha o lê no WRAPPER para alcançar duas
	// coisas de uma vez: como a caixa dos chips se comporta por dentro e como
	// esta caixa alinha limpar e gatilho quando há mais de uma linha de chip.
	//
	// O ouvinte é registrado à mão, e não por `onmousedown={...}`: manipulador
	// inline num elemento sem papel acende o aviso de a11y do compilador, e o
	// gesto aqui é o `cursor: text` da folha cumprindo o que promete — clicar em
	// qualquer canto da caixa leva o cursor para a busca.
	$effect(() => {
		const target = element;
		if (!target) return;
		const onPointer = (event: MouseEvent) => {
			if (event.target !== target) return;
			event.preventDefault();
			combobox.focusInput();
		};
		target.addEventListener('mousedown', onPointer);
		return () => target.removeEventListener('mousedown', onPointer);
	});
</script>

<div
	bind:this={element}
	class={cn('nds-combobox-input-wrapper', className)}
	data-slot="combobox-input-wrapper"
	data-chips={combobox.chipsLayout}
	data-disabled={combobox.disabled ? '' : undefined}
	aria-invalid={combobox.invalid ? 'true' : undefined}
	{...restProps}
>
	{@render children?.()}
</div>
