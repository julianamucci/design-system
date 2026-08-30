// Snippet do painel Code do Combobox.
//
// O painel imprime o `template` da story como está escrito — com o `@for` que
// monta as opções e com `[value]` ligado a um armazém de módulo. Isso é o
// andaime da story, não o que alguém escreve para usar o campo. Estas funções
// devolvem o uso real, com os valores atuais dos controls já resolvidos.
//
// Vive num arquivo próprio, e não solto na story, porque três arquivos de story
// mostram o mesmo componente: repetir o construtor em cada um é como as três
// cópias divergem sem ninguém notar.

export type ComboboxSnippetOptions = {
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  /** Nome acessível do botão que limpa tudo. Vazio, o botão sai do snippet. */
  clearLabel?: string;
  /** Nome acessível do botão que abre a lista. */
  triggerLabel?: string;
  /** Texto da mensagem de lista vazia. */
  emptyMessage?: string;
  /**
   * Forma dos chips no campo. Só aparece no snippet quando difere do padrão —
   * e só tem efeito no modo múltiplo, que é quem tem chips.
   */
  chipsLayout?: 'wrap' | 'single-line';
  /** Rótulos das opções. O valor sai do rótulo em minúsculas, como nas stories. */
  items?: string[];
  /** Opções agrupadas: cada chave vira um cabeçalho na lista. */
  groups?: Record<string, string[]>;
};

/** O valor de uma opção, derivado do rótulo — sem acento e sem caixa alta. */
function toValue(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-');
}

/** Uma `<div ndsComboboxItem>` com a marca de escolhido, já indentada. */
function itemLine(label: string, indent: string): string {
  return [
    `${indent}<div ndsComboboxItem value="${toValue(label)}">`,
    `${indent}  ${label}`,
    `${indent}  <span ndsComboboxItemIndicator></span>`,
    `${indent}</div>`,
  ].join('\n');
}

/** O miolo da lista: opções soltas, ou grupos com cabeçalho e divisor. */
function listBody(options: ComboboxSnippetOptions): string {
  if (options.groups) {
    const names = Object.keys(options.groups);
    return names
      .map((name, index) => {
        const heading = `          <div ndsComboboxGroup>\n            <div ndsComboboxGroupLabel>${name}</div>`;
        const items = options.groups![name].map((label) => itemLine(label, '            ')).join('\n');
        const separator = index < names.length - 1 ? '\n          <div ndsComboboxSeparator></div>' : '';
        return `${heading}\n${items}\n          </div>${separator}`;
      })
      .join('\n');
  }

  const labels = options.items ?? ['Brasil', 'Portugal', 'Espanha'];
  return labels.map((label) => itemLine(label, '          ')).join('\n');
}

/** O uso real do campo, com só o que difere do padrão. */
export function comboboxSnippet(options: ComboboxSnippetOptions = {}): string {
  const {
    label = 'País',
    placeholder = 'Buscar país',
    multiple = false,
    disabled = false,
    invalid = false,
    name,
    chipsLayout = 'wrap',
    clearLabel = 'Limpar',
    triggerLabel = 'Abrir lista',
    emptyMessage = 'Nenhum resultado',
  } = options;

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia.
  const root = ['<nds-combobox [(value)]="value"']
    .concat(multiple ? ['multiple'] : [])
    .concat(chipsLayout === 'single-line' ? [`chipsLayout="${chipsLayout}"`] : [])
    .concat(disabled ? ['disabled'] : [])
    .concat(invalid ? ['invalid'] : [])
    .concat(name ? [`name="${name}"`] : [])
    .join(' ');

  // O `<input>` mora DENTRO da caixa de chips, e não ao lado dela: é o que mantém
  // o texto fluindo depois do último chip e deixa limpar e gatilho FORA do que
  // quebra de linha. No modo simples não há caixa de chips, e o campo de texto é
  // filho direto do wrapper.
  const inputLine = (indent: string) =>
    `${indent}<input ndsComboboxInput placeholder="${placeholder}" />`;

  const field = multiple
    ? [
        '        <div ndsComboboxChips>',
        '          @for (chosen of value(); track chosen) {',
        '            <span ndsComboboxChip [value]="chosen">',
        '              {{ labelOf(chosen) }}',
        `              <button ndsComboboxChipRemove [attr.aria-label]="'Remover ' + labelOf(chosen)"></button>`,
        '            </span>',
        '          }',
        inputLine('          '),
        '        </div>',
      ].join('\n')
    : inputLine('        ');

  const body = multiple
    ? `  readonly value = signal<string[]>([]);

  labelOf(value: string): string {
    return this.items.find((item) => item.value === value)?.label ?? value;
  }`
    : `  readonly value = signal<string | undefined>(undefined);`;

  return `import { NDS_COMBOBOX } from '@/components/ui/combobox';

@Component({
  imports: [...NDS_COMBOBOX],
  template: \`
    ${root}>
      <label ndsComboboxLabel>${label}</label>

      <div ndsComboboxInputWrapper>
${field}
        <button ndsComboboxClear aria-label="${clearLabel}"></button>
        <button ndsComboboxTrigger aria-label="${triggerLabel}">
          <svg ndsComboboxIcon></svg>
        </button>
      </div>

      <ng-template ndsComboboxPopup>
        <div ndsComboboxList>
${listBody(options)}
        </div>
        <div ndsComboboxEmpty>${emptyMessage}</div>
      </ng-template>
    </nds-combobox>
  \`,
})
export class Example {
${body}
}`;
}

