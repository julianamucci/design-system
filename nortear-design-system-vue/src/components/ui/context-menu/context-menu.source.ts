/**
 * Transforms do painel Code do ContextMenu.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Os snippets usam os nomes longos (`ContextMenuTrigger`, `ContextMenuItem`…)
 * porque é essa a API que o `index.ts` publica e por onde quem consome escreve.
 */
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';
import { attrBool, attrs, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ContextMenuArgs = {
  triggerLabel: string;
  modal: boolean;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
};

/** Rótulo da moldura quando o control não trouxer texto. */
const LABEL_DEFAULT = 'Clique com o botão direito aqui';

/** Ordem canônica das peças no bloco de import. */
const ORDER = [
  'ContextMenu',
  'ContextMenuTrigger',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuLabel',
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
  const usadas = ORDER.filter((part) => parts.includes(part));
  return `import {
${usadas.map((part) => `  ${part},`).join('\n')}
} from '@/components/ui/context-menu'`;
}

/** Um item do menu, com ou sem atalho ao lado do rótulo. */
function item(
  label: string,
  options: { atalho?: string; props?: string; recuo?: string } = {},
): string {
  const { atalho, props = '', recuo = '    ' } = options;
  if (!atalho) return `${recuo}<ContextMenuItem${props}>${label}</ContextMenuItem>`;
  return `${recuo}<ContextMenuItem${props}>
${recuo}  ${label}
${recuo}  <ContextMenuShortcut>${atalho}</ContextMenuShortcut>
${recuo}</ContextMenuItem>`;
}

/**
 * O gesto e o painel em volta do conteúdo do menu.
 *
 * A moldura tracejada é o componente inteiro do ponto de vista de quem olha: o
 * ContextMenu não tem botão. As duas classes de borda são necessárias —
 * `nds-border-default` traz largura e cor, `nds-border-dashed` só troca o estilo
 * do traço — e o quadro não tem altura, nasce do `nds-p-8` e cresce junto com a
 * fonte do navegador (WCAG 1.4.4).
 *
 * O conteúdo já chega indentado com quatro espaços.
 */
function menu(content: string, options: { label?: string; root?: string } = {}): string {
  const { label = LABEL_DEFAULT, root = '' } = options;
  return `<ContextMenu${attrs(root)}>
  <ContextMenuTrigger
    class="${AREA_CLICK_DIREITO}"
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

// ─── Menu descrito por dados ──────────────────────────────────────────────────
//
// Uma lista de entradas vira o trecho inteiro: import só das peças usadas,
// `ref` de cada `v-model` no script, e o markup. É a mesma lista que a docs page
// monta com os rótulos no idioma da página — e é isso que impede o código de
// divergir da prévia ao lado: até 2026-09-10 os cards de Variantes tinham um
// literal em português ao lado de uma prévia traduzida, e em inglês a tela dizia
// "Edit" e o código "Editar".

/** Item de ação. */
export type ContextMenuSnippetItem = {
  kind: 'item';
  label: string;
  shortcut?: string;
  inset?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

/** Item de marcação, ligado por `v-model:checked` a um `ref` do script. */
export type ContextMenuSnippetCheckbox = {
  kind: 'checkbox';
  label: string;
  /** Nome do `ref` no script. */
  model: string;
  /** Valor inicial do `ref`. */
  checked: boolean;
};

/** Submenu: a tríade Sub/SubTrigger/SubContent, com os itens dentro. */
export type ContextMenuSnippetSub = {
  kind: 'sub';
  label: string;
  entries: ContextMenuSnippetItem[];
};

/**
 * Grupo NOMEADO: o rótulo mora dentro dele, e é ele que o grupo usa como nome
 * (`aria-labelledby`). Não existe grupo sem rótulo aqui de propósito — a lib
 * escreve o `aria-labelledby` em todo grupo, e sem rótulo ele aponta para um id
 * que não existe.
 */
export type ContextMenuSnippetGroup = {
  kind: 'group';
  label: string;
  inset?: boolean;
  entries: Array<ContextMenuSnippetItem | ContextMenuSnippetCheckbox | ContextMenuSnippetSub>;
};

/**
 * Escolha única: o grupo de rádio É o grupo, e o rótulo mora dentro dele.
 *
 * Um `ContextMenuGroup` em volta criaria um SEGUNDO grupo — o de rádio já é um
 * grupo por baixo — e o de dentro ficaria com `aria-labelledby` pendurado, porque
 * o rótulo pegaria o id do grupo de fora.
 */
export type ContextMenuSnippetRadioGroup = {
  kind: 'radio-group';
  label: string;
  /** Nome do `ref` no script. */
  model: string;
  /** Valor inicial do `ref`. */
  value: string;
  options: Array<{ label: string; value: string }>;
};

export type ContextMenuSnippetEntry =
  | ContextMenuSnippetItem
  | ContextMenuSnippetCheckbox
  | ContextMenuSnippetSub
  | ContextMenuSnippetGroup
  | ContextMenuSnippetRadioGroup
  | { kind: 'separator' };

/** Uma entrada em linhas, já no recuo `n`; registra peças e `ref`s usados. */
function entryLines(
  entry: ContextMenuSnippetEntry,
  n: number,
  parts: Set<string>,
  refs: string[],
): string[] {
  const pad = ' '.repeat(n);
  switch (entry.kind) {
    case 'separator':
      parts.add('ContextMenuSeparator');
      return [`${pad}<ContextMenuSeparator />`];
    case 'item':
      parts.add('ContextMenuItem');
      if (entry.shortcut) parts.add('ContextMenuShortcut');
      return [
        item(entry.label, {
          atalho: entry.shortcut,
          props: attrs(
            entry.inset && 'inset',
            entry.destructive && 'variant="destructive"',
            entry.disabled && 'disabled',
          ),
          recuo: pad,
        }),
      ];
    case 'checkbox':
      parts.add('ContextMenuCheckboxItem');
      refs.push(`const ${entry.model} = ref(${entry.checked})`);
      return [
        `${pad}<ContextMenuCheckboxItem v-model:checked="${entry.model}">`,
        `${pad}  ${entry.label}`,
        `${pad}</ContextMenuCheckboxItem>`,
      ];
    case 'sub':
      parts.add('ContextMenuSub').add('ContextMenuSubTrigger').add('ContextMenuSubContent');
      return [
        `${pad}<ContextMenuSub>`,
        `${pad}  <ContextMenuSubTrigger>${entry.label}</ContextMenuSubTrigger>`,
        `${pad}  <ContextMenuSubContent>`,
        ...entry.entries.flatMap((child) => entryLines(child, n + 4, parts, refs)),
        `${pad}  </ContextMenuSubContent>`,
        `${pad}</ContextMenuSub>`,
      ];
    case 'group':
      parts.add('ContextMenuGroup').add('ContextMenuLabel');
      return [
        `${pad}<ContextMenuGroup>`,
        `${pad}  <ContextMenuLabel${attrs(entry.inset && 'inset')}>${entry.label}</ContextMenuLabel>`,
        ...entry.entries.flatMap((child) => entryLines(child, n + 2, parts, refs)),
        `${pad}</ContextMenuGroup>`,
      ];
    case 'radio-group':
      parts.add('ContextMenuRadioGroup').add('ContextMenuLabel').add('ContextMenuRadioItem');
      refs.push(`const ${entry.model} = ref('${entry.value}')`);
      return [
        `${pad}<ContextMenuRadioGroup v-model="${entry.model}">`,
        `${pad}  <ContextMenuLabel>${entry.label}</ContextMenuLabel>`,
        ...entry.options.map(
          (option) =>
            `${pad}  <ContextMenuRadioItem value="${option.value}">${option.label}</ContextMenuRadioItem>`,
        ),
        `${pad}</ContextMenuRadioGroup>`,
      ];
  }
}

/**
 * O trecho de um menu a partir da lista de entradas.
 *
 * `triggerLabel` é o texto da área, e `root` os atributos da raiz que diferem
 * do padrão (já montados, como `attrBool` devolve).
 */
export function contextMenuSnippet(options: {
  entries: ContextMenuSnippetEntry[];
  triggerLabel?: string;
  root?: string;
}): string {
  const parts = new Set(['ContextMenu', 'ContextMenuTrigger', 'ContextMenuContent']);
  const refs: string[] = [];
  const content = options.entries
    .flatMap((entry) => entryLines(entry, 4, parts, refs))
    .join('\n');
  const imports = importing([...parts]);
  const script = refs.length
    ? `${imports}
import { ref } from 'vue'

${refs.join('\n')}`
    : imports;
  return vueSnippet(script, menu(content, { label: options.triggerLabel, root: options.root }));
}

/**
 * Forma canônica: a área do gesto, as ações e a ação destrutiva separada
 * delas.
 *
 * Sem grupo em volta das ações: grupo sem rótulo não tem nome, e a lib escreve
 * nele um `aria-labelledby` para um id que não existe. O Vanilla, que é a
 * referência, só abre grupo onde há rótulo.
 *
 * `modal` nasce ligado na raiz — só a desativação entra no snippet. Os três
 * `show*` do Playground tiram peças do menu, e o snippet tira junto: um trecho
 * com o separador que a prévia não desenha ensinaria outro menu.
 */
export const contextMenuSource: SourceTransform<ContextMenuArgs> = (_gerado, ctx) => {
  const args = ctx?.args;
  // Control ausente vale o padrão do meta, que é ligado.
  const isOn = (value: unknown) => value !== false;
  const withShortcuts = isOn(args?.showShortcuts);

  const entries: ContextMenuSnippetEntry[] = [
    { kind: 'item', label: 'Editar', shortcut: withShortcuts ? 'Ctrl+E' : undefined },
    { kind: 'item', label: 'Duplicar' },
  ];
  if (isOn(args?.showSeparator)) entries.push({ kind: 'separator' });
  if (isOn(args?.showDestructive)) {
    entries.push({
      kind: 'item',
      label: 'Excluir',
      shortcut: withShortcuts ? 'Delete' : undefined,
      destructive: true,
    });
  }

  return contextMenuSnippet({
    entries,
    triggerLabel: text(args?.triggerLabel, LABEL_DEFAULT),
    root: attrBool('modal', args?.modal, true),
  });
};

/** Estado ItemDisabled: o item indisponível não recebe ponteiro nem Enter. */
export function contextMenuItemDisabledSource(): string {
  return contextMenuSnippet({
    entries: [
      { kind: 'item', label: 'Editar' },
      { kind: 'item', label: 'Duplicar', disabled: true },
      { kind: 'item', label: 'Renomear' },
      { kind: 'separator' },
      { kind: 'item', label: 'Excluir', destructive: true, disabled: true },
    ],
  });
}

/**
 * Estado ItemInset: o recuo alinha o rótulo com os itens que têm indicador.
 *
 * Ele empurra só a borda esquerda — a caixa continua encostada à direita, senão
 * o menu ganharia um degrau.
 */
export function contextMenuItemRecuadoSource(): string {
  return contextMenuSnippet({
    entries: [
      {
        kind: 'group',
        label: 'Arquivo',
        inset: true,
        entries: [
          { kind: 'item', label: 'Editar' },
          { kind: 'item', label: 'Duplicar', inset: true },
        ],
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Excluir', inset: true, destructive: true },
    ],
  });
}

/** Estado ItemDestructive: a ação perigosa se declara por prop, não por cor. */
export function contextMenuItemDestructiveSource(): string {
  return contextMenuSnippet({
    entries: [
      { kind: 'item', label: 'Editar', shortcut: 'Ctrl+E' },
      { kind: 'item', label: 'Duplicar' },
      { kind: 'separator' },
      { kind: 'item', label: 'Excluir permanentemente', shortcut: 'Delete', destructive: true },
    ],
  });
}

/**
 * Estado CheckboxIndeterminate: os três estados de uma marcação lado a lado.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Os três são escritos por extenso de propósito — o assunto da story é o
 * CONTRASTE entre eles, e omitir o desmarcado apagaria metade da lição.
 *
 * A prop é `checked`, e não o `model-value` da lib por baixo: é ela que a tabela
 * de props documenta e a única que o item realmente lê.
 *
 * O rótulo mora num grupo, que o usa como nome — como no Vanilla, onde todo
 * rótulo abre um grupo. Solto entre os itens, ele seria texto que o leitor de
 * tela anuncia sem dizer a que se aplica. Escrito à mão, e não pela lista de
 * entradas, porque os três estados são prop estática, não `v-model`.
 */
export function contextMenuMarkupMistaSource(): string {
  return vueSnippet(
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
      <ContextMenuCheckboxItem checked="indeterminate">Colunas</ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem :checked="true">Régua</ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem :checked="false">Grade</ContextMenuCheckboxItem>
    </ContextMenuGroup>`),
  );
}

