<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';
	import {
		defaultFilter,
		setComboboxState,
		type ComboboxFilter,
		type ComboboxOption,
		type ComboboxState,
	} from './combobox-context.js';

	// ─── Raiz ─────────────────────────────────────────────────────────────────
	//
	// Dona do estado: valor escolhido, texto digitado e aberto/fechado. A lib
	// cuida da camada flutuante e do teclado de navegação; o texto e o filtro são
	// daqui, porque o combobox do `bits-ui` espera a lista já filtrada.
	//
	// `type` da lib é lido UMA vez, na criação do estado: alternar `multiple` em
	// runtime não recria nada. Quem oferece esse controle envolve a raiz num
	// `{#key multiple}` — é o que a story do Playground faz.

	interface Props {
		/** Opções da lista. Rótulo daqui alimenta o chip, o filtro e o vazio. */
		items?: ComboboxOption[];
		/** Escolha atual. Texto no modo simples, lista de textos no múltiplo. */
		value?: string | string[];
		open?: boolean;
		/** Texto de busca. Sem ele o campo administra o próprio texto. */
		inputValue?: string;
		multiple?: boolean;
		disabled?: boolean;
		invalid?: boolean;
		name?: string;
		/** Da última opção a seta volta à primeira. */
		loop?: boolean;
		filter?: ComboboxFilter;
		/** Frase lida pela região viva quando um chip sai. */
		removedMessage?: (label: string) => string;
		onValueChange?: (value: string | string[]) => void;
		onInputValueChange?: (text: string) => void;
		class?: string;
		children?: Snippet;
	}

	let {
		items = [],
		value = $bindable(),
		open = $bindable(false),
		inputValue = $bindable(''),
		multiple = false,
		disabled = false,
		invalid = false,
		name = undefined,
		loop = true,
		filter = defaultFilter,
		removedMessage = (label: string) => `${label} removido`,
		onValueChange,
		onInputValueChange,
		class: className,
		children,
	}: Props = $props();

	// Um id por instância — a mesma página monta vários campos. Descem por
	// contexto para o rótulo (`for`), o input (`aria-controls`) e a lista (`id`).
	// `$props.id()` só é aceito como inicializador de declaração no topo.
	const uid = $props.id();
	const inputId = `nds-combobox-input-${uid}`;
	const listboxId = `nds-combobox-listbox-${uid}`;

	let inputElement: HTMLInputElement | null = null;
	let announcement = $state('');

	const selected = $derived.by(() => {
		if (Array.isArray(value)) return value;
		return value ? [value] : [];
	});

	const matchCount = $derived(items.filter((entry) => filter(entry.label, inputValue)).length);

	function labelFor(target: string): string {
		return items.find((entry) => entry.value === target)?.label ?? target;
	}

	function setQuery(next: string): void {
		if (inputValue === next) return;
		inputValue = next;
		onInputValueChange?.(next);
	}

	function commit(next: string | string[]): void {
		value = next;
		onValueChange?.(next);
	}

	/**
	 * A lib escreve o rótulo do item no texto do campo depois de escolher. No
	 * modo múltiplo isso esconderia as opções restantes atrás de um filtro que
	 * ninguém digitou — o contrato manda limpar. No simples, o rótulo é
	 * justamente o que deve ficar.
	 */
	function handleValueChange(next: string | string[]): void {
		setQuery(multiple ? '' : labelFor(next as string));
		onValueChange?.(next);
	}

	function deselect(target: string): void {
		if (!selected.includes(target)) return;
		commit(multiple ? selected.filter((entry) => entry !== target) : '');
		// Região viva: remover um chip é mudança de estado que não move o foco,
		// então quem não vê a tela não receberia nada sem isto.
		announcement = removedMessage(labelFor(target));
		focusInput();
	}

	function clearAll(): void {
		commit(multiple ? [] : '');
		setQuery('');
		focusInput();
	}

	function registerInput(element: HTMLInputElement | null): void {
		inputElement = element;
	}

	function focusInput(): void {
		inputElement?.focus();
	}

	const contextValue: ComboboxState = {
		get inputId() { return inputId; },
		get listboxId() { return listboxId; },
		get multiple() { return multiple; },
		get disabled() { return disabled; },
		get invalid() { return invalid; },
		get open() { return open; },
		get query() { return inputValue; },
		get selected() { return selected; },
		get matchCount() { return matchCount; },
		matches: (label: string) => filter(label, inputValue),
		labelFor,
		setQuery,
		deselect,
		clearAll,
		registerInput,
		focusInput,
	};
	setComboboxState(contextValue);
</script>

<div data-slot="combobox" class={cn(className)}>
	<ComboboxPrimitive.Root
		type={multiple ? 'multiple' : 'single'}
		bind:value={value as never}
		bind:open
		items={items as never}
		{loop}
		{disabled}
		{name}
		{inputValue}
		onValueChange={handleValueChange as never}
	>
		{@render children?.()}
	</ComboboxPrimitive.Root>
	<span role="status" aria-live="polite" class="nds-sr-only">{announcement}</span>
</div>