/** Transform do `meta` — lê os controls do Playground. */
export function comboboxSource(
  _generated: string,
  context: { args?: Record<string, unknown> } = {},
): string {
  const args = context.args ?? {};
  return comboboxSnippet({
    label: args['label'] as string | undefined,
    placeholder: args['placeholder'] as string | undefined,
    multiple: args['multiple'] as boolean | undefined,
    disabled: args['disabled'] as boolean | undefined,
    invalid: args['invalid'] as boolean | undefined,
    name: args['name'] as string | undefined,
    items: ['Brasil', 'Argentina', 'Chile'],
  });
}


/**
 * Os nove países da spec — a mesma lista que as stories mostram.
 *
 * O snippet enumera o que está na tela: reduzir a três esconderia justamente os
 * rótulos que a story de filtro usa para separar o predicado do consumidor do
 * comportamento de fábrica.
 */
const COUNTRY_LABELS = [
  'Brasil', 'Argentina', 'Chile', 'Colômbia', 'México',
  'Peru', 'Portugal', 'Espanha', 'Uruguai',
];

/**
 * O campo com um filtro do CONSUMIDOR.
 *
 * A assinatura é de TRÊS argumentos — o valor cru do item, o texto digitado e o
 * resolvedor que converte valor em texto de exibição. Quem copia precisa ver os
 * três: escrever o predicado com dois parâmetros compila, e o rótulo nunca
 * entra na comparação.
 *
 * O tipo vem de `@/components/ui/combobox`, e não do pacote por baixo. Quem
 * copia importa do design system: um caminho de lib headless no painel Code
 * apareceria na documentação como se fosse API pública daqui, e passaria a
 * valer como contrato no dia em que a lib mudasse de nome.
 */
export function comboboxCustomFilterSnippet(): string {
  return `import { NDS_COMBOBOX } from '@/components/ui/combobox';
import type { ComboboxFilter } from '@/components/ui/combobox';

/** Texto sem acento e em caixa baixa — a base de comparação do filtro. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\\p{Diacritic}/gu, '').toLowerCase();
}

// A opção é registrada por STRING, então o primeiro argumento chega como o
// VALOR ('argentina'), e não como o objeto com o rótulo. Quem sabe devolver o
// texto de exibição é o \`itemToString\` que a própria lib passa.
const startsWithFilter: ComboboxFilter = (itemValue, query, itemToString) => {
  const label = itemToString?.(itemValue) ?? String(itemValue ?? '');
  return normalize(label).startsWith(normalize(query));
};

@Component({
  imports: [...NDS_COMBOBOX],
  template: \`
    <nds-combobox [(value)]="value" [filter]="filter">
      <label ndsComboboxLabel>País</label>

      <div ndsComboboxInputWrapper>
        <input ndsComboboxInput placeholder="Buscar país" />
        <button ndsComboboxClear aria-label="Limpar"></button>
        <button ndsComboboxTrigger aria-label="Abrir lista">
          <svg ndsComboboxIcon></svg>
        </button>
      </div>

      <ng-template ndsComboboxPopup>
        <div ndsComboboxList>
${listBody({ items: COUNTRY_LABELS })}
        </div>
        <div ndsComboboxEmpty>Nenhum resultado</div>
      </ng-template>
    </nds-combobox>
  \`,
})
export class Example {
  readonly value = signal<string | undefined>(undefined);
  readonly filter = startsWithFilter;
}`;
}

/**
 * O campo com a escolha E o texto de busca controlados por fora.
 *
 * As duas pontas são models da diretiva de host: ligadas só de ida, o campo
 * avisa a mudança pelo evento e quem manda no que aparece é o estado de fora. É
 * o que permite preencher a busca sem ninguém digitar.
 */
export function comboboxControlledSnippet(): string {
  return `import { NDS_COMBOBOX } from '@/components/ui/combobox';

@Component({
  imports: [...NDS_COMBOBOX],
  template: \`
    <nds-combobox
      name="pais"
      [value]="chosen()"
      (valueChange)="onValueChange($event)"
      [inputValue]="query()"
      (inputValueChange)="query.set($event)"
    >
      <label ndsComboboxLabel>País</label>

      <div ndsComboboxInputWrapper>
        <input ndsComboboxInput placeholder="Buscar país" />
        <button ndsComboboxClear aria-label="Limpar"></button>
        <button ndsComboboxTrigger aria-label="Abrir lista">
          <svg ndsComboboxIcon></svg>
        </button>
      </div>

      <ng-template ndsComboboxPopup>
        <div ndsComboboxList>
${listBody({ items: COUNTRY_LABELS })}
        </div>
        <div ndsComboboxEmpty>Nenhum resultado</div>
      </ng-template>
    </nds-combobox>
  \`,
})
export class Example {
  // Sinais, e não campos comuns: sem zone.js é a escrita no sinal que agenda o
  // redesenho. Escrever num campo comum muda o estado e não muda a tela.
  readonly chosen = signal<string | null>(null);
  readonly query = signal('');

  onValueChange(value: unknown): void {
    this.chosen.set((value as string | null) ?? null);
  }
}`;
}
