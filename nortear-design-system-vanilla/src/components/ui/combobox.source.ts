// Snippet do painel Code do Combobox — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ComboboxSnippetOptions = {
  label?: string;
  placeholder?: string;
  multiple?: boolean;
  defaultValue?: string[];
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  /** Rótulos dos itens. O `value` sai do rótulo em minúsculas, como nas stories. */
  items?: string[];
  /** Itens agrupados: cada chave vira um cabeçalho no popup. */
  groups?: Record<string, string[]>;
};

/** Um item da lista, na forma que a fábrica recebe. */
function item(label: string, group?: string): string {
  const value = label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const parts = [`value: ${text(value)}`, `label: ${text(label)}`];
  if (group) parts.push(`group: ${text(group)}`);
  return `  { ${parts.join(', ')} },`;
}

/** A chamada real de `createCombobox` com as opções da story. */
export function comboboxSnippet(o: ComboboxSnippetOptions = {}): string {
  const itemLines: string[] = [];

  if (o.groups) {
    for (const [group, labels] of Object.entries(o.groups)) {
      for (const label of labels) itemLines.push(item(label, group));
    }
  } else {
    for (const label of o.items ?? ['Brasil', 'Portugal', 'Espanha']) {
      itemLines.push(item(label));
    }
  }

  const lines = options([
    ['items', 'items'],
    ['label', o.label ? text(o.label) : undefined],
    ['placeholder', o.placeholder ? text(o.placeholder) : undefined],
    // Só o que difere do padrão da fábrica entra: escrever `multiple: false`
    // ensinaria uma opção que não muda nada.
    ['multiple', o.multiple ? 'true' : undefined],
    [
      'defaultValue',
      o.defaultValue?.length
        ? `[${o.defaultValue.map((v) => text(v)).join(', ')}]`
        : undefined,
    ],
    ['disabled', o.disabled ? 'true' : undefined],
    ['invalid', o.invalid ? 'true' : undefined],
    ['name', o.name ? text(o.name) : undefined],
    ['onValueChange', '(value) => console.log(value)'],
  ]);

  return snippet(
    importing('combobox', 'createCombobox'),
    '',
    `const items = [\n${itemLines.join('\n')}\n];`,
    '',
    chamada('createCombobox', lines),
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
    disabled: args.disabled as boolean | undefined,
    invalid: args.invalid as boolean | undefined,
    name: args.name as string | undefined,
  });
};
