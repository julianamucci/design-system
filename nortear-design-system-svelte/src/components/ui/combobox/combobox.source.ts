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
	chipsLayout: 'wrap' | 'single-line';
	disabled: boolean;
	invalid: boolean;
	name?: string;
};

type Option = { value: string; label: string };
type Group = { label: string; options: Option[] };

// ─── As listas das stories ────────────────────────────────────────────────────
//
// Cada snippet publica a MESMA lista que a story ao lado mostra: copiar o
// código e ver outra coisa na tela é o que faz quem lê desconfiar dos dois.

/** As quatro das formas de escolha única, dos estados e da lista aberta. */
const COUNTRIES: Option[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'portugal', label: 'Portugal' },
];

/** A lista inteira da spec de exemplos — Playground e múltipla com chips. */
const ALL_COUNTRIES: Option[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'colombia', label: 'Colômbia' },
	{ value: 'mexico', label: 'México' },
	{ value: 'peru', label: 'Peru' },
	{ value: 'portugal', label: 'Portugal' },
	{ value: 'espanha', label: 'Espanha' },
	{ value: 'uruguai', label: 'Uruguai' },
];

/** Longa de propósito: seis escolhidos não cabem numa linha do campo. */
const VISITED: Option[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'colombia', label: 'Colômbia' },
	{ value: 'mexico', label: 'México' },
	{ value: 'portugal', label: 'Portugal' },
	{ value: 'uruguai', label: 'Uruguai' },
];

/**
 * A das composições. "Uruguai" é o motivo: o filtro padrão a acha por "guai",
 * no MEIO da palavra, e a regra própria não — sem ela a diferença que a story
 * demonstra não se reproduz no código copiado.
 */
