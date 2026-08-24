/**
 * Transforms do painel Code do Combobox.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Sem elas o painel montaria a tag a partir do
 * nome interno do componente compilado — o andaime da story, que ninguém
 * importa.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type ComboboxArgs = {
	label: string;
	placeholder: string;
	multiple: boolean;
	disabled: boolean;
	invalid: boolean;
	name?: string;
};

type Option = { value: string; label: string };
type Group = { label: string; options: Option[] };

const COUNTRIES: Option[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'portugal', label: 'Portugal' },
];

const GROCERIES: Group[] = [
	{
		label: 'Frutas',
		options: [
			{ value: 'maca', label: 'Maçã' },
			{ value: 'banana', label: 'Banana' },
			{ value: 'laranja', label: 'Laranja' },
		],
	},
	{
		label: 'Legumes',
		options: [
			{ value: 'cenoura', label: 'Cenoura' },
			{ value: 'batata', label: 'Batata' },
			{ value: 'abobrinha', label: 'Abobrinha' },
		],
	},
];

type Options = {
	label?: string;
	placeholder?: string;
	multiple?: boolean;
	disabled?: boolean;
	invalid?: boolean;
	name?: string;
	options?: Option[];
	groups?: Group[];
	/**
	 * Como os chips ocupam o campo. Só `single-line` entra no snippet: repetir o
	 * padrão ensina ruído a quem copia.
	 */
	chipsLayout?: 'wrap' | 'single-line';
	/** Regra de correspondência própria, no lugar do filtro padrão. */
	customFilter?: boolean;
	/** Escolha E texto de busca controlados por fora, os dois por ligação. */
	controlled?: boolean;
	/**
	 * Lista sem os rótulos, com um comentário no lugar.
	 *
	 * O exemplo de múltipla escolha da spec usa nomes de outras stacks como
	 * DADO, e a regra da casa é que a documentação de uma stack não cite outra —
	 * quem lê a página do Svelte não deve topar com o nome do vizinho. O que o
	 * snippet ensina ali é a composição dos chips, não a lista.
	 */
	elideOptions?: boolean;
};

const IMPORT_BASE = [
	'Combobox',
	'ComboboxClear',
	'ComboboxEmpty',
	'ComboboxInput',
	'ComboboxInputWrapper',
	'ComboboxItem',
	'ComboboxLabel',
	'ComboboxList',
	'ComboboxPopup',
	'ComboboxPositioner',
	'ComboboxTrigger',
];

const IMPORT_CHIPS = ['ComboboxChip', 'ComboboxChipRemove', 'ComboboxChips'];
const IMPORT_GROUPS = ['ComboboxGroup', 'ComboboxGroupLabel', 'ComboboxSeparator'];

function importBlock(extra: string[] = []): string {
	const names = [...IMPORT_BASE, ...extra].sort();
	return `import {\n${names.map((name) => `  ${name},`).join('\n')}\n} from "@/components/ui/combobox";`;
}

/** Literal de opções indentado para dentro do bloco `<script>`. */
function optionsLiteral(options: Option[], indent = '  '): string {
	return options
		.map((option) => `${indent}{ value: "${option.value}", label: "${option.label}" },`)
		.join('\n');
}

function itemsBlock(o: Options): string {
	if (o.elideOptions) {
		return 'const items = [\n  // { value, label } de cada opção da lista\n];';
	}
	if (o.groups) {
		const body = o.groups
			.map(
				(group) => `  {
    label: "${group.label}",
    options: [
${optionsLiteral(group.options, '      ')}
    ],
  },`,
			)
			.join('\n');
		return `const groups = [\n${body}\n];\n\nconst items = groups.flatMap((group) =>\n  group.options.map((option) => ({ ...option, group: group.label })),\n);`;
	}
	return `const items = [\n${optionsLiteral(o.options ?? COUNTRIES)}\n];`;
}

/** Estado da escolha: texto no modo simples, lista de textos no múltiplo. */
function valueBlock(o: Options): string {
	const value = o.multiple ? 'let value = $state<string[]>([]);' : 'let value = $state("");';
	// No modo controlado o TEXTO da busca também é do consumidor: as duas
	// ligações saem juntas, porque controlar só a escolha deixa a busca sem dono
	// declarado e o campo volta a administrar o próprio texto.
	return o.controlled ? [value, 'let inputValue = $state("");'].join('\n') : value;
}

/**
 * Regra de correspondência própria.
 *
 * O filtro recebe o ITEM inteiro, e não o rótulo: é o que deixa a regra olhar
 * qualquer campo da opção. Aqui ela casa só pelo INÍCIO do rótulo, no lugar do
 * trecho em qualquer posição que o padrão aceita.
 */
function filterBlock(o: Options): string {
	if (!o.customFilter) return '';
	return [
		'const filter: ComboboxFilter = (item, query) =>',
		'  item.label.toLowerCase().startsWith(query.trim().toLowerCase());',
	].join('\n');
}

/** Atributos da raiz. Só o que difere do padrão entra no snippet. */
function rootProps(o: Options): string {
	return attrs(
		'{items}',
		o.controlled ? 'bind:value bind:inputValue' : 'bind:value',
		o.multiple ? 'multiple' : '',
		o.chipsLayout === 'single-line' ? 'chipsLayout="single-line"' : '',
		o.customFilter ? '{filter}' : '',
		o.disabled ? 'disabled' : '',
		o.invalid ? 'invalid' : '',
		o.name ? `name="${o.name}"` : '',
	);
}

