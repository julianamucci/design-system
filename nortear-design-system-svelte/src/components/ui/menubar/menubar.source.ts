/**
 * Transforms do painel Code do Menubar.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 *
 * O espião `onSelect` das stories não entra no snippet: ele existe para a aba
 * Actions, e o que o componente ensina é a composição.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';
import {
  menuEntriesDeclarations,
  menuEntriesMarkup,
  menuEntriesParts,
  type MenuDocsEntry,
} from '@/components/ui/dropdown-menu/dropdown-menu.fixtures';

export type MenubarArgs = {
  /** Menu aberto ao montar. Nesta stack ele é o `value` da raiz, vinculável. */
  defaultValue?: string;
  loop: boolean;
  variant: 'default' | 'destructive';
  demonstration:
    | 'default'
    | 'shortcuts'
    | 'submenu'
    | 'checkbox'
    | 'indeterminate'
    | 'radio'
    | 'itemDisabled'
    | 'destructive'
    | 'editor'
    | 'long';
};

/** Ordem estável dos nomes no bloco de import, independente da composição. */
const ORDER = [
  'Menubar',
  'MenubarMenu',
  'MenubarTrigger',
  'MenubarContent',
  'MenubarItem',
  'MenubarGroup',
  'MenubarLabel',
  'MenubarSeparator',
  'MenubarShortcut',
  'MenubarCheckboxItem',
  'MenubarRadioGroup',
  'MenubarRadioItem',
  'MenubarSub',
  'MenubarSubTrigger',
  'MenubarSubContent',
];

function importing(parts: string[]): string {
  const usadas = ORDER.filter((name) => parts.includes(name));
  return `import {
${usadas.map((name) => `  ${name},`).join('\n')}
} from "@/components/ui/menubar";`;
}

/** Um menu da barra: gatilho na barra e painel logo abaixo. */
function menu(value: string, label: string, body: string): string {
  return `  <MenubarMenu value="${value}">
    <MenubarTrigger>${label}</MenubarTrigger>
    <MenubarContent>
${body}
    </MenubarContent>
  </MenubarMenu>`;
}

type Composition = { parts: string[]; state: string[]; menus: string };

const BASE = ['Menubar', 'MenubarMenu', 'MenubarTrigger', 'MenubarContent'];