const COMPOSITION_COUNTRIES: Option[] = [
	{ value: 'brasil', label: 'Brasil' },
	{ value: 'argentina', label: 'Argentina' },
	{ value: 'chile', label: 'Chile' },
	{ value: 'portugal', label: 'Portugal' },
	{ value: 'uruguai', label: 'Uruguai' },
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
	/** Escolhidos iniciais do modo múltiplo — os chips que a story já mostra. */
	initialValue?: string[];
	/**
	 * Como os chips ocupam o campo. Só `single-line` entra no snippet, e só no
	 * modo múltiplo: repetir o padrão, ou escrever um modo de chips num campo que
	 * não tem chip, ensina ruído a quem copia.
	 */
	chipsLayout?: 'wrap' | 'single-line';
	/** Regra de correspondência própria, no lugar do filtro padrão. */
	customFilter?: boolean;
	/** Escolha E texto de busca controlados por fora, os dois por ligação. */
	controlled?: boolean;
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

/**
 * O texto da busca sai do campo quando alguém de fora precisa dele: no modo
 * controlado, porque é do consumidor; na lista agrupada, porque é ele que
 * decide qual grupo ainda tem opção para mostrar.
 */
function bindsInputValue(o: Options): boolean {
	return Boolean(o.controlled || o.groups);
}

/** Estado da escolha: texto no modo simples, lista de textos no múltiplo. */
function valueBlock(o: Options): string {
	const initial = (o.initialValue ?? []).map((entry) => `"${entry}"`).join(', ');
	const value = o.multiple
		? `let value = $state<string[]>([${initial}]);`
		: 'let value = $state("");';
	// No modo controlado o TEXTO da busca também é do consumidor: as duas
	// ligações saem juntas, porque controlar só a escolha deixa a busca sem dono
	// declarado e o campo volta a administrar o próprio texto.
	return bindsInputValue(o) ? [value, 'let inputValue = $state("");'].join('\n') : value;
}

/**
 * Os grupos que ainda têm opção depois do texto digitado.
 *
 * Cada opção se esconde sozinha, mas o grupo não: sem esta conta, digitar
 * "ban" deixava o cabeçalho "Legumes" na tela sem nenhuma opção embaixo — o
 * defeito clássico de filtrar item a item, que a story ao lado evita e o
 * snippet ensinava. A conta é a MESMA que a peça usa para se esconder.
 */
function visibleGroupsBlock(o: Options): string {
	if (!o.groups) return '';
	return [
		'const visibleGroups = $derived(',
		'  groups.filter((group) => filterItems(group.options, inputValue).length > 0),',
		');',
	].join('\n');
}

/**
 * Regra de correspondência própria.
 *
 * O filtro recebe o ITEM inteiro, e não o rótulo: é o que deixa a regra olhar
 * qualquer campo da opção. Aqui ela casa só pelo INÍCIO do rótulo, no lugar do
 * trecho em qualquer posição que o padrão aceita — e continua sem acento e sem
 * caixa, como o padrão e como a regra da story, pela mesma `normalizeText` que
 * os dois usam: com `toLowerCase` a cópia deixaria de achar "Mexico" em
 * "México", e ninguém veria na story, que não tem essa diferença.
 */
function filterBlock(o: Options): string {
	if (!o.customFilter) return '';
	return [
		'const filter: ComboboxFilter = (item, query) =>',
		'  normalizeText(item.label).startsWith(normalizeText(query.trim()));',
	].join('\n');
}

/** Atributos da raiz. Só o que difere do padrão entra no snippet. */
function rootProps(o: Options): string {
	return attrs(
		'{items}',
		bindsInputValue(o) ? 'bind:value bind:inputValue' : 'bind:value',
		o.multiple ? 'multiple' : '',
		o.multiple && o.chipsLayout === 'single-line' ? 'chipsLayout="single-line"' : '',
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
        {#each visibleGroups as group, index (group.label)}
          <ComboboxGroup>
            <ComboboxGroupLabel>{group.label}</ComboboxGroupLabel>
            {#each group.options as option (option.value)}
              <ComboboxItem value={option.value} label={option.label} />
            {/each}
          </ComboboxGroup>
          {#if index < visibleGroups.length - 1}
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
		...(o.groups ? [...IMPORT_GROUPS, 'filterItems'] : []),
		// O tipo entra na MESMA importação das peças: quem escreve o próprio
		// filtro precisa da assinatura publicada, e não de uma anotação inventada.
		...(o.customFilter ? ['normalizeText', 'type ComboboxFilter'] : []),
	];
	const label = o.label ?? 'País';
	const placeholder = o.placeholder ?? 'Buscar país';

	return svelteSnippet(
		[importBlock(extra), itemsBlock(o), filterBlock(o), valueBlock(o), visibleGroupsBlock(o)]
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
	const { label, placeholder, multiple, chipsLayout, disabled, invalid, name } = ctx?.args ?? {};
	return comboboxSnippet({
		label,
		placeholder,
		multiple,
		chipsLayout,
		disabled,
		invalid,
		name,
		options: ALL_COUNTRIES,
	});
}

/** Múltipla escolha: cada escolhido vira um chip dentro do campo. */
export function comboboxMultipleSource(): string {
	return comboboxSnippet({
		label: 'Países',
		placeholder: 'Adicionar país',
		multiple: true,
		name: 'paises',
		options: ALL_COUNTRIES,
		initialValue: ['brasil', 'argentina'],
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
		options: VISITED,
		// Os seis que passam da largura do campo: sem eles o snippet monta um
		// campo vazio, e a linha única não tem o que demonstrar.
		initialValue: ['brasil', 'argentina', 'chile', 'colombia', 'mexico', 'portugal'],
	});
}

/** Regra de correspondência própria: casa só pelo início do rótulo. */
export function comboboxCustomFilterSource(): string {
	return comboboxSnippet({ customFilter: true, options: COMPOSITION_COUNTRIES });
}

/** Escolha e texto de busca controlados por fora, os dois por ligação. */
export function comboboxControlledSource(): string {
	return comboboxSnippet({ controlled: true, options: COMPOSITION_COUNTRIES });
}

/** Indisponível: nada recebe foco e a lista não abre. */
export function comboboxDisabledSource(): string {
	return comboboxSnippet({ disabled: true });
}

/** Reprovado pela validação: o campo se anuncia com erro e a borda muda. */
export function comboboxInvalidSource(): string {
	return comboboxSnippet({ invalid: true });
}
