<script lang="ts">
	import { Combobox as ComboboxPrimitive } from 'bits-ui';
	import { cn } from '@/lib/utils.js';
	import { getComboboxState } from './combobox-context.js';

	let {
		class: className,
		...restProps
	}: { class?: string } & Record<string, unknown> = $props();

	// Dois atributos são escritos DEPOIS do espalhamento da lib, e cada um por um
	// motivo próprio:
	//
	//   · `value` — a lib força o texto que ela mesma guarda, e escolher um item
	//     no modo múltiplo faria o rótulo do escolhido reaparecer na busca. Aqui
	//     o texto tem um dono só.
	//   · `aria-activedescendant` — a lib elege a opção ativa no mesmo instante
	//     da digitação, antes de o filtro tirar as que não casam. Quando NENHUMA
	//     casa, ela segue apontando o item que acabou de sair do documento, e o
	//     leitor de tela anuncia uma opção que já não existe. Sem opção, ninguém
	//     está apontado — e nada na tela denunciaria o contrário.
	const combobox = getComboboxState();

	let element: HTMLInputElement | null = $state(null);

	$effect(() => {
		combobox.registerInput(element);
		return () => combobox.registerInput(null);
	});

	function handleInput(event: Event): void {
		combobox.setQuery((event.currentTarget as HTMLInputElement).value);
	}

	function handleKeydown(event: KeyboardEvent): void {
		// Os dois gestos que a lib não tem. `preventDefault` também encerra a
		// cadeia de manipuladores: o da lib abriria a lista no Backspace, que é o
		// contrário do que o chip pede.
		if (
			event.key === 'Backspace' &&
			combobox.multiple &&
			combobox.query === '' &&
			combobox.selected.length > 0
		) {
			// O gesto que define o chip: sem ele, desfazer uma escolha exige o mouse.
			event.preventDefault();
			combobox.deselect(combobox.selected[combobox.selected.length - 1]);
			return;
		}

		// Duas funções na mesma tecla, e a ordem importa: fechar primeiro — a
		// camada da lib faz isso —, e limpar o texto só quando já não há o que
		// fechar.
		if (event.key === 'Escape' && !combobox.open && combobox.query !== '') {
			event.preventDefault();
			combobox.setQuery('');
		}
	}
</script>

<ComboboxPrimitive.Input
	id={combobox.inputId}
	oninput={handleInput}
	onkeydown={handleKeydown}
	{...restProps}
>
	{#snippet child({ props })}
		<input
			{...props}
			bind:this={element}
			class={cn('nds-combobox-input', className)}
			data-slot="combobox-input"
			type="text"
			autocomplete="off"
			value={combobox.query}
			aria-controls={combobox.listboxId}
			aria-invalid={combobox.invalid ? 'true' : undefined}
			aria-activedescendant={combobox.matchCount === 0
				? undefined
				: (props['aria-activedescendant'] as string | undefined)}
		/>
	{/snippet}
</ComboboxPrimitive.Input>
