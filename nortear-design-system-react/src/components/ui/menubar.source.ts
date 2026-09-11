/**
 * Transforms do painel Code do Menubar.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta da barra — `contain: layout`, `minHeight`,
 * `position: relative` — é andaime de captura, para o painel portalizado ter
 * contra o que se posicionar dentro do quadro do Storybook. Nada disso é do
 * componente, e por isso nada disso entra no snippet.
 *
 * Duas outras marcas de andaime também ficam de fora: `modal={false}` e o
 * `defaultOpen` que quase toda story usa só para o Chromatic fotografar o painel
 * aberto. O painel aberto não muda a MARCAÇÃO que se copia — só a story que
 * trata do estado inicial ensina `defaultOpen`, e é a de estado aberto.
 */
import { attrs, indentar, jsxSnippet, propBool, type SourceTransform } from '@/lib/story-source';

export type MenubarArgs = {
  modal: boolean;
  loopFocus: boolean;
};

/** Bloco de import do menubar, sempre em ordem alfabética das peças usadas. */
function importingMenubar(...parts: string[]): string {
  const list = [...parts].sort();
  return `import {\n${list.map((part) => `  ${part},`).join('\n')}\n} from "@/components/ui/menubar";`;
}

/**
 * Um menu da barra: gatilho mais painel.
 *
 * `MenubarMenu` é o par de gatilho e painel — a barra é a lista deles, e é por
 * isso que a `<Menubar>` nunca recebe item nenhum diretamente.
 */
function menu(label: string, miolo: string, isOpen = false): string {
  return `  <MenubarMenu${isOpen ? ' defaultOpen' : ''}>
    <MenubarTrigger>${label}</MenubarTrigger>
    <MenubarContent>
${miolo}
    </MenubarContent>
  </MenubarMenu>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground; nas stories sem args cai na barra fechada, que é o padrão do
 * componente e o uso canônico.
 *
 * `modal` e `loopFocus` nascem LIGADOS no primitivo, então só aparecem quando a
 * story os desliga: repetir valor padrão ensina ruído a quem copia.
 *
 * `onOpenChange` NÃO é interpolado: o Storybook o entrega como espião, e o corpo
 * do mock apareceria no painel como se fosse código do design system.
 */
export const menubarSource: SourceTransform<MenubarArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = attrs(
    propBool('modal', args.modal, true),
    propBool('loopFocus', args.loopFocus, true),
  );

  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarShortcut',
      'MenubarTrigger',
    ),
    `<Menubar${root}>
${menu(
  'Arquivo',
  `      <MenubarItem>
        Novo <MenubarShortcut>Ctrl+N</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        Abrir <MenubarShortcut>Ctrl+O</MenubarShortcut>
      </MenubarItem>`,
)}
${menu(
  'Editar',
  `      <MenubarItem>
        Desfazer <MenubarShortcut>Ctrl+Z</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        Refazer <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
      </MenubarItem>`,
)}
</Menubar>`,
  );
};

/**
 * Item neutro: a ênfase padrão, e por isso SEM atributo nenhum. A ausência de
 * `variant` é o assunto da story — é o que faz o item herdar a cor do painel em
 * vez de carregar cor semântica.
 */
export function menubarItemNeutralSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>`,
)}
</Menubar>`,
  );
}

/**
 * Item destrutivo: a cor de perigo é o que separa "Descartar alterações" de
 * "Salvar". O separador acima dele não é enfeite — é a distância que evita o
 * clique errado por vizinhança.
 */
export function menubarItemDestructiveSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarSeparator',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Salvar</MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>`,
)}
</Menubar>`,
  );
}

/**
 * Aberto por estado inicial. `defaultOpen` mora no MENU, não na barra: cada par
 * de gatilho e painel governa a própria abertura, e é o que permite abrir um
 * sem que os vizinhos saibam.
 */
export function menubarOpenSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>`,
  true,
)}
${menu('Editar', `      <MenubarItem>Desfazer</MenubarItem>`)}
</Menubar>`,
  );
}

/**
 * Item bloqueado. O primitivo publica `aria-disabled`, e não o atributo
 * `disabled`: o item continua alcançável pela seta para ser ANUNCIADO como
 * indisponível, em vez de sumir sem explicação de quem navega por teclado.
 */
export function menubarItemBloqueadoSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>
      <MenubarItem disabled>Enviar para revisão</MenubarItem>`,
)}
</Menubar>`,
  );
}

/**
 * Item marcado. `defaultChecked` liga a linha na montagem; a AUSÊNCIA da prop é
 * o estado desmarcado — escrever `defaultChecked={false}` só repetiria o padrão.
 *
 * O `MenubarLabel` vem sempre dentro de um `MenubarGroup`: nesta stack o rótulo
 * é quem vira o `aria-labelledby` do grupo, e sem o grupo ancestral ele lança em
 * tempo de render.
 */
export function menubarItemCheckedSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Exibir',
  `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
)}
</Menubar>`,
  );
}

/**
 * Submenu. `MenubarSub` empilha outro par de gatilho e painel DENTRO do painel,
 * e o pai continua aberto: é isso que distingue submenu de troca de menu.
 */
export function menubarSubmenuSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarSub',
      'MenubarSubContent',
      'MenubarSubTrigger',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarItem>Novo</MenubarItem>
      <MenubarSub>
        <MenubarSubTrigger>Exportar</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem>PDF</MenubarItem>
          <MenubarItem>CSV</MenubarItem>
          <MenubarItem>PNG</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>`,
)}
</Menubar>`,
  );
}

/**
 * Alternadores independentes: cada linha vale por si, e marcar uma não fecha o
 * menu — quem marca uma quer marcar a próxima.
 */
export function selectionMenubarBoxesSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Exibir',
  `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem>Barra lateral</MenubarCheckboxItem>
        <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
)}
</Menubar>`,
  );
}

/**
 * Escolha única. O grupo é quem guarda o valor — os itens só declaram o seu —, e
 * por isso a marcação se transfere sozinha de um para o outro.
 */
export function menubarChoiceUnicaSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarRadioGroup',
      'MenubarRadioItem',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Aparência',
  `      <MenubarRadioGroup defaultValue="light">
        <MenubarLabel>Tema</MenubarLabel>
        <MenubarRadioItem value="light">Claro</MenubarRadioItem>
        <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
        <MenubarRadioItem value="system">Do sistema</MenubarRadioItem>
      </MenubarRadioGroup>`,
)}
</Menubar>`,
  );
}

