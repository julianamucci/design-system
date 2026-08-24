<script lang="ts">
	// Andaime do modo controlado: a escolha E o texto da busca moram FORA do
	// campo, e chegam nele pelas duas ligações da raiz. É o que o consumidor faz
	// quando o valor vem de um formulário, de uma URL ou de outro campo da tela —
	// e é a única forma de provar que escrever no estado de fora muda o que a
	// tela mostra, e não só o contrário.
	import { Button } from '@/components/ui/button';
	import {
		Combobox,
		ComboboxClear,
		ComboboxEmpty,
		ComboboxInput,
		ComboboxInputWrapper,
		ComboboxItem,
		ComboboxLabel,
		ComboboxList,
		ComboboxPopup,
		ComboboxPositioner,
		ComboboxTrigger,
		type ComboboxOption,
	} from './index.js';

	interface Props {
		items?: ComboboxOption[];
		label?: string;
		placeholder?: string;
		/** Opção que os botões escrevem no estado de fora. */
		outsideChoice?: string;
	}

	let {
		items = [],
		label = 'País',
		placeholder = 'Buscar país',
		outsideChoice = '',
	}: Props = $props();

	let value = $state('');
	let inputValue = $state('');

	const outsideLabel = $derived(
		items.find((entry) => entry.value === outsideChoice)?.label ?? outsideChoice,
	);

	function chooseFromOutside(): void {
		// Os dois juntos: a escolha diz o que vale, o texto diz o que se lê no
		// campo. Escrever só a escolha deixaria a busca mostrando o que sobrou da
		// digitação anterior.
		value = outsideChoice;
		inputValue = outsideLabel;
	}

	function clearFromOutside(): void {
		value = '';
		inputValue = '';
	}
</script>

<div class="nds-stack" data-spacing="md">
	<Combobox {items} bind:value bind:inputValue class="nds-w-sm">
		<ComboboxLabel>{label}</ComboboxLabel>
		<ComboboxInputWrapper>
			<ComboboxInput {placeholder} />
			<ComboboxClear aria-label="Limpar" />
			<ComboboxTrigger aria-label="Abrir lista" />
		</ComboboxInputWrapper>
		<ComboboxPositioner>
			<ComboboxPopup>
				<ComboboxList>
					{#each items as entry (entry.value)}
						<ComboboxItem value={entry.value} label={entry.label} />
					{/each}
				</ComboboxList>
				<ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
			</ComboboxPopup>
		</ComboboxPositioner>
	</Combobox>

	<!-- O travessão no lugar do vazio: leitura de estado sem valor é linha em
	     branco, e linha em branco não distingue "nada escolhido" de "não
	     renderizou". -->
	<p class="nds-text-caption">
		Escolha de fora: <strong data-testid="external-value">{value || '—'}</strong>
	</p>
	<p class="nds-text-caption">
		Busca de fora: <strong data-testid="external-query">{inputValue || '—'}</strong>
	</p>

	<!-- `md` entre botões: 16px é o piso do design system para alvos vizinhos. -->
	<div class="nds-cluster" data-spacing="md">
		<Button variant="outline" onclick={chooseFromOutside}>Escolher {outsideLabel} de fora</Button>
		<Button variant="outline" onclick={clearFromOutside}>Limpar de fora</Button>
	</div>
</div>