/**
 * Estado DarkPalette: o mesmo markup, outra paleta.
 *
 * A troca de tema é global (classe no documento) e não muda uma linha do menu —
 * é exatamente isso que a story mostra.
 */
export function contextMenuPaletteDarkSource(): string {
  return contextMenuSnippet({
    entries: [
      { kind: 'item', label: 'Editar' },
      { kind: 'item', label: 'Duplicar', disabled: true },
      { kind: 'separator' },
      { kind: 'item', label: 'Excluir', destructive: true },
    ],
  });
}

/** Composição WithShortcut: o atalho mora dentro do item e é lido junto dele. */
export function contextMenuWithShortcutsSource(): string {
  return contextMenuSnippet({
    entries: [
      { kind: 'item', label: 'Editar', shortcut: 'Ctrl+E' },
      { kind: 'item', label: 'Desfazer', shortcut: 'Ctrl+Z' },
      { kind: 'separator' },
      { kind: 'item', label: 'Excluir', shortcut: 'Delete', destructive: true },
    ],
  });
}

/**
 * Composição WithCheckbox: cada item guarda a própria marcação.
 *
 * `v-model:checked` é o par completo — a prop entra e o evento volta. Ligar só
 * `:checked` deixaria o item preso ao valor inicial.
 */
export function contextMenuWithMarkupSource(): string {
  return contextMenuSnippet({
    entries: [
      {
        kind: 'group',
        label: 'Visualização',
        entries: [
          { kind: 'checkbox', label: 'Mostrar grade', model: 'showGrid', checked: false },
          { kind: 'checkbox', label: 'Mostrar réguas', model: 'showRulers', checked: true },
        ],
      },
    ],
  });
}

