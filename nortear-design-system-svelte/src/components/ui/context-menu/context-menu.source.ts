/**
 * Transforms do painel Code do ContextMenu.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * Os snippets usam os nomes longos (`ContextMenuTrigger`, `ContextMenuItem`…)
 * porque é essa a API que o `index.ts` publica e por onde quem consome escreve.
 *
 * O conteúdo de cada menu é o do vanilla, que é a referência entre as stacks. E
 * todo rótulo de grupo mora DENTRO do grupo que ele nomeia — `ContextMenuGroup`
 * ou `ContextMenuRadioGroup` —, porque só ali ele vira o nome acessível do
 * bloco. Grupo sem rótulo não entra: não agrupa nada para quem ouve.
 */
import { svelteSnippet } from '@/lib/story-source';
import { contextMenuEntriesState, type ContextMenuDocsEntry } from './context-menu.fixtures';

export type ContextMenuArgs = {
  triggerLabel: string;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
};

/**
 * A moldura tracejada que responde ao gesto.
 *
 * As duas classes de borda são necessárias: `nds-border-default` traz largura e
 * cor, `nds-border-dashed` só troca o estilo do traço. E o quadro não tem
 * altura: ele nasce do `nds-p-8` e cresce junto com a fonte do navegador.
 */
const AREA =
  'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-border-default ' +
  'nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default';

/** Ordem canônica das peças no bloco de import. */
const ORDER = [
  'ContextMenu',
  'ContextMenuTrigger',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuLabel',
  'ContextMenuGroupHeading',
  'ContextMenuItem',
  'ContextMenuCheckboxItem',
  'ContextMenuRadioGroup',
  'ContextMenuRadioItem',
  'ContextMenuSub',
  'ContextMenuSubTrigger',
  'ContextMenuSubContent',
  'ContextMenuSeparator',
  'ContextMenuShortcut',
];

/** Bloco de import, sempre na ordem canônica e só com as peças usadas. */
function importing(parts: string[]): string {
  const used = ORDER.filter((part) => parts.includes(part));
  return `import {
${used.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/context-menu";`;
}

/** Um item do menu, com ou sem atalho ao lado do rótulo. */
function item(
  label: string,
  options: { shortcut?: string; props?: string; indent?: string } = {},
): string {
  const { shortcut, props = '', indent = '    ' } = options;
  if (!shortcut) return `${indent}<ContextMenuItem${props}>${label}</ContextMenuItem>`;
  return `${indent}<ContextMenuItem${props}>
${indent}  ${label}
${indent}  <ContextMenuShortcut>${shortcut}</ContextMenuShortcut>
${indent}</ContextMenuItem>`;
}

/**
 * O gesto e o painel em volta do conteúdo do menu.
 *
 * O conteúdo já chega indentado com quatro espaços.
 */
function menu(content: string, label = 'Clique com o botão direito aqui'): string {
  return `<ContextMenu>
  <ContextMenuTrigger
    class="${AREA}"
    data-align="center"
    data-justify="center"
  >
    ${label}
  </ContextMenuTrigger>
  <ContextMenuContent>
${content}
  </ContextMenuContent>
</ContextMenu>`;
}

/**
 * Forma canônica: duas ações, a divisória e a ação destrutiva. É o conjunto que
 * os controls do Playground ligam e desligam, e cascateia como padrão dos
 * arquivos de estados e composições.
 *
 * A divisória tem control próprio, como no vanilla: ela não some junto com a
 * ação destrutiva, e cada peça sai do import quando sai da marcação.
 */
export function contextMenuSource(
  _generated?: string,
  ctx?: { args?: Partial<ContextMenuArgs> },
): string {
  const {
    triggerLabel = 'Clique com o botão direito aqui',
    showDestructive = true,
    showSeparator = true,
    showShortcuts = true,
  } = ctx?.args ?? {};

  const lines = [
    item('Editar', { shortcut: showShortcuts ? 'Ctrl+E' : undefined }),
    item('Duplicar'),
  ];
  if (showSeparator) lines.push('    <ContextMenuSeparator />');
  if (showDestructive) {
    lines.push(
      item('Excluir', {
        shortcut: showShortcuts ? 'Delete' : undefined,
        props: ' variant="destructive"',
      }),
    );
  }

  const parts = [
    'ContextMenu',
    'ContextMenuTrigger',
    'ContextMenuContent',
    'ContextMenuItem',
    ...(showSeparator ? ['ContextMenuSeparator'] : []),
    ...(showShortcuts ? ['ContextMenuShortcut'] : []),
  ];

  return svelteSnippet(importing(parts), menu(lines.join('\n'), triggerLabel));
}

