/**
 * Transforms do painel Code do ContextMenu.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O andaime que o painel imprimia era o `<AreaGatilho>` do módulo de fixtures —
 * uma tag sem origem para quem copiava. O que ela embrulhava é o
 * `ContextMenuTrigger` com o vocabulário de classe da área de clique direito, e
 * é isso que os snippets escrevem por extenso.
 */
import { childText, indentar, jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type ContextMenuArgs = {
  triggerLabel: string;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
};

const LABEL_DEFAULT = 'Clique com o botão direito aqui';

/**
 * A moldura tracejada da área de clique direito.
 *
 * O ContextMenu não tem botão: o que a pessoa vê é o próprio conteúdo. Numa
 * demonstração ele precisa de uma moldura que diga onde clicar, e as duas
 * classes de borda são necessárias — `nds-border-default` traz largura e cor,
 * `nds-border-dashed` só troca o estilo. Num produto real o gatilho embrulha o
 * conteúdo (um cartão, uma linha de lista) e dispensa a moldura.
 *
 * Sem altura fixa: o quadro nasce do `nds-p-8` e cresce junto quando a pessoa
 * aumenta a fonte do navegador (WCAG 1.4.4).
 */
const CLASSES_DA_AREA =
  'nds-cluster nds-w-xs nds-p-8 nds-rounded-md nds-border-default nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default';

function area(label: string): string {
  return `  <ContextMenuTrigger
    className="${CLASSES_DA_AREA}"
    data-align="center"
    data-justify="center"
  >
    ${label}
  </ContextMenuTrigger>`;
}

function importDe(...parts: string[]): string {
  return `import {
${parts.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/context-menu";`;
}

/** O item com atalho, ou o item simples quando o control desliga os atalhos. */
function shortcutItem(label: string, shortcut: string | false, extra = ''): string {
  if (!shortcut) return `    <ContextMenuItem${extra}>${label}</ContextMenuItem>`;
  return `    <ContextMenuItem${extra}>
      ${label}
      <ContextMenuShortcut>${shortcut}</ContextMenuShortcut>
    </ContextMenuItem>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo.
 *
 * Ensina o arranjo canônico: a área que responde ao gesto, as ações com atalho,
 * o divisor e a ação destrutiva — e segue os controls do Playground, que ligam
 * e desligam cada uma dessas partes. O atalho fica DENTRO do item e sem
 * `aria-hidden`, porque "Excluir, Delete" é o nome útil — escondido, o atalho só
 * existe para quem enxerga.
 *
 * Os `show*` que não chegam (as stories dos outros arquivos não os têm) valem
 * `true`: o padrão do Playground, e o menu canônico.
 */
export const contextMenuSource: SourceTransform<ContextMenuArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const label = childText(args.triggerLabel, LABEL_DEFAULT);
  const withShortcuts = args.showShortcuts !== false;
  const withSeparator = args.showSeparator !== false;
  const withDestructive = args.showDestructive !== false;

  const lines = [
    shortcutItem('Editar', withShortcuts && 'Ctrl+E'),
    shortcutItem('Duplicar', false),
    withSeparator && '    <ContextMenuSeparator />',
    withDestructive && shortcutItem('Excluir', withShortcuts && 'Delete', ' variant="destructive"'),
  ].filter(Boolean);

  const parts = [
    'ContextMenu',
    'ContextMenuContent',
    'ContextMenuItem',
    withSeparator && 'ContextMenuSeparator',
    withShortcuts && 'ContextMenuShortcut',
    'ContextMenuTrigger',
  ].filter((part): part is string => Boolean(part));

  return jsxSnippet(
    importDe(...parts),
    `<ContextMenu>
${area(label)}
  <ContextMenuContent>
${lines.join('\n')}
  </ContextMenuContent>
</ContextMenu>`,
  );
};

/**
 * Com atalhos: o atalho vive DENTRO do item, um por linha de ação.
 *
 * Snippet próprio porque a story mostra três atalhos e nenhum grupo, enquanto o
 * do `meta` publica um item sem atalho dentro de um `ContextMenuGroup` — quem
 * copiava recebia "Duplicar" onde o preview mostra "Desfazer, Ctrl+Z".
 *
 * O `ContextMenuShortcut` não leva `aria-hidden`: "Excluir, Delete" é o nome
 * útil, e escondido o atalho só existe para quem enxerga.
 */
export function contextMenuWithShortcutSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      Desfazer
      <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir
      <ContextMenuShortcut>Delete</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Paleta escura: o markup é o MESMO — quem troca a paleta é o tema, e não uma
 * prop do menu. Por isso o snippet não carrega classe de tema nenhuma.
 *
 * Ele existe porque a story do escuro mostra um item desabilitado e nenhum
 * atalho, e o snippet do `meta` publicava atalho em dois itens e nenhum
 * desabilitado — o painel Code ensinava outro menu que o da foto.
 */
export function contextMenuDarkPaletteSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem disabled>Duplicar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">Excluir</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Com marcação: o estado vive fora do menu, que só avisa a troca. O snippet
 * ensina os dois estados de uso corrente; o misto (`indeterminate`) tem story e
 * snippet próprios — `contextMenuCheckboxIndeterminateSource`.
 */
export function contextMenuWithMarkupSource(): string {
  return jsxSnippet(
    `${importDe(
  'ContextMenu',
  'ContextMenuCheckboxItem',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuLabel',
  'ContextMenuTrigger',
)}
import { useState } from "react";`,
    `function MenuDeVisualizacao() {
  const [grade, setGrade] = useState(false);
  const [reguas, setReguas] = useState(true);

  return (
    <ContextMenu>
${area(LABEL_DEFAULT).replace(/^/gm, '    ')}
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem
            checked={grade}
            onCheckedChange={(valor) => setGrade(valor)}
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={reguas}
            onCheckedChange={(valor) => setReguas(valor)}
          >
            Mostrar réguas
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}`,
  );
}

/**
 * Com escolha única: quem guarda o valor é o `ContextMenuRadioGroup`, e cada
 * opção declara o seu `value`. É o papel do grupo que faz o leitor de tela
 * anunciar "opção 2 de 3" em vez de três marcações independentes.
 *
 * O rótulo mora DENTRO do grupo de escolha única, e não num `ContextMenuGroup`
 * em volta: o `Menu.RadioGroup` da base-ui já é `role="group"` e é ele quem o
 * rótulo nomeia (`aria-labelledby`). Embrulhado num segundo grupo, o leitor de
 * tela anunciava dois — o de fora com nome, o de dentro anônimo.
 */
export function contextMenuWithChoiceUnicaSource(): string {
  return jsxSnippet(
    `${importDe(
  'ContextMenu',
  'ContextMenuContent',
  'ContextMenuLabel',
  'ContextMenuRadioGroup',
  'ContextMenuRadioItem',
  'ContextMenuTrigger',
)}
import { useState } from "react";`,
    `function MenuDeLayout() {
  const [layout, setLayout] = useState("grid");

  return (
    <ContextMenu>
${area(LABEL_DEFAULT).replace(/^/gm, '    ')}
      <ContextMenuContent>
        <ContextMenuRadioGroup value={layout} onValueChange={(valor) => setLayout(valor)}>
          <ContextMenuLabel>Layout</ContextMenuLabel>
          <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
          <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
          <ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}`,
  );
}

/**
 * Marcação mista: os três estados de um item de marcação lado a lado.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Os três vão por extenso de propósito — o assunto é o CONTRASTE entre eles, e
 * omitir o desmarcado apagaria metade da lição.
 *
 * `indeterminate` é prop do wrapper, e controlada: o primeiro clique chama
 * `onCheckedChange(true)`, e é ali que quem guarda o estado tira o misto.
 */
export function contextMenuCheckboxIndeterminateSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuCheckboxItem',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel>Mostrar na tela</ContextMenuLabel>
      <ContextMenuCheckboxItem checked={false} indeterminate>
        Colunas
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem checked>Régua</ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem checked={false}>Grade</ContextMenuCheckboxItem>
    </ContextMenuGroup>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Com submenu: as três peças andam juntas — `Sub` guarda o estado, `SubTrigger`
 * é o item que abre e `SubContent` é o painel filho. O sub-gatilho já anuncia
 * `aria-haspopup="menu"` sozinho, e o painel nasce à direita do item.
 */
export function contextMenuWithSubmenuSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSub',
      'ContextMenuSubContent',
      'ContextMenuSubTrigger',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSub>
      <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Por e-mail</ContextMenuItem>
        <ContextMenuItem>Por link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Item desabilitado: `disabled` no item, e não no menu.
 *
 * A atenuação é o sinal que sobra quando o contraste falha, mas quem anuncia o
 * estado é o markup — a folha também tira o item do alcance do ponteiro, então
 * não há caminho nenhum que o execute.
 */
export function contextMenuItemDisabledSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem disabled>Duplicar</ContextMenuItem>
    <ContextMenuItem>Renomear</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive" disabled>
      Excluir
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Item destrutivo: a ação perigosa se declara pela VARIANTE, não pela cor.
 *
 * Snippet próprio porque o preview escreve "Excluir permanentemente" — o rótulo
 * por extenso, que é o assunto de uma ação sem volta — enquanto o do `meta`
 * publica "Excluir". Sem ele o painel Code ensinava um item que a foto não tem,
 * e era a única das cinco stories deste arquivo sem construtor.
 */
export function contextMenuItemDestructiveSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuItem>
      Editar
      <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      Excluir permanentemente
      <ContextMenuShortcut>Delete</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Item recuado: `inset` alinha o rótulo com os itens que têm indicador à
 * esquerda. Só a borda esquerda é empurrada — a caixa continua terminando onde
 * as outras terminam, senão o menu ganharia um degrau à direita.
 */
export function contextMenuItemRecuadoSource(): string {
  return jsxSnippet(
    importDe(
      'ContextMenu',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuLabel',
      'ContextMenuSeparator',
      'ContextMenuTrigger',
    ),
    `<ContextMenu>
${area(LABEL_DEFAULT)}
  <ContextMenuContent>
    <ContextMenuGroup>
      <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
      <ContextMenuItem>Editar</ContextMenuItem>
      <ContextMenuItem inset>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuItem inset variant="destructive">
      Excluir
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
  );
}

/**
 * Composição completa: marcação e escolha única convivendo no mesmo menu, com
 * rótulo por bloco e divisor entre eles.
 *
 * Vale como snippet próprio porque a convivência é o assunto — cada peça
 * isolada já aparece nas outras composições, e nenhuma delas mostra a ordem em
 * que os blocos se sucedem.
 */
export function contextMenuCompletoSource(): string {
  return jsxSnippet(
    `${importDe(
  'ContextMenu',
  'ContextMenuCheckboxItem',
  'ContextMenuContent',
  'ContextMenuGroup',
  'ContextMenuItem',
  'ContextMenuLabel',
  'ContextMenuRadioGroup',
  'ContextMenuRadioItem',
  'ContextMenuSeparator',
  'ContextMenuShortcut',
  'ContextMenuSub',
  'ContextMenuSubContent',
  'ContextMenuSubTrigger',
  'ContextMenuTrigger',
)}
import { useState } from "react";`,
    `function MenuDoCanvas() {
  const [grade, setGrade] = useState(true);
  const [layout, setLayout] = useState("grid");

  return (
    <ContextMenu>
${area(LABEL_DEFAULT).replace(/^/gm, '    ')}
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Ações</ContextMenuLabel>
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
          </ContextMenuItem>
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
          <ContextMenuCheckboxItem
            checked={grade}
            onCheckedChange={(valor) => setGrade(valor)}
          >
            Mostrar grade
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={layout} onValueChange={(valor) => setLayout(valor)}>
          <ContextMenuLabel>Layout</ContextMenuLabel>
          <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
          <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          Excluir
          <ContextMenuShortcut>Delete</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}`,
  );
}

// ─── O menu como DADO: uma lista monta a prévia e imprime o código ────────────
//
// Os cards de Variantes da docs page tinham um literal de código ao lado de
// cada prévia, em português: a prévia saía do conteúdo compartilhado, no idioma
// de quem lê, e o código mostrava "Editar" para quem via "Edit". É o desenho
// do vanilla (`variantMenu` + `contextMenuSnippet`): a MESMA lista de entradas
// vira o menu vivo e o trecho que se copia, então os dois não têm como divergir
// — nem de idioma, nem de estrutura.

/**
 * Item de ação. `value` é o id ESTÁVEL do item — é o que o evento de escolha
 * manda ao GA4 —, e o snippet não o imprime: o item de ação não tem `value`.
 */
export type ContextMenuActionEntry = {
  kind: 'item';
  label: string;
  value: string;
  shortcut?: string;
  destructive?: boolean;
  inset?: boolean;
};

/**
 * Item de marcação. `value` é o id estável e também dá NOME ao estado no
 * snippet: `show-grid` vira `const [showGrid, setShowGrid]`.
 */
export type ContextMenuCheckboxEntry = {
  kind: 'checkbox';
  label: string;
  value: string;
  checked: boolean;
};

/**
 * Uma entrada do menu. O grupo de escolha única carrega o PRÓPRIO rótulo: é o
 * `ContextMenuRadioGroup` que o rótulo nomeia, sem `ContextMenuGroup` em volta
 * — dois grupos aninhados anunciavam um deles anônimo.
 */
export type ContextMenuEntry =
  | ContextMenuActionEntry
  | ContextMenuCheckboxEntry
  | { kind: 'separator' }
  | { kind: 'submenu'; label: string; items: ContextMenuActionEntry[] }
  | {
      kind: 'group';
      label: string;
      inset?: boolean;
      items: Array<ContextMenuActionEntry | ContextMenuCheckboxEntry>;
    }
  | {
      kind: 'radio-group';
      label: string;
      /** Id estável do grupo, nome do estado no snippet e prefixo do evento. */
      value: string;
      /** A opção marcada ao montar. */
      selected: string;
      options: Array<{ label: string; value: string }>;
    };

/** `show-grid` → `showGrid`: o nome do estado sai do id estável. */
function stateName(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

function setterName(state: string): string {
  return `set${state.charAt(0).toUpperCase()}${state.slice(1)}`;
}

/**
 * Texto de JSX. O rótulo vem do conteúdo compartilhado, e um `{` ou um `<`
 * nele quebraria o trecho copiado — nesse caso ele vai como string entre chaves.
 */
function jsxText(text: string): string {
  return /[{}<>]/.test(text) ? `{${JSON.stringify(text)}}` : text;
}

function actionLines(entry: ContextMenuActionEntry, pad: string): string[] {
  const open = `<ContextMenuItem${entry.inset ? ' inset' : ''}${
    entry.destructive ? ' variant="destructive"' : ''
  }>`;
  if (!entry.shortcut) return [`${pad}${open}${jsxText(entry.label)}</ContextMenuItem>`];
  return [
    `${pad}${open}`,
    `${pad}  ${jsxText(entry.label)}`,
    `${pad}  <ContextMenuShortcut>${jsxText(entry.shortcut)}</ContextMenuShortcut>`,
    `${pad}</ContextMenuItem>`,
  ];
}

function entryLines(entry: ContextMenuEntry, pad: string): string[] {
  switch (entry.kind) {
    case 'item':
      return actionLines(entry, pad);
    case 'separator':
      return [`${pad}<ContextMenuSeparator />`];
    case 'checkbox': {
      const state = stateName(entry.value);
      return [
        `${pad}<ContextMenuCheckboxItem checked={${state}} onCheckedChange={${setterName(state)}}>`,
        `${pad}  ${jsxText(entry.label)}`,
        `${pad}</ContextMenuCheckboxItem>`,
      ];
    }
    case 'submenu':
      return [
        `${pad}<ContextMenuSub>`,
        `${pad}  <ContextMenuSubTrigger>${jsxText(entry.label)}</ContextMenuSubTrigger>`,
        `${pad}  <ContextMenuSubContent>`,
        ...entry.items.flatMap((item) => actionLines(item, `${pad}    `)),
        `${pad}  </ContextMenuSubContent>`,
        `${pad}</ContextMenuSub>`,
      ];
    case 'group':
      return [
        `${pad}<ContextMenuGroup>`,
        `${pad}  <ContextMenuLabel${entry.inset ? ' inset' : ''}>${jsxText(entry.label)}</ContextMenuLabel>`,
        ...entry.items.flatMap((item) => entryLines(item, `${pad}  `)),
        `${pad}</ContextMenuGroup>`,
      ];
    case 'radio-group': {
      const state = stateName(entry.value);
      return [
        `${pad}<ContextMenuRadioGroup value={${state}} onValueChange={${setterName(state)}}>`,
        `${pad}  <ContextMenuLabel>${jsxText(entry.label)}</ContextMenuLabel>`,
        ...entry.options.map(
          (option) =>
            `${pad}  <ContextMenuRadioItem value=${JSON.stringify(option.value)}>${jsxText(option.label)}</ContextMenuRadioItem>`,
        ),
        `${pad}</ContextMenuRadioGroup>`,
      ];
    }
  }
}

/** O `useState` de cada marcação e de cada grupo de escolha única, na ordem do menu. */
function stateLines(entries: readonly ContextMenuEntry[]): string[] {
  return entries.flatMap((entry) => {
    if (entry.kind === 'checkbox') {
      const state = stateName(entry.value);
      return [`const [${state}, ${setterName(state)}] = useState(${entry.checked});`];
    }
    if (entry.kind === 'radio-group') {
      const state = stateName(entry.value);
      return [`const [${state}, ${setterName(state)}] = useState(${JSON.stringify(entry.selected)});`];
    }
    if (entry.kind === 'group') return stateLines(entry.items);
    return [];
  });
}

/** As peças que as entradas usam — é o bloco de import, e só ele. */
function entryParts(entries: readonly ContextMenuEntry[], parts: Set<string>): Set<string> {
  for (const entry of entries) {
    switch (entry.kind) {
      case 'item':
        parts.add('ContextMenuItem');
        if (entry.shortcut) parts.add('ContextMenuShortcut');
        break;
      case 'separator':
        parts.add('ContextMenuSeparator');
        break;
      case 'checkbox':
        parts.add('ContextMenuCheckboxItem');
        break;
      case 'submenu':
        parts.add('ContextMenuSub').add('ContextMenuSubTrigger').add('ContextMenuSubContent');
        entryParts(entry.items, parts);
        break;
      case 'group':
        parts.add('ContextMenuGroup').add('ContextMenuLabel');
        entryParts(entry.items, parts);
        break;
      case 'radio-group':
        parts.add('ContextMenuRadioGroup').add('ContextMenuLabel').add('ContextMenuRadioItem');
        break;
    }
  }
  return parts;
}

/** O menu canônico, o mesmo do `meta`: as ações com atalho, o divisor e a destrutiva. */
const ENTRIES_DEFAULT: readonly ContextMenuEntry[] = [
  { kind: 'item', label: 'Editar', value: 'edit', shortcut: 'Ctrl+E' },
  { kind: 'item', label: 'Duplicar', value: 'duplicate' },
  { kind: 'separator' },
  { kind: 'item', label: 'Excluir', value: 'delete', shortcut: 'Delete', destructive: true },
];

export type ContextMenuSnippetOptions = {
  /** Texto da área que responde ao gesto. */
  triggerLabel?: string;
  /** O menu como lista de entradas; sem ela, o menu canônico. */
  entries?: readonly ContextMenuEntry[];
};

/**
 * O trecho do menu descrito por `entries`, com os rótulos EXATAMENTE como
 * chegam — quem chama os lê do conteúdo compartilhado, no idioma da página.
 *
 * O trecho é o que se COLA: o import só das peças usadas e, havendo marcação ou
 * escolha única, o `useState` de cada uma dentro de um componente. Até
 * 2026-09-10 ele saía sem import nenhum, e com estado era um `const [x, setX] =
 * useState(…)` solto seguido de JSX solto — nenhum dos dois compila colado, e o
 * card de Variantes era o único das stacks com código incompleto ao lado da
 * prévia (o vanilla e o vue imprimem o import). Sem `entries` o construtor cai
 * no menu canônico, que é como a guarda transversal o chama.
 */
export function contextMenuSnippet(o: ContextMenuSnippetOptions = {}): string {
  const entries = o.entries ?? ENTRIES_DEFAULT;
  const state = stateLines(entries);
  const parts = entryParts(entries, new Set(['ContextMenu', 'ContextMenuContent', 'ContextMenuTrigger']));
  const imports = importDe(...[...parts].sort((a, b) => a.localeCompare(b, 'en')));
  const menu = [
    '<ContextMenu>',
    `  <ContextMenuTrigger>${jsxText(o.triggerLabel ?? LABEL_DEFAULT)}</ContextMenuTrigger>`,
    '  <ContextMenuContent>',
    ...entries.flatMap((entry) => entryLines(entry, '    ')),
    '  </ContextMenuContent>',
    '</ContextMenu>',
  ].join('\n');

  if (state.length === 0) return jsxSnippet(imports, menu);

  return jsxSnippet(
    `${imports}
import { useState } from "react";`,
    `function ContextMenuWithState() {
${indentar(state.join('\n'), '  ')}

  return (
${indentar(menu, '    ')}
  );
}`,
  );
}
