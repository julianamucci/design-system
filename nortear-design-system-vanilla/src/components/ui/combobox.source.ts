// Snippet do painel Code do Combobox — ver `@/lib/story-source`.
//
// Toda transform daqui é função EXPORTADA, e nunca lambda declarada dentro da
// story: a saída do painel não entra no DOM durante a `play`, então só a função
// exportada tem como ser medida — e quem a mede é `combobox.source.test.ts`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/** Forma dos chips no campo — a mesma união que a fábrica aceita. */
export type ComboboxChipsLayoutSnippet = 'wrap' | 'single-line';

export type ComboboxSnippetOptions = {
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  /** `wrap` é o padrão da fábrica e por isso não entra no snippet. */
  chipsLayout?: ComboboxChipsLayoutSnippet;
  defaultValue?: string[];
  /** Escolha em modo CONTROLADO — só o snippet do controlado a usa. */
  value?: string[];
  /** Texto de busca em modo CONTROLADO — só o snippet do controlado o usa. */
  inputValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  /** Rótulos dos itens. O `value` sai do rótulo em minúsculas, como nas stories. */
  items?: string[];
  /** Itens agrupados: cada chave vira um cabeçalho no popup. */
  groups?: Record<string, string[]>;
};

/** Lista canônica quando a story não passa a dela. */
const ITEMS_DEFAULT = ['Brasil', 'Portugal', 'Espanha'];

/** Um item da lista, na forma que a fábrica recebe. */
function item(label: string, group?: string): string {
  const value = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const parts = [`value: ${text(value)}`, `label: ${text(label)}`];
  if (group) parts.push(`group: ${text(group)}`);
  return `  { ${parts.join(', ')} },`;
}

/**
 * O bloco `const items = [ … ]` que antecede a chamada.
 *
 * `typed` anota a lista com `ComboboxItem[]`: vale quando o tipo já foi
 * importado por outro motivo — no snippet do filtro, onde a assinatura do
 * predicado é justamente o assunto.
 */
function itemsBlock(o: ComboboxSnippetOptions, typed = false): string {
  const lines: string[] = [];

  if (o.groups) {
    for (const [group, labels] of Object.entries(o.groups)) {
      for (const label of labels) lines.push(item(label, group));
    }
  } else {
    for (const label of o.items ?? ITEMS_DEFAULT) lines.push(item(label));
  }

  return `const items${typed ? ': ComboboxItem[]' : ''} = [\n${lines.join('\n')}\n];`;
}

/** As opções da fábrica, na ordem em que se lê o componente. */
function fieldLines(o: ComboboxSnippetOptions): Array<[string, string | undefined]> {
  return [
    ['items', 'items'],
    ['label', o.label ? text(o.label) : undefined],
    ['placeholder', o.placeholder ? text(o.placeholder) : undefined],
    // Só o que difere do padrão da fábrica entra: escrever `multiple: false`
    // ensinaria uma opção que não muda nada.
    ['multiple', o.multiple ? 'true' : undefined],
    ['chipsLayout', o.chipsLayout === 'single-line' ? text('single-line') : undefined],
    [
      'defaultValue',
      o.defaultValue?.length ? `[${o.defaultValue.map((v) => text(v)).join(', ')}]` : undefined,
    ],
    ['disabled', o.disabled ? 'true' : undefined],
    ['invalid', o.invalid ? 'true' : undefined],
    ['name', o.name ? text(o.name) : undefined],
  ];
}

/** A chamada real de `createCombobox` com as opções da story. */
export function comboboxSnippet(o: ComboboxSnippetOptions = {}): string {
  const lines = options([...fieldLines(o), ['onValueChange', '(value) => console.log(value)']]);

  return snippet(
    importing('combobox', 'createCombobox'),
    itemsBlock(o),
    `const combobox = ${chamada('createCombobox', lines)};`,
    montar('combobox'),
  );
}

/**
 * O campo com filtro próprio.
 *
 * Forma própria porque o assunto é a ASSINATURA publicada — `(item, query) =>
 * boolean`, com o texto chegando CRU. É exatamente onde alguém copiaria a
 * assinatura errada, então ela aparece anotada, e a normalização aparece do
 * lado de fora, que é de quem filtra.
 */
