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
    | 'editor';
};

/** Ordem estável dos nomes no bloco de import, independente da composição. */
const ORDER = [
  'Menubar',
  'MenubarMenu',
  'MenubarTrigger',
  'MenubarContent',
  'MenubarItem',
  'MenubarGroup',
  'MenubarGroupHeading',
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
      parts: [...BASE, 'MenubarGroup', 'MenubarGroupHeading', 'MenubarCheckboxItem'],
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
        <MenubarGroupHeading>Mostrar na tela</MenubarGroupHeading>
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
      parts: [...BASE, 'MenubarGroupHeading', 'MenubarRadioGroup', 'MenubarRadioItem'],
      state: ['let tema = $state("light");'],
      menus: menu(
        'theme',
        'Aparência',
        `      <MenubarRadioGroup bind:value={tema}>
        <MenubarGroupHeading>Tema</MenubarGroupHeading>
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

  if (demonstration === 'editor') {
    return {
      parts: [
        ...BASE,
        'MenubarItem',
        'MenubarGroup',
        'MenubarGroupHeading',
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
        <MenubarGroupHeading>Documento</MenubarGroupHeading>
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
        <MenubarGroupHeading>Mostrar na tela</MenubarGroupHeading>
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