/** Estado ItemDisabled: o item indisponível não recebe ponteiro nem Enter. */
export function contextMenuItemDisabledSource(): string {
  return svelteSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
    ]),
    menu(`    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem disabled>Duplicar</ContextMenuItem>
    <ContextMenuItem>Renomear</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" disabled>Excluir</ContextMenuItem>`),
  );
}

/**
 * Estado ItemInset: o recuo alinha o rótulo com os itens que têm indicador.
 *
 * Ele empurra só a borda esquerda — a caixa continua encostada à direita, senão
 * o menu ganharia um degrau.
 */
export function contextMenuItemInsetSource(): string {
  return svelteSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuItem',
      'ContextMenuSeparator',
    ]),
    menu(`    <ContextMenuGroup>
      <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
      <ContextMenuItem>Editar</ContextMenuItem>
      <ContextMenuItem inset>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuItem inset variant="destructive">Excluir</ContextMenuItem>`),
  );
}

/** Estado ItemDestructive: a ação perigosa se declara por prop, não por cor. */
export function contextMenuItemDestructiveSource(): string {
  return svelteSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ]),
    menu(`${item('Editar', { shortcut: 'Ctrl+E' })}
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSeparator />
${item('Excluir permanentemente', { shortcut: 'Delete', props: ' variant="destructive"' })}`),
  );
}

/**
 * Estado CheckboxIndeterminate: os três estados de uma marcação.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Sem `indeterminate` os dois sairiam com o mesmo glifo e significados
 * diferentes.
 */
export function contextMenuCheckboxIndeterminateSource(): string {
  return svelteSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuCheckboxItem',
    ]),
    menu(`    <ContextMenuGroup>
      <ContextMenuLabel>Mostrar na tela</ContextMenuLabel>
      <ContextMenuCheckboxItem indeterminate>Colunas</ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem checked>Régua</ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem>Grade</ContextMenuCheckboxItem>
    </ContextMenuGroup>`),
  );
}

/**
 * Estado DarkPalette: o mesmo markup, outra paleta.
 *
 * A troca de tema é global (classe no documento) e não muda uma linha do menu —
 * é exatamente isso que a story mostra.
 */
export function contextMenuDarkPaletteSource(): string {
  return svelteSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
    ]),
    menu(`    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem disabled>Duplicar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>`),
  );
}

/** Composição WithShortcut: o atalho mora dentro do item e é lido junto dele. */
export function contextMenuWithShortcutsSource(): string {
  return svelteSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ]),
    menu(`${item('Editar', { shortcut: 'Ctrl+E' })}
${item('Desfazer', { shortcut: 'Ctrl+Z' })}
    <ContextMenuSeparator />
${item('Excluir', { shortcut: 'Delete', props: ' variant="destructive"' })}`),
  );
}

/**
 * Composição WithCheckbox: cada item guarda a própria marcação, e o rótulo
 * nomeia o grupo. Alternar não fecha o menu.
 */
export function contextMenuWithCheckboxSource(): string {
  return svelteSnippet(
    `${importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuCheckboxItem',
    ])}

let showGrid = $state(false);
let showRulers = $state(true);`,
    menu(`    <ContextMenuGroup>
      <ContextMenuLabel>Visualização</ContextMenuLabel>
      <ContextMenuCheckboxItem bind:checked={showGrid}>
        Mostrar grade
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem bind:checked={showRulers}>
        Mostrar réguas
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>`),
  );
}

/**
 * Composição WithRadioGroup: escolha única, o valor vive no grupo. O grupo de
 * rádio já é um grupo, então o rótulo mora dentro dele e o nomeia direto.
 */
export function contextMenuWithRadioGroupSource(): string {
  return svelteSnippet(
    `${importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuLabel',
      'ContextMenuRadioGroup',
      'ContextMenuRadioItem',
    ])}

let layout = $state('grid');`,
    menu(`    <ContextMenuRadioGroup bind:value={layout}>
      <ContextMenuLabel>Layout</ContextMenuLabel>
      <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
      <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
      <ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>
    </ContextMenuRadioGroup>`),
  );
}