export function filterComboboxSnippet(o: ComboboxSnippetOptions = {}): string {
  const opts: ComboboxSnippetOptions = {
    label: 'País',
    placeholder: 'Buscar país',
    name: 'pais',
    ...o,
  };

  const predicate = [
    '(item: ComboboxItem, query: string) =>',
    '    withoutAccent(item.label).startsWith(withoutAccent(query))',
  ].join('\n');

  const lines = options([
    ...fieldLines(opts),
    ['filter', predicate],
    ['onValueChange', '(value) => console.log(value)'],
  ]);

  const normalizer = [
    '// O texto digitado chega CRU: normalizar, casar por sinônimo ou por código',
    '// interno passa a ser decisão de quem filtra.',
    'const withoutAccent = (value: string) =>',
    "  value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();",
  ].join('\n');

  return snippet(
    importing('combobox', 'createCombobox', 'type ComboboxItem'),
    itemsBlock(opts, true),
    normalizer,
    `const combobox = ${chamada('createCombobox', lines)};`,
    montar('combobox'),
  );
}

/**
 * O campo em modo CONTROLADO.
 *
 * Forma própria porque numa fábrica não há re-render de framework: o que faz o
 * modo controlado existir são os dois verbos do elemento devolvido. Sem
 * `setValue` e `setInputValue` no snippet, quem copia monta um campo que
 * anuncia a intenção e nunca se move.
 */
export function controlledComboboxSnippet(o: ComboboxSnippetOptions = {}): string {
  const opts: ComboboxSnippetOptions = {
    label: 'Países',
    placeholder: 'Adicionar país',
    multiple: true,
    name: 'paises',
    items: ['Brasil', 'Argentina', 'Chile', 'Colômbia'],
    value: ['brasil'],
    inputValue: '',
    ...o,
  };

  const lines = options([
    ['items', 'items'],
    ['label', opts.label ? text(opts.label) : undefined],
    ['placeholder', opts.placeholder ? text(opts.placeholder) : undefined],
    ['multiple', opts.multiple ? 'true' : undefined],
    ['name', opts.name ? text(opts.name) : undefined],
    // Passar `value` e `inputValue` é o que tira a posse do estado da fábrica.
    ['value', 'value'],
    ['inputValue', 'inputValue'],
    ['onValueChange', '(next) => {\n    value = next;\n    combobox.setValue(value);\n  }'],
    [
      'onInputValueChange',
      '(next) => {\n    inputValue = next;\n    combobox.setInputValue(inputValue);\n  }',
    ],
  ]);

  const owner = [
    '// Quem manda é dono do estado: escolher e digitar apenas ANUNCIAM, e a tela',
    '// só se move quando a resposta volta por `setValue` / `setInputValue`.',
    `let value = [${(opts.value ?? []).map((v) => text(v)).join(', ')}];`,
    `let inputValue = ${text(opts.inputValue ?? '')};`,
  ].join('\n');

  return snippet(
    importing('combobox', 'createCombobox'),
    itemsBlock(opts),
    owner,
    `const combobox = ${chamada('createCombobox', lines)};`,
    montar('combobox'),
  );
}

/** Transform do `meta` — lê os controls do Playground. */
export const comboboxSource: SourceTransform = (_gerado, ctx) => {
  const args = (ctx?.args ?? {}) as Record<string, unknown>;
  return comboboxSnippet({
    label: args.label as string | undefined,
    placeholder: args.placeholder as string | undefined,
    multiple: args.multiple as boolean | undefined,
    chipsLayout: args.chipsLayout as ComboboxChipsLayoutSnippet | undefined,
    disabled: args.disabled as boolean | undefined,
    invalid: args.invalid as boolean | undefined,
    name: args.name as string | undefined,
  });
};

/**
 * Transform de story ou de `meta`: mesma fábrica, opções fixas que os controls
 * não cobrem. Fechar sobre as opções mantém a transform EXPORTADA — é o que a
 * deixa testável, e é por isso que ela não vira lambda dentro da story.
 */
export function comboboxSourceWith(fixed: ComboboxSnippetOptions): SourceTransform {
  return (_gerado, ctx) =>
    comboboxSnippet({ ...((ctx?.args ?? {}) as ComboboxSnippetOptions), ...fixed });
}

/** Transform de story para o campo com filtro próprio. */
export function filterComboboxSource(fixed: ComboboxSnippetOptions = {}): SourceTransform {
  return () => filterComboboxSnippet(fixed);
}

/** Transform de story para o campo em modo controlado. */
export function controlledComboboxSource(fixed: ComboboxSnippetOptions = {}): SourceTransform {
  return () => controlledComboboxSnippet(fixed);
}