/**
 * Composição WithRadioGroup: escolha única, o valor vive no grupo.
 *
 * UM grupo só: o de rádio, nomeado pelo rótulo que mora dentro dele.
 */
export function contextMenuWithChoiceUnicaSource(): string {
  return contextMenuSnippet({
    entries: [
      {
        kind: 'radio-group',
        label: 'Layout',
        model: 'layout',
        value: 'grid',
        options: [
          { label: 'Grade', value: 'grid' },
          { label: 'Lista', value: 'list' },
          { label: 'Colunas', value: 'columns' },
        ],
      },
    ],
  });
}

/** Composição WithSubmenu: o segundo nível abre ao lado do item que o dispara. */
export function contextMenuWithSubmenuSource(): string {
  return contextMenuSnippet({
    entries: [
      { kind: 'item', label: 'Editar' },
      { kind: 'item', label: 'Duplicar' },
      {
        kind: 'sub',
        label: 'Compartilhar',
        entries: [
          { kind: 'item', label: 'Por e-mail' },
          { kind: 'item', label: 'Por link' },
        ],
      },
    ],
  });
}

/**
 * Composição completa: marcação, escolha única e submenu no mesmo menu.
 *
 * Cada bloco é um grupo com o próprio rótulo: é o agrupamento que faz o leitor
 * de tela anunciar a seção em vez de despejar uma lista corrida. O de escolha
 * única é o próprio `ContextMenuRadioGroup` — um `ContextMenuGroup` em volta
 * dele seria um segundo grupo, sem nome.
 */
export function contextMenuCompletoSource(): string {
  return contextMenuSnippet({
    entries: [
      {
        kind: 'group',
        label: 'Ações',
        entries: [
          { kind: 'item', label: 'Editar', shortcut: 'Ctrl+E' },
          {
            kind: 'sub',
            label: 'Compartilhar',
            entries: [
              { kind: 'item', label: 'Por e-mail' },
              { kind: 'item', label: 'Por link' },
            ],
          },
        ],
      },
      { kind: 'separator' },
      {
        kind: 'group',
        label: 'Visualização',
        entries: [{ kind: 'checkbox', label: 'Mostrar grade', model: 'showGrid', checked: true }],
      },
      { kind: 'separator' },
      {
        kind: 'radio-group',
        label: 'Layout',
        model: 'layout',
        value: 'grid',
        options: [
          { label: 'Grade', value: 'grid' },
          { label: 'Lista', value: 'list' },
        ],
      },
      { kind: 'separator' },
      { kind: 'item', label: 'Excluir', shortcut: 'Delete', destructive: true },
    ],
  });
}