/**
 * A barra completa de um editor: as quatro categorias clássicas convivendo, com
 * grupo rotulado, separador, ação destrutiva, atalhos e alternadores. É a única
 * composição que mostra as peças CONVIVENDO — cada uma sozinha esconde o custo
 * de arrumar a hierarquia dentro de um painel só.
 */
export function menubarEditorSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarItem',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarSeparator',
      'MenubarShortcut',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Arquivo',
  `      <MenubarGroup>
        <MenubarLabel>Documento</MenubarLabel>
        <MenubarItem>
          Novo <MenubarShortcut>Ctrl+N</MenubarShortcut>
        </MenubarItem>
        <MenubarItem>
          Abrir <MenubarShortcut>Ctrl+O</MenubarShortcut>
        </MenubarItem>
      </MenubarGroup>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>`,
)}
${menu(
  'Editar',
  `      <MenubarItem>
        Desfazer <MenubarShortcut>Ctrl+Z</MenubarShortcut>
      </MenubarItem>
      <MenubarItem>
        Refazer <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
      </MenubarItem>`,
)}
${menu(
  'Exibir',
  `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem defaultChecked>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
)}
${menu(
  'Ajuda',
  `      <MenubarItem>Documentação</MenubarItem>
      <MenubarItem>Atalhos de teclado</MenubarItem>`,
)}
</Menubar>`,
  );
}

/**
 * Menu CONTROLADO — o par `open` / `onOpenChange` no `MenubarMenu`.
 *
 * É a forma que o conteúdo compartilhado ensina em `props.extensibilityCode`, e
 * a única em que quem consome decide a abertura. Os dois lados aparecem de
 * propósito: sem o retorno ligado, o menu abre e NUNCA fecha — nem por Escape,
 * nem por clique fora —, que é armadilha de teclado (WCAG 2.1.2).
 *
 * O botão externo entra no trecho porque ele é o assunto, e não andaime de
 * captura: é ele que mostra o estado de fora comandando o menu. `modal={false}`
 * e as medidas da moldura continuam fora, como no resto deste módulo.
 */