/**
 * O miolo do campo: os chips, quando há, e sempre o campo de texto.
 *
 * O `<ComboboxInput>` mora DENTRO de `<ComboboxChips>`, e é por isso que os
 * dois saem daqui juntos: publicar o campo de texto como irmão da caixa de
 * chips faria limpar e gatilho caírem de linha na primeira vez que os chips
 * enchessem a primeira. Sem chips não há caixa, e o campo é filho direto do
 * wrapper — as duas formas valem na folha.
 */
function fieldBlock(o: Options, placeholder: string): string {
	const input = `<ComboboxInput placeholder="${placeholder}" />`;
	if (!o.multiple) return `    ${input}`;
	return `    <ComboboxChips>
      {#each value as chip (chip)}
        <ComboboxChip value={chip}>
          <ComboboxChipRemove />
        </ComboboxChip>
      {/each}
      ${input}
    </ComboboxChips>`;
}

function listBlock(o: Options): string {
	if (o.groups) {
		return `      <ComboboxList>
        {#each groups as group, index (group.label)}
          <ComboboxGroup>
            <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
            {#each group.options as option (option.value)}
              <ComboboxItem value={option.value} label={option.label} />
            {/each}
          </ComboboxGroup>
          {#if index < groups.length - 1}
            <ComboboxSeparator />
          {/if}
        {/each}
      </ComboboxList>`;
	}
	return `      <ComboboxList>
        {#each items as item (item.value)}
          <ComboboxItem value={item.value} label={item.label} />
        {/each}
      </ComboboxList>`;
}

/** A composição completa, na ordem do contrato de markup. */
export function comboboxSnippet(o: Options = {}): string {
	const extra = [
		...(o.multiple ? IMPORT_CHIPS : []),
		...(o.groups ? IMPORT_GROUPS : []),
		// O tipo entra na MESMA importação das peças: quem escreve o próprio
		// filtro precisa da assinatura publicada, e não de uma anotação inventada.
		...(o.customFilter ? ['type ComboboxFilter'] : []),
	];
	const label = o.label ?? 'País';
	const placeholder = o.placeholder ?? 'Buscar país';

	return svelteSnippet(
		[importBlock(extra), itemsBlock(o), filterBlock(o), valueBlock(o)]
			.filter(Boolean)
			.join('\n\n'),
		`<Combobox${rootProps(o)}>
  <ComboboxLabel>${label}</ComboboxLabel>
  <ComboboxInputWrapper>
${fieldBlock(o, placeholder)}
    <ComboboxClear aria-label="Limpar" />
    <ComboboxTrigger aria-label="Abrir lista" />
  </ComboboxInputWrapper>
  <ComboboxPositioner>
    <ComboboxPopup>
${listBlock(o)}
      <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
    </ComboboxPopup>
  </ComboboxPositioner>
</Combobox>`,
	);
}

/** Transform do `meta` — acompanha os controls do Playground. */
export function comboboxSource(
	_generated?: string,
	ctx?: { args?: Partial<ComboboxArgs> },
): string {
	const { label, placeholder, multiple, disabled, invalid, name } = ctx?.args ?? {};
	return comboboxSnippet({
		label,
		placeholder,
		multiple,
		disabled,
		invalid,
		name,
		elideOptions: multiple,
	});
}

/** Múltipla escolha: cada escolhido vira um chip dentro do campo. */
export function comboboxMultipleSource(): string {
	return comboboxSnippet({
		label: 'Tecnologias',
		placeholder: 'Adicionar tecnologia',
		multiple: true,
		name: 'tecnologias',
		elideOptions: true,
	});
}

/** Lista agrupada: cabeçalho por categoria e divisor entre os blocos. */
export function comboboxGroupedSource(): string {
	return comboboxSnippet({
		label: 'Ingrediente',
		placeholder: 'Buscar ingrediente',
		groups: GROCERIES,
	});
}

/** Lista aberta com opção ativa — a composição não muda, só o estado na tela. */
export function comboboxOpenSource(): string {
	return comboboxSnippet();
}

/** Busca sem correspondência: a mensagem de vazio toma o lugar das opções. */
export function comboboxEmptySource(): string {
	return comboboxSnippet();
}

/**
 * Chips numa linha só: o conjunto rola na horizontal e limpar e gatilho não
 * descem de linha quando os escolhidos passam da largura do campo.
 */
export function comboboxSingleLineChipsSource(): string {
	return comboboxSnippet({
		label: 'Países visitados',
		placeholder: 'Adicionar país',
		multiple: true,
		chipsLayout: 'single-line',
		name: 'visitados',
	});
}

/** Regra de correspondência própria: casa só pelo início do rótulo. */
export function comboboxCustomFilterSource(): string {
	return comboboxSnippet({ customFilter: true });
}

/** Escolha e texto de busca controlados por fora, os dois por ligação. */
export function comboboxControlledSource(): string {
	return comboboxSnippet({ controlled: true });
}

/** Indisponível: nada recebe foco e a lista não abre. */
export function comboboxDisabledSource(): string {
	return comboboxSnippet({ disabled: true });
}

/** Reprovado pela validação: o campo se anuncia com erro e a borda muda. */
export function comboboxInvalidSource(): string {
	return comboboxSnippet({ invalid: true });
}
