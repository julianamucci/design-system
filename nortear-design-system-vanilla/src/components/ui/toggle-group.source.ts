// Snippet do painel Code do Toggle Group — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';
import type { ToggleGroupOrientation, ToggleGroupOptions } from './toggle-group';
import type { ToggleSize, ToggleVariant } from './toggle';

/** Item como o snippet o mostra. `icon` é o nome do ícone lucide. */
export type ToggleGroupSnippetItem = {
  value: string;
  /** Texto do item. `children` da fábrica só aceita string. */
  children?: string;
  icon?: string;
  'aria-label'?: string;
  disabled?: boolean;
};

/** Chaves iguais às dos args da story — `{ ...ctx.args }` entra sem tradução. */
export type ToggleGroupSnippetOptions = {
  type?: ToggleGroupOptions['type'];
  variant?: ToggleVariant;
  size?: ToggleSize;
  orientation?: ToggleGroupOrientation;
  spacing?: number;
  disabled?: boolean;
  'aria-label'?: string;
  items?: ToggleGroupSnippetItem[];
  /** `null` = nenhum item nasce ativo, e a opção sai do snippet. */
  defaultValue?: string | string[] | null;
  /** Expressão do callback, quando a story o exercita. */
  onValueChange?: string;
};

/** O grupo canônico do componente: a barra de alinhamento de texto. */
const ITEMS_DEFAULT: ToggleGroupSnippetItem[] = [
  { value: 'left', icon: 'AlignLeft', 'aria-label': 'Alinhar à esquerda' },
  { value: 'center', icon: 'AlignCenter', 'aria-label': 'Centralizar' },
  { value: 'right', icon: 'AlignRight', 'aria-label': 'Alinhar à direita' },
];

function valueLiteral(v: string | string[]): string {
  return Array.isArray(v) ? `[${v.map(texto).join(', ')}]` : texto(v);
}

/** A chamada real de `createToggleGroup` com as opções da story. */
export function toggleGroupSnippet(o: ToggleGroupSnippetOptions = {}): string {
  const itens = o.items ?? ITEMS_DEFAULT;
  const tipo = o.type ?? 'single';
  const withIcon = itens.some((i) => i.icon);

  const linesItems = itens.map((i) => {
    const fields = opcoes([
      ['value', texto(i.value)],
      // O item só de ícone não tem texto: `children` fica vazio e o nome
      // acessível é o que o leitor anuncia.
      ['children', texto(i.children ?? (i.icon ? '' : i.value))],
      ['aria-label', i['aria-label'] ? texto(i['aria-label']) : undefined],
      ['disabled', i.disabled ? 'true' : undefined],
    ]);
    return `  { ${fields.map((c) => c.replace(/,$/, '')).join(', ')} },`;
  });

  const padrao =
    o.defaultValue === null ? undefined : (o.defaultValue ?? (tipo === 'single' ? 'left' : ['left']));
  // A apresentação canônica do grupo é a contornada — é a que todas as stories
  // usam, e o que emenda os cantos internos num bloco só.
  const variante = o.variant ?? 'outline';

  // `items` entra abreviado: a variável já tem o nome da opção, e `items: items`
  // só faria barulho no snippet.
  const lines = [
    'items,',
    ...opcoes([
      // `role="toolbar"` sem nome é anunciado como "barra de ferramentas" e nada
      // mais — por isso o nome do grupo entra sempre.
      ['aria-label', texto(o['aria-label'] ?? 'Alinhamento do texto')],
      ['type', tipo !== 'single' ? texto(tipo) : undefined],
      ['variant', variante !== 'default' ? texto(variante) : undefined],
      ['size', o.size && o.size !== 'default' ? texto(o.size) : undefined],
      ['orientation', o.orientation && o.orientation !== 'horizontal' ? texto(o.orientation) : undefined],
      ['spacing', o.spacing ? String(o.spacing) : undefined],
      ['disabled', o.disabled ? 'true' : undefined],
      ['defaultValue', padrao === undefined ? undefined : valueLiteral(padrao)],
      ['onValueChange', o.onValueChange],
    ]),
  ];

  const icons = itens.map((i) => i.icon).filter((n): n is string => Boolean(n));

  return snippet(
    [
      importing('toggle-group', 'createToggleGroup', 'type ToggleGroupItem'),
      withIcon ? `import { ${[...new Set(icons)].join(', ')}, createElement } from 'lucide';` : undefined,
    ]
      .filter(Boolean)
      .join('\n'),
    `const items: ToggleGroupItem[] = [\n${linesItems.join('\n')}\n];`,
    `const grupo = ${chamada('createToggleGroup', lines)};`,
    // `ToggleGroupItem.children` é `string`: o ícone não cabe na chamada, e
    // quem consome o coloca no botão do item depois de construir o grupo.
    withIcon
      ? `// \`children\` do item aceita só texto — o ícone entra no botão do item.
const icones = [${[...icons].join(', ')}];
grupo.querySelectorAll('[data-slot="toggle"]').forEach((botao, i) => {
  botao.append(createElement(icones[i]));
});`
      : undefined,
    montar('grupo'),
  );
}

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const toggleGroupSource: SourceTransform<ToggleGroupSnippetOptions> = (_gerado, ctx) =>
  toggleGroupSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function toggleGroupSourceWith(
  fixas: ToggleGroupSnippetOptions,
): SourceTransform<ToggleGroupSnippetOptions> {
  return (_gerado, ctx) => toggleGroupSnippet({ ...ctx.args, ...fixas });
}