export function menubarControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";\n${importingMenubar(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarTrigger',
    )}\n\nconst [open, setOpen] = useState(false);`,
    `<>
  <button type="button" onClick={() => setOpen(true)}>
    Abrir Arquivo
  </button>

  <Menubar>
    <MenubarMenu open={open} onOpenChange={setOpen}>
      <MenubarTrigger>Arquivo</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>Novo</MenubarItem>
        <MenubarItem>Abrir</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
    <MenubarMenu>
      <MenubarTrigger>Editar</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>Desfazer</MenubarItem>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</>`,
  );
}

/**
 * Marcação mista: os três estados de um item de marcação lado a lado.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Os três vão por extenso — o assunto é o CONTRASTE entre eles. `indeterminate`
 * é prop do wrapper, e controlada: o primeiro clique chama
 * `onCheckedChange(true)`, e é ali que quem guarda o estado tira o misto.
 */
export function menubarCheckboxIndeterminateSource(): string {
  return jsxSnippet(
    importingMenubar(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar>
${menu(
  'Exibir',
  `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem checked={false} indeterminate>
          Colunas
        </MenubarCheckboxItem>
        <MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem checked={false}>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
)}
</Menubar>`,
  );
}

// ─── A barra como DADO: uma lista monta a prévia e imprime o código ───────────
//
// Os cards de Variantes da docs page tinham um literal de código em português
// ao lado de cada prévia — e dois deles nem prévia tinham, só o texto
// `variant="default"`. É o desenho do ContextMenu desta stack e do vanilla: a
// MESMA lista vira a barra viva e o trecho que se copia, então os dois não têm
// como divergir — nem de idioma, nem de estrutura.

/**
 * Item de ação. `value` é o id ESTÁVEL do item — é o que o evento de escolha
 * manda ao GA4 —, e o snippet não o imprime: o item de ação não tem `value`.
 */
export type MenubarActionEntry = {
  kind: 'item';
  label: string;
  value: string;
  shortcut?: string;
  destructive?: boolean;
};

/**
 * Item de marcação. `value` é o id estável e também dá NOME ao estado no
 * snippet: `show-ruler` vira `const [showRuler, setShowRuler]`.
 */
export type MenubarCheckboxEntry = {
  kind: 'checkbox';
  label: string;
  value: string;
  checked: boolean;
};

/**
 * Submenu — que pode conter OUTRO submenu. A barra não o recomenda (é o "evite"
 * do Do & Don't), mas precisa conseguir mostrá-lo vivo para que o defeito seja
 * visto, e não descrito.
 */
export type MenubarSubmenuEntry = {
  kind: 'submenu';
  label: string;
  items: Array<MenubarActionEntry | MenubarSubmenuEntry>;
};

/**
 * Uma entrada de um menu da barra. O rótulo do grupo de escolha única é
 * opcional: onde ele existe, mora DENTRO do `MenubarRadioGroup`, que é quem ele
 * nomeia — um `MenubarGroup` em volta anunciaria dois grupos, um anônimo.
 */
export type MenubarEntry =
  | MenubarActionEntry
  | MenubarCheckboxEntry
  | MenubarSubmenuEntry
  | { kind: 'separator' }
  | { kind: 'group'; label: string; items: Array<MenubarActionEntry | MenubarCheckboxEntry> }
  | {
      kind: 'radio-group';
      label?: string;
      /** Id estável do grupo e nome do estado no snippet. */
      value: string;
      /** A opção marcada ao montar. */
      selected: string;
      /** `value` de cada opção é o id estável dela — e o do evento de escolha. */
      options: Array<{ label: string; value: string }>;
    };

/** Um menu da barra: o texto do gatilho e o que o painel lista. */
export type MenubarMenuEntry = {
  label: string;
  entries: readonly MenubarEntry[];
};

/** `show-ruler` → `showRuler`: o nome do estado sai do id estável. */
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

function actionLines(entry: MenubarActionEntry, pad: string): string[] {
  const open = `<MenubarItem${entry.destructive ? ' variant="destructive"' : ''}>`;
  if (!entry.shortcut) return [`${pad}${open}${jsxText(entry.label)}</MenubarItem>`];
  return [
    `${pad}${open}`,
    `${pad}  ${jsxText(entry.label)} <MenubarShortcut>${jsxText(entry.shortcut)}</MenubarShortcut>`,
    `${pad}</MenubarItem>`,
  ];
}

function submenuLines(entry: MenubarSubmenuEntry, pad: string): string[] {
  return [
    `${pad}<MenubarSub>`,
    `${pad}  <MenubarSubTrigger>${jsxText(entry.label)}</MenubarSubTrigger>`,
    `${pad}  <MenubarSubContent>`,
    ...entry.items.flatMap((item) =>
      item.kind === 'submenu' ? submenuLines(item, `${pad}    `) : actionLines(item, `${pad}    `),
    ),
    `${pad}  </MenubarSubContent>`,
    `${pad}</MenubarSub>`,
  ];
}

function entryLines(entry: MenubarEntry, pad: string): string[] {
  switch (entry.kind) {
    case 'item':
      return actionLines(entry, pad);
    case 'separator':
      return [`${pad}<MenubarSeparator />`];
    case 'checkbox': {
      const state = stateName(entry.value);
      return [
        `${pad}<MenubarCheckboxItem checked={${state}} onCheckedChange={${setterName(state)}}>`,
        `${pad}  ${jsxText(entry.label)}`,
        `${pad}</MenubarCheckboxItem>`,
      ];
    }
    case 'submenu':
      return submenuLines(entry, pad);
    case 'group':
      return [
        `${pad}<MenubarGroup>`,
        `${pad}  <MenubarLabel>${jsxText(entry.label)}</MenubarLabel>`,
        ...entry.items.flatMap((item) => entryLines(item, `${pad}  `)),
        `${pad}</MenubarGroup>`,
      ];
    case 'radio-group': {
      const state = stateName(entry.value);
      return [
        `${pad}<MenubarRadioGroup value={${state}} onValueChange={${setterName(state)}}>`,
        ...(entry.label ? [`${pad}  <MenubarLabel>${jsxText(entry.label)}</MenubarLabel>`] : []),
        ...entry.options.map(
          (option) =>
            `${pad}  <MenubarRadioItem value=${JSON.stringify(option.value)}>${jsxText(option.label)}</MenubarRadioItem>`,
        ),
        `${pad}</MenubarRadioGroup>`,
      ];
    }
  }
}

/** O `useState` de cada marcação e de cada grupo de escolha única, na ordem da barra. */
function stateLines(entries: readonly MenubarEntry[]): string[] {
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
function entryParts(entries: readonly MenubarEntry[], parts: Set<string>): Set<string> {
  for (const entry of entries) {
    switch (entry.kind) {
      case 'item':
        parts.add('MenubarItem');
        if (entry.shortcut) parts.add('MenubarShortcut');
        break;
      case 'separator':
        parts.add('MenubarSeparator');
        break;
      case 'checkbox':
        parts.add('MenubarCheckboxItem');
        break;
      case 'submenu':
        parts.add('MenubarSub').add('MenubarSubTrigger').add('MenubarSubContent');
        entryParts(entry.items, parts);
        break;
      case 'group':
        parts.add('MenubarGroup').add('MenubarLabel');
        entryParts(entry.items, parts);
        break;
      case 'radio-group':
        parts.add('MenubarRadioGroup').add('MenubarRadioItem');
        if (entry.label) parts.add('MenubarLabel');
        break;
    }
  }
  return parts;
}

/** A barra canônica, a mesma do `meta`: dois menus com atalho. */
const MENUS_DEFAULT: readonly MenubarMenuEntry[] = [
  {
    label: 'Arquivo',
    entries: [
      { kind: 'item', label: 'Novo', value: 'new', shortcut: 'Ctrl+N' },
      { kind: 'item', label: 'Abrir', value: 'open', shortcut: 'Ctrl+O' },
    ],
  },
  {
    label: 'Editar',
    entries: [
      { kind: 'item', label: 'Desfazer', value: 'undo', shortcut: 'Ctrl+Z' },
      { kind: 'item', label: 'Refazer', value: 'redo', shortcut: 'Ctrl+Shift+Z' },
    ],
  },
];

export type MenubarSnippetOptions = {
  /** Os menus da barra, na ordem; sem eles, a barra canônica. */
  menus?: readonly MenubarMenuEntry[];
};

/**
 * O trecho da barra descrita por `menus`, com os rótulos EXATAMENTE como
 * chegam — quem chama os lê do conteúdo compartilhado, no idioma da página.
 *
 * O trecho é o que se COLA: o import só das peças usadas e, havendo marcação ou
 * escolha única, o `useState` de cada uma dentro de um componente. Sem `menus`
 * o construtor cai na barra canônica, que é como a guarda transversal o chama.
 */
export function menubarSnippet(o: MenubarSnippetOptions = {}): string {
  const menus = o.menus ?? MENUS_DEFAULT;
  const allEntries = menus.flatMap((m) => m.entries);
  const state = stateLines(allEntries);
  const parts = entryParts(allEntries, new Set(['Menubar', 'MenubarContent', 'MenubarMenu', 'MenubarTrigger']));
  const bar = `<Menubar>
${menus
  .map((m) => menu(jsxText(m.label), m.entries.flatMap((entry) => entryLines(entry, '      ')).join('\n')))
  .join('\n')}
</Menubar>`;

  if (state.length === 0) return jsxSnippet(importingMenubar(...parts), bar);

  return jsxSnippet(
    `import { useState } from "react";
${importingMenubar(...parts)}`,
    `function MenubarWithState() {
${indentar(state.join('\n'), '  ')}

  return (
${indentar(bar, '    ')}
  );
}`,
  );
}