/** Composição WithSubmenu: o segundo nível abre ao lado do item que o dispara. */
export function contextMenuWithSubmenuSource(): string {
  return svelteSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSub',
      'ContextMenuSubTrigger',
      'ContextMenuSubContent',
    ]),
    menu(`    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por e-mail</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>`),
  );
}

// ─── Cards de Variantes da docs page ──────────────────────────────────────────
//
// A forma da lista (`ContextMenuDocsEntry`) e o leitor do estado inicial dela
// (`contextMenuEntriesState`) moram em `context-menu.fixtures.ts`: a docs page
// monta a prévia com eles, e este módulo só exporta construtor de snippet.

/**
 * A lista que `contextMenuEntriesSource` escreve quando ninguém passa outra:
 * a composição completa, com o conteúdo de `contextMenuCompleteSource`.
 *
 * Passa por todo tipo de entrada — item com atalho e destrutivo, divisória,
 * grupo, marcação, grupo de rádio e submenu —, e é por isso que ela é o padrão:
 * a varredura transversal chama o construtor sem argumento e confere que cada
 * `bind:` que a marcação escreve tem a variável declarada no script. É ali que
 * este construtor erraria — o nome da variável sai do `value` (`show-grid` →
 * `showGrid`) nas duas pontas.
 */
const COMPLETE_ENTRIES: ContextMenuDocsEntry[] = [
  {
    type: 'group',
    label: 'Ações',
    items: [
      { type: 'item', label: 'Editar', value: 'edit', shortcut: 'Ctrl+E' },
      {
        type: 'submenu',
        label: 'Compartilhar',
        items: [
          { type: 'item', label: 'Por e-mail', value: 'share-email' },
          { type: 'item', label: 'Por link', value: 'share-link' },
        ],
      },
    ],
  },
  { type: 'separator' },
  {
    type: 'group',
    label: 'Visualização',
    items: [{ type: 'checkbox', label: 'Mostrar grade', value: 'show-grid', checked: true }],
  },
  { type: 'separator' },
  {
    type: 'radio-group',
    label: 'Layout',
    name: 'layout',
    value: 'grid',
    items: [
      { label: 'Grade', value: 'grid' },
      { label: 'Lista', value: 'list' },
    ],
  },
  { type: 'separator' },
  { type: 'item', label: 'Excluir', value: 'delete', shortcut: 'Delete', variant: 'destructive' },
];

