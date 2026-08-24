<script lang="ts">
	// Andaime das stories: o Storybook desta stack não passa children para a
	// render function, então toda story com marcação própria mora num
	// componente. Aqui ele monta a composição inteira do Combobox — as dezenove
	// peças na ordem do contrato — e expõe pelos controls o que a story ajusta.
	import {
		Combobox,
		ComboboxChip,
		ComboboxChipRemove,
		ComboboxChips,
		ComboboxClear,
		ComboboxEmpty,
		ComboboxGroup,
		ComboboxGroupLabel,
		ComboboxInput,
		ComboboxInputWrapper,
		ComboboxItem,
		ComboboxLabel,
		ComboboxList,
		ComboboxPopup,
		ComboboxPositioner,
		ComboboxSeparator,
		ComboboxTrigger,
		filterItems,
		type ComboboxChipsLayout,
		type ComboboxOption,
	} from './index.js';

	interface Props {
		items?: ComboboxOption[];
		label?: string;
		placeholder?: string;
		multiple?: boolean;
		chipsLayout?: ComboboxChipsLayout;
		disabled?: boolean;
		invalid?: boolean;
		name?: string;
		value?: string | string[];
		emptyMessage?: string;
		clearLabel?: string;
		triggerLabel?: string;
		removeLabel?: string;
		onValueChange?: (value: string | string[]) => void;
	}

	let {
		items = [],
		label = 'País',
		placeholder = 'Buscar país',
		multiple = false,
		chipsLayout = 'wrap',
		disabled = false,
		invalid = false,
		name = undefined,
		value = undefined,
		emptyMessage = 'Nenhum resultado',
		clearLabel = 'Limpar',
		triggerLabel = 'Abrir lista',
		removeLabel = 'Remover',
		onValueChange,
	}: Props = $props();

	// O valor é do ANDAIME, não da raiz: o Storybook re-executa o `render` a
	// cada mudança de control, e um valor guardado dentro do campo se perderia
	// junto — mexer em `disabled` apagaria os chips recém-escolhidos. Guardá-lo
	// fora também é o que o consumidor real faz.
	let selection = $state<string | string[]>(
		value ?? (multiple ? [] : ''),
	);
	let query = $state('');

	// Alternar o modo troca o formato do valor: texto vira lista, lista vira o
	// primeiro texto. Sem isto, ligar `multiple` deixaria a raiz com um valor da
	// forma errada e nenhum chip apareceria.
	$effect(() => {
		const isList = Array.isArray(selection);
		if (multiple && !isList) {
			selection = selection ? [selection as string] : [];
		} else if (!multiple && isList) {
			selection = (selection as string[])[0] ?? '';
		}
	});

	const chips = $derived(Array.isArray(selection) ? selection : []);

	const grouped = $derived(items.some((entry) => entry.group));

	const groups = $derived.by(() => {
		const out: { label: string; items: ComboboxOption[] }[] = [];
		for (const entry of items) {
			const title = entry.group ?? '';
			const last = out.at(-1);
			if (last && last.label === title) last.items.push(entry);
			else out.push({ label: title, items: [entry] });
		}
		return out;
	});

	// Um cabeçalho de grupo sem nenhuma opção embaixo é o defeito clássico de
	// filtrar item a item — o grupo some junto com o último item que casava.
	const visibleGroups = $derived(
		groups.filter((group) => filterItems(group.items, query).length > 0),
	);
</script>

{#key multiple}
	<Combobox
		{items}
		bind:value={selection}
		bind:inputValue={query}
		{multiple}
		{chipsLayout}
		{disabled}
		{invalid}
		{name}
		{onValueChange}
	>
		<ComboboxLabel>{label}</ComboboxLabel>
		<ComboboxInputWrapper>
			<!-- O campo de texto mora DENTRO da caixa de chips: é o que faz o texto
			     seguir depois do último chip e deixa limpar e gatilho fora do que
			     quebra ou rola. Sem chip nenhum, a caixa não existe e o campo é filho
			     direto do wrapper — a folha aceita as duas formas. -->
			{#if multiple}
				<ComboboxChips>
					{#each chips as chip (chip)}
						<ComboboxChip value={chip}>
							<ComboboxChipRemove {removeLabel} />
						</ComboboxChip>
					{/each}
					<ComboboxInput {placeholder} />
				</ComboboxChips>
			{:else}
				<ComboboxInput {placeholder} />
			{/if}
			<ComboboxClear aria-label={clearLabel} />
			<ComboboxTrigger aria-label={triggerLabel} />
		</ComboboxInputWrapper>
		<ComboboxPositioner>
			<ComboboxPopup>
				<ComboboxList>
					{#if grouped}
						{#each visibleGroups as group, index (group.label)}
							<ComboboxGroup>
								<ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
								{#each group.items as entry (entry.value)}
									<ComboboxItem
										value={entry.value}
										label={entry.label}
										disabled={entry.disabled}
									/>
								{/each}
							</ComboboxGroup>
							{#if index < visibleGroups.length - 1}
								<ComboboxSeparator />
							{/if}
						{/each}
					{:else}
						{#each items as entry (entry.value)}
							<ComboboxItem value={entry.value} label={entry.label} disabled={entry.disabled} />
						{/each}
					{/if}
				</ComboboxList>
				<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
			</ComboboxPopup>
		</ComboboxPositioner>
	</Combobox>
{/key}