function composition(
  demonstration: MenubarArgs['demonstration'],
  variant: MenubarArgs['variant'],
): Composition {
  if (demonstration === 'shortcuts') {
    const items = [
      ['Desfazer', 'Ctrl+Z'],
      ['Refazer', 'Ctrl+Shift+Z'],
      ['Copiar', 'Ctrl+C'],
    ]
      .map(
        ([label, atalho]) => `      <MenubarItem>
        ${label}
        <MenubarShortcut>${atalho}</MenubarShortcut>
      </MenubarItem>`,
      )
      .join('\n');

    return {
      parts: [...BASE, 'MenubarItem', 'MenubarShortcut'],
      state: [],
      menus: menu('edit', 'Editar', items),
    };
  }

  if (demonstration === 'submenu') {
    return {
      parts: [...BASE, 'MenubarItem', 'MenubarSub', 'MenubarSubTrigger', 'MenubarSubContent'],
      state: [],
      menus: menu(
        'file',
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
      ),
    };
  }

  if (demonstration === 'checkbox') {
    return {
      parts: [...BASE, 'MenubarGroup', 'MenubarLabel', 'MenubarCheckboxItem'],
      state: [
        'let regua = $state(true);',
        'let barraLateral = $state(false);',
        'let grade = $state(false);',
      ],
      menus: menu(
        'view',
        'Exibir',
        // O par grupo + cabeçalho é o que dá nome ao conjunto de alternadores:
        // o cabeçalho vira o `aria-labelledby` do grupo.
        `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem bind:checked={barraLateral}>Barra lateral</MenubarCheckboxItem>
        <MenubarCheckboxItem bind:checked={grade}>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
      ),
    };
  }

  if (demonstration === 'indeterminate') {
    return {
      parts: [...BASE, 'MenubarLabel', 'MenubarCheckboxItem'],
      state: [],
      menus: menu(
        'view',
        'Exibir',
        `      <MenubarLabel>Mostrar na tela</MenubarLabel>
      <MenubarCheckboxItem indeterminate>Colunas</MenubarCheckboxItem>
      <MenubarCheckboxItem checked>Régua</MenubarCheckboxItem>
      <MenubarCheckboxItem>Grade</MenubarCheckboxItem>`,
      ),
    };
  }

  if (demonstration === 'radio') {
    return {
      parts: [...BASE, 'MenubarLabel', 'MenubarRadioGroup', 'MenubarRadioItem'],
      state: ['let tema = $state("light");'],
      menus: menu(
        'theme',
        'Aparência',
        `      <MenubarRadioGroup bind:value={tema}>
        <MenubarLabel>Tema</MenubarLabel>
        <MenubarRadioItem value="light">Claro</MenubarRadioItem>
        <MenubarRadioItem value="dark">Escuro</MenubarRadioItem>
        <MenubarRadioItem value="system">Do sistema</MenubarRadioItem>
      </MenubarRadioGroup>`,
      ),
    };
  }

  if (demonstration === 'itemDisabled') {
    return {
      parts: [...BASE, 'MenubarItem'],
      state: [],
      menus: menu(
        'file',
        'Arquivo',
        `      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Salvar</MenubarItem>
      <MenubarItem disabled>Enviar para revisão</MenubarItem>`,
      ),
    };
  }

  if (demonstration === 'destructive') {
    return {
      parts: [...BASE, 'MenubarItem', 'MenubarSeparator'],
      state: [],
      menus: menu(
        'file',
        'Arquivo',
        `      <MenubarItem>Salvar</MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>`,
      ),
    };
  }

  if (demonstration === 'long') {
    // O menu mais alto que a janela: o painel recorta e rola sozinho, pela
    // folha, sem nada a declarar no markup. É essa a lição do snippet — quem
    // copia não precisa de prop nenhuma para o menu longo caber.
    return {
      parts: [...BASE, 'MenubarItem'],
      state: [],
      menus: menu(
        'file',
        'Arquivo',
        Array.from(
          { length: 60 },
          (_, i) => `      <MenubarItem>Ação ${i + 1}</MenubarItem>`,
        ).join('\n'),
      ),
    };
  }

  if (demonstration === 'editor') {
    return {
      parts: [
        ...BASE,
        'MenubarItem',
        'MenubarGroup',
        'MenubarLabel',
        'MenubarSeparator',
        'MenubarShortcut',
        'MenubarCheckboxItem',
      ],
      state: ['let regua = $state(true);', 'let grade = $state(false);'],
      menus: [
        menu(
          'file',
          'Arquivo',
          `      <MenubarGroup>
        <MenubarLabel>Documento</MenubarLabel>
        <MenubarItem>Novo <MenubarShortcut>Ctrl+N</MenubarShortcut></MenubarItem>
        <MenubarItem>Abrir <MenubarShortcut>Ctrl+O</MenubarShortcut></MenubarItem>
      </MenubarGroup>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>`,
        ),
        menu(
          'edit',
          'Editar',
          `      <MenubarItem>Desfazer <MenubarShortcut>Ctrl+Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Refazer <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut></MenubarItem>`,
        ),
        menu(
          'view',
          'Exibir',
          `      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem bind:checked={regua}>Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem bind:checked={grade}>Grade</MenubarCheckboxItem>
      </MenubarGroup>`,
        ),
        menu(
          'help',
          'Ajuda',
          `      <MenubarItem>Documentação</MenubarItem>
      <MenubarItem>Atalhos de teclado</MenubarItem>`,
        ),
      ].join('\n'),
    };
  }

  // default: as quatro categorias clássicas de uma aplicação de mesa.
  const enfase = variant === 'destructive' ? ' variant="destructive"' : '';
  const categorias: Array<[string, string, string[]]> = [
    ['file', 'Arquivo', ['Novo', 'Abrir', 'Salvar']],
    ['edit', 'Editar', ['Desfazer', 'Refazer', 'Copiar']],
    ['view', 'Exibir', ['Aproximar', 'Afastar', 'Tela cheia']],
    ['help', 'Ajuda', ['Documentação', 'Atalhos de teclado']],
  ];

  return {
    parts: [...BASE, 'MenubarItem'],
    state: [],
    menus: categorias
      .map(([value, label, items]) =>
        menu(
          value,
          label,
          items.map((item) => `      <MenubarItem${enfase}>${item}</MenubarItem>`).join('\n'),
        ),
      )
      .join('\n'),
  };
}

/**
 * Transform do meta — serve o Playground e, por cascata, toda story destes
 * arquivos. A composição sai do control `demonstration`, o mesmo arg que troca
 * a marcação na tela: ler o arg é o que mantém painel e demonstração dizendo a
 * mesma coisa.
 */
export function menubarSource(_gerado?: string, ctx?: { args?: Partial<MenubarArgs> }): string {
  const {
    defaultValue,
    loop = true,
    variant = 'default',
    demonstration = 'default',
  } = ctx?.args ?? {};

  const { parts, state, menus } = composition(demonstration, variant);

  // Nesta stack o menu aberto é o `value` da raiz, vinculável: a mesma prop
  // serve de valor inicial e de leitura do estado.
  const props = attrs(
    defaultValue ? 'bind:value={menuAberto}' : '',
    loop ? '' : 'loop={false}',
  );

  const declaracoes = [
    ...(defaultValue ? [`let menuAberto = $state("${defaultValue}");`] : []),
    ...state,
  ];

  return svelteSnippet(
    declaracoes.length ? `${importing(parts)}\n\n${declaracoes.join('\n')}` : importing(parts),
    `<Menubar${props}>
${menus}
</Menubar>`,
  );
}

// ─── Overrides por story ──────────────────────────────────────────────────────
//
// As stories de variação, estado e composição nascem com um menu ABERTO para a
// captura do Chromatic, e nesta lib abrir ao montar é `bind:value` com o `value`
// do menu — `let menuAberto = $state("file")`. Isso é andaime da foto, não
// lição: uma barra que se abre sozinha ao carregar a página é justamente o que
// não se deve copiar. Os overrides abaixo reaproveitam a MESMA transform sem o
// estado de abertura, como os do DropdownMenu desta stack.
//
// `States/Closed` e `States/Open` ficam de fora de propósito: numa a barra
// fechada é o assunto, e na outra a barra aberta É a lição — ali o `bind:value`
// do meta é exatamente o que se quer ensinar. Mesma divisão do DropdownMenu.
// `Compositions/EditorCompleto` também fica: ela já monta sem `defaultValue`.

/** Variants/Default — o item neutro, sem cor semântica. */
export function menubarDefaultSource(): string {
  return menubarSource('', { args: { variant: 'default', demonstration: 'default' } });
}

/** Variants/Destructive — a ação irreversível marcada pela cor de perigo. */
export function menubarDestructiveSource(): string {
  return menubarSource('', { args: { demonstration: 'destructive' } });
}

/** States/ItemDisabled — o item indisponível continua no menu, e é anunciado. */
export function menubarItemDisabledSource(): string {
  return menubarSource('', { args: { demonstration: 'itemDisabled' } });
}

/** States/CheckboxChecked — o alternador marcado ao montar, dentro do grupo nomeado. */
export function menubarCheckboxCheckedSource(): string {
  return menubarSource('', { args: { demonstration: 'checkbox' } });
}

/** States/CheckboxIndeterminate — os três estados do alternador lado a lado. */
export function menubarCheckboxIndeterminateSource(): string {
  return menubarSource('', { args: { demonstration: 'indeterminate' } });
}

/** Compositions/WithShortcuts — o atalho encostado na borda direita do item. */
export function menubarWithShortcutsSource(): string {
  return menubarSource('', { args: { demonstration: 'shortcuts' } });
}

/** Compositions/WithSubmenu — um segundo nível que abre ao lado. */
export function menubarWithSubmenuSource(): string {
  return menubarSource('', { args: { demonstration: 'submenu' } });
}

/** Compositions/WithCheckboxItems — alternadores independentes entre si. */
export function menubarWithCheckboxSource(): string {
  return menubarSource('', { args: { demonstration: 'checkbox' } });
}

/** Compositions/WithRadioGroup — escolha única dentro de um menu da barra. */
export function menubarWithRadioSource(): string {
  return menubarSource('', { args: { demonstration: 'radio' } });
}

/**
 * States/LongMenu — o menu mais alto que a janela (D17).
 *
 * Nada no markup declara rolagem: quem recorta é o `max-height` de
 * `.nds-dropdown-menu-content`, e quem rola é o `overflow-y: auto` da mesma
 * folha. O snippet é longo de propósito — é a altura que faz a lição.
 */
export function menubarLongMenuSource(): string {
  return menubarSource('', { args: { demonstration: 'long' } });
}

/**
 * Barra CONTROLADA — `bind:value` na RAIZ.
 *
 * É a forma que `props.extensibilityCode` ensina, e nesta lib quem guarda a
 * abertura é a raiz: o valor é o `value` do menu aberto, e string vazia é a
 * barra fechada. Controlar um menu só, deixando os vizinhos de fora, não existe
 * aqui — a divergência é de API de framework, e fica registrada assim.
 *
 * O botão externo entra no trecho porque ele é o assunto: é ele que mostra o
 * estado de fora comandando a barra. E a ligação é de MÃO DUPLA por construção —
 * sem o caminho de volta o menu abriria e nunca mais fecharia, nem por Escape,
 * que é armadilha de teclado (WCAG 2.1.2).
 */
export function menubarControlledSource(): string {
  return svelteSnippet(
    `${importing([
      'Menubar',
      'MenubarMenu',
      'MenubarTrigger',
      'MenubarContent',
      'MenubarItem',
    ])}

let menuAberto = $state("");`,
    `<button type="button" onclick={() => (menuAberto = "file")}>
  Abrir Arquivo
</button>

<Menubar bind:value={menuAberto}>
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

// ─── Cards de Variantes da docs page ──────────────────────────────────────────
//
// A lista é a do DropdownMenu (`dropdown-menu/dropdown-menu.fixtures.ts`): um
// menu da barra É um DropdownMenu, com as mesmas entradas. O que este módulo
// acrescenta é a barra em volta — um `MenubarMenu` por gatilho, e o prefixo
// `Menubar` nas peças.

/** Um menu da barra de um card: o `value` dele, o texto do gatilho e as entradas. */
export type MenubarDocsMenu = { value: string; triggerLabel: string; entries: MenuDocsEntry[] };

/**
 * A barra que `menubarEntriesSource` escreve quando ninguém passa outra.
 *
 * Passa por todo tipo de entrada — item com atalho e destrutivo, divisória,
 * submenu, grupo nomeado com marcação e grupo de rádio —, e por mais de um menu
 * na mesma barra: a varredura transversal chama o construtor sem argumento e
 * confere que cada `bind:` tem a variável declarada no script do exemplo.
 */
const COMPLETE_MENUS: MenubarDocsMenu[] = [
  {
    value: 'file',
    triggerLabel: 'Arquivo',
    entries: [
      { type: 'item', label: 'Novo', value: 'new', shortcut: 'Ctrl+N' },
      {
        type: 'submenu',
        label: 'Exportar',
        items: [
          { type: 'item', label: 'PDF', value: 'pdf' },
          { type: 'item', label: 'CSV', value: 'csv' },
        ],
      },
      { type: 'separator' },
      { type: 'item', label: 'Excluir arquivo', value: 'delete-file', variant: 'destructive' },
    ],
  },
  {
    value: 'view',
    triggerLabel: 'Exibir',
    entries: [
      {
        type: 'group',
        label: 'Painéis',
        items: [{ type: 'checkbox', label: 'Barra lateral', value: 'sidebar', checked: true }],
      },
      {
        type: 'radio-group',
        label: 'Aparência',
        name: 'theme',
        value: 'dark',
        items: [
          { label: 'Claro', value: 'light' },
          { label: 'Escuro', value: 'dark' },
        ],
      },
    ],
  },
];

/**
 * O código de um card de Variantes, a partir da MESMA lista de menus que monta
 * a prévia. Os gatilhos e os rótulos chegam traduzidos, então o código fala o
 * idioma da prévia nos três idiomas — até 2026-09-11 cada card tinha um literal
 * em português, e os de `default` e `destructive` mostravam um item solto que a
 * prévia não tinha. Serve também ao exemplo de uso da seção Importação.
 *
 * Sem argumento, escreve `COMPLETE_MENUS`: é assim que a varredura transversal
 * alcança o construtor que a docs page usa.
 */
export function menubarEntriesSource(options: { menus?: MenubarDocsMenu[] } = {}): string {
  const { menus = COMPLETE_MENUS } = options;
  const everything = menus.flatMap((entry) => entry.entries);
  const parts = [...menuEntriesParts('Menubar', everything, new Set(BASE))];
  const declarations = menuEntriesDeclarations(everything);

  return svelteSnippet(
    declarations.length ? `${importing(parts)}\n\n${declarations.join('\n')}` : importing(parts),
    `<Menubar>
${menus
  .map(({ value, triggerLabel, entries }) =>
    menu(value, triggerLabel, menuEntriesMarkup('Menubar', entries, '      ').join('\n')),
  )
  .join('\n')}
</Menubar>`,
  );
}