/** `show-grid` → `showGrid`: o nome da variável que guarda a marcação. */
function stateName(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

/** As peças que a lista usa, para o bloco de import. */
function entriesParts(entries: ContextMenuDocsEntry[], parts: Set<string>): Set<string> {
  for (const entry of entries) {
    switch (entry.type) {
      case 'item':
        parts.add('ContextMenuItem');
        if (entry.shortcut) parts.add('ContextMenuShortcut');
        break;
      case 'separator':
        parts.add('ContextMenuSeparator');
        break;
      case 'group':
        parts.add('ContextMenuGroup').add('ContextMenuLabel');
        entriesParts(entry.items, parts);
        break;
      case 'checkbox':
        parts.add('ContextMenuCheckboxItem');
        break;
      case 'radio-group':
        parts.add('ContextMenuRadioGroup').add('ContextMenuLabel').add('ContextMenuRadioItem');
        break;
      case 'submenu':
        parts.add('ContextMenuSub').add('ContextMenuSubTrigger').add('ContextMenuSubContent');
        entriesParts(entry.items, parts);
        break;
    }
  }
  return parts;
}

/** Uma entrada por linha, com os filhos recuados dentro da entrada que os abre. */
function entriesMarkup(entries: ContextMenuDocsEntry[], indent: string): string[] {
  return entries.flatMap((entry): string[] => {
    switch (entry.type) {
      case 'item': {
        const props =
          (entry.inset ? ' inset' : '') + (entry.variant ? ` variant="${entry.variant}"` : '');
        return [item(entry.label, { shortcut: entry.shortcut, props, indent })];
      }
      case 'separator':
        return [`${indent}<ContextMenuSeparator />`];
      case 'group':
        return [
          `${indent}<ContextMenuGroup>`,
          `${indent}  <ContextMenuLabel${entry.inset ? ' inset' : ''}>${entry.label}</ContextMenuLabel>`,
          ...entriesMarkup(entry.items, `${indent}  `),
          `${indent}</ContextMenuGroup>`,
        ];
      case 'checkbox':
        return [
          `${indent}<ContextMenuCheckboxItem bind:checked={${stateName(entry.value)}}>`,
          `${indent}  ${entry.label}`,
          `${indent}</ContextMenuCheckboxItem>`,
        ];
      case 'radio-group':
        return [
          `${indent}<ContextMenuRadioGroup bind:value={${entry.name}}>`,
          `${indent}  <ContextMenuLabel>${entry.label}</ContextMenuLabel>`,
          ...entry.items.map(
            (option) =>
              `${indent}  <ContextMenuRadioItem value="${option.value}">${option.label}</ContextMenuRadioItem>`,
          ),
          `${indent}</ContextMenuRadioGroup>`,
        ];
      case 'submenu':
        return [
          `${indent}<ContextMenuSub>`,
          `${indent}  <ContextMenuSubTrigger>${entry.label}</ContextMenuSubTrigger>`,
          `${indent}  <ContextMenuSubContent>`,
          ...entriesMarkup(entry.items, `${indent}    `),
          `${indent}  </ContextMenuSubContent>`,
          `${indent}</ContextMenuSub>`,
        ];
    }
  });
}

/**
 * O código de um card de Variantes, a partir da MESMA lista que monta a prévia
 * — ver `ContextMenuDocsEntry`. O texto da área e os rótulos chegam traduzidos,
 * então o código fala o idioma da prévia nos três idiomas.
 *
 * Sem argumento, escreve `COMPLETE_ENTRIES` com o texto de área canônico: todo
 * `*.source.ts` desta stack se chama sem argumento, e é assim que a varredura
 * transversal alcança o construtor que a docs page usa.
 */
export function contextMenuEntriesSource(
  options: { triggerLabel?: string; entries?: ContextMenuDocsEntry[] } = {},
): string {
  const { triggerLabel = 'Clique com o botão direito aqui', entries = COMPLETE_ENTRIES } = options;
  const parts = entriesParts(
    entries,
    new Set(['ContextMenu', 'ContextMenuTrigger', 'ContextMenuContent']),
  );
  const { checked, radio } = contextMenuEntriesState(entries);
  const declarations = [
    ...Object.entries(checked).map(([value, on]) => `let ${stateName(value)} = $state(${on});`),
    ...Object.entries(radio).map(([name, value]) => `let ${name} = $state('${value}');`),
  ];
  const script = declarations.length
    ? `${importing([...parts])}\n\n${declarations.join('\n')}`
    : importing([...parts]);
  return svelteSnippet(script, menu(entriesMarkup(entries, '    ').join('\n'), triggerLabel));
}

/**
 * Composição completa: marcação, escolha única e submenu no mesmo menu.
 *
 * Cada bloco é nomeado pelo rótulo que mora dentro dele — é isso que faz o
 * leitor de tela anunciar "Ações, grupo" em vez de um bloco anônimo.
 *
 * O terceiro rótulo é `ContextMenuGroupHeading`, o nome da lib que esta stack
 * também publica, como na story: ele delega ao `ContextMenuLabel` e desenha o
 * mesmo rótulo, e o trecho mostra exatamente o que a prévia monta.
 */
export function contextMenuCompleteSource(): string {
  return svelteSnippet(
    `${importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuGroupHeading',
      'ContextMenuItem',
      'ContextMenuCheckboxItem',
      'ContextMenuRadioGroup',
      'ContextMenuRadioItem',
      'ContextMenuSub',
      'ContextMenuSubTrigger',
      'ContextMenuSubContent',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ])}

let showGrid = $state(true);
let layout = $state('grid');`,
    menu(`    <ContextMenuGroup>
      <ContextMenuLabel>Ações</ContextMenuLabel>
${item('Editar', { shortcut: 'Ctrl+E', indent: '      ' })}
      <ContextMenuSub>
        <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem>Por e-mail</ContextMenuItem>
          <ContextMenuItem>Por link</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuGroup>
      <ContextMenuLabel>Visualização</ContextMenuLabel>
      <ContextMenuCheckboxItem bind:checked={showGrid}>
        Mostrar grade
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuRadioGroup bind:value={layout}>
      <ContextMenuGroupHeading>Layout</ContextMenuGroupHeading>
      <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
      <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
    </ContextMenuRadioGroup>
    <ContextMenuSeparator />
${item('Excluir', { shortcut: 'Delete', props: ' variant="destructive"' })}`),
  );
}
