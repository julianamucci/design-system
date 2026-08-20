/**
 * Transforms do painel Code do ContextMenu.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * Os snippets usam os nomes longos (`ContextMenuTrigger`, `ContextMenuItem`…)
 * porque é essa a API que o `index.ts` publica e por onde quem consome escreve.
 */
import { svelteSnippet } from '@/lib/story-source';

export type ContextMenuArgs = {
  triggerLabel: string;
  showDestructive: boolean;
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
  'nds-cluster nds-w-cap-xs nds-p-8 nds-rounded-md nds-border-default ' +
  'nds-border-dashed nds-text-body nds-text-muted-foreground nds-cursor-default';

/** Ordem canônica das peças no bloco de import. */
const ORDEM = [
  'ContextMenu',
  'ContextMenuTrigger',
  'ContextMenuContent',
  'ContextMenuLabel',
  'ContextMenuGroup',
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
function importar(pecas: string[]): string {
  const usadas = ORDEM.filter((peca) => pecas.includes(peca));
  return `import {
${usadas.map((peca) => `  ${peca},`).join('\n')}
} from "@/components/ui/context-menu";`;
}

/** Um item do menu, com ou sem atalho ao lado do rótulo. */
function item(
  rotulo: string,
  opcoes: { atalho?: string; props?: string; indent?: string } = {},
): string {
  const { atalho, props = '', indent = '    ' } = opcoes;
  if (!atalho) return `${indent}<ContextMenuItem${props}>${rotulo}</ContextMenuItem>`;
  return `${indent}<ContextMenuItem${props}>
${indent}  ${rotulo}
${indent}  <ContextMenuShortcut>${atalho}</ContextMenuShortcut>
${indent}</ContextMenuItem>`;
}

/**
 * O gesto e o painel em volta do conteúdo do menu.
 *
 * O conteúdo já chega indentado com quatro espaços.
 */
function menu(conteudo: string, rotulo = 'Clique com o botão direito aqui'): string {
  return `<ContextMenu>
  <ContextMenuTrigger
    class="${AREA}"
    data-align="center"
    data-justify="center"
  >
    ${rotulo}
  </ContextMenuTrigger>
  <ContextMenuContent>
${conteudo}
  </ContextMenuContent>
</ContextMenu>`;
}

/**
 * Forma canônica: a área do gesto, um grupo de ações e a ação destrutiva
 * separada delas. Serve o Playground e cascateia como padrão dos arquivos de
 * estados e composições.
 */
export function contextMenuSource(
  _gerado?: string,
  ctx?: { args?: Partial<ContextMenuArgs> },
): string {
  const {
    triggerLabel = 'Clique com o botão direito aqui',
    showDestructive = true,
    showShortcuts = true,
  } = ctx?.args ?? {};

  const linhas = [
    '    <ContextMenuGroup>',
    item('Editar', { atalho: showShortcuts ? '⌘E' : undefined, indent: '      ' }),
    item('Duplicar', { indent: '      ' }),
    '    </ContextMenuGroup>',
  ];

  if (showDestructive) {
    linhas.push('    <ContextMenuSeparator />');
    linhas.push(
      item('Excluir', {
        atalho: showShortcuts ? '⌫' : undefined,
        props: ' variant="destructive"',
      }),
    );
  }

  const pecas = [
    'ContextMenu',
    'ContextMenuTrigger',
    'ContextMenuContent',
    'ContextMenuGroup',
    'ContextMenuItem',
    ...(showDestructive ? ['ContextMenuSeparator'] : []),
    ...(showShortcuts ? ['ContextMenuShortcut'] : []),
  ];

  return svelteSnippet(importar(pecas), menu(linhas.join('\n'), triggerLabel));
}

/** Estado ItemDisabled: o item indisponível não recebe ponteiro nem Enter. */
export function contextMenuItemDesabilitadoSource(): string {
  return svelteSnippet(
    importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuSeparator',
    ]),
    menu(`    <ContextMenuGroup>
      <ContextMenuItem>Editar</ContextMenuItem>
      <ContextMenuItem disabled>Duplicar</ContextMenuItem>
      <ContextMenuItem>Renomear</ContextMenuItem>
    </ContextMenuGroup>
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
export function contextMenuItemRecuadoSource(): string {
  return svelteSnippet(
    importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuLabel',
      'ContextMenuItem',
      'ContextMenuSeparator',
    ]),
    menu(`    <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
    <ContextMenuItem>Editar</ContextMenuItem>
    <ContextMenuItem inset>Duplicar</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem inset variant="destructive">Excluir</ContextMenuItem>`),
  );
}

/** Estado ItemDestructive: a ação perigosa se declara por prop, não por cor. */
export function contextMenuItemDestrutivoSource(): string {
  return svelteSnippet(
    importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ]),
    menu(`${item('Editar', { atalho: '⌘E' })}
    <ContextMenuItem>Duplicar</ContextMenuItem>
    <ContextMenuSeparator />
${item('Excluir permanentemente', { atalho: '⌫', props: ' variant="destructive"' })}`),
  );
}

/**
 * Estado CheckboxIndeterminate: os três estados de uma marcação.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Sem `indeterminate` os dois sairiam com o mesmo glifo e significados
 * diferentes.
 */
export function contextMenuMarcacaoMistaSource(): string {
  return svelteSnippet(
    importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuLabel',
      'ContextMenuCheckboxItem',
    ]),
    menu(`    <ContextMenuLabel>Mostrar na tela</ContextMenuLabel>
    <ContextMenuCheckboxItem indeterminate>Colunas</ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem checked>Régua</ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem>Grade</ContextMenuCheckboxItem>`),
  );
}

/**
 * Estado DarkPalette: o mesmo markup, outra paleta.
 *
 * A troca de tema é global (classe no documento) e não muda uma linha do menu —
 * é exatamente isso que a story mostra.
 */
export function contextMenuPaletaEscuraSource(): string {
  return svelteSnippet(
    importar([
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
export function contextMenuComAtalhosSource(): string {
  return svelteSnippet(
    importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ]),
    menu(`${item('Editar', { atalho: '⌘E' })}
${item('Desfazer', { atalho: '⌘Z' })}
    <ContextMenuSeparator />
${item('Excluir', { atalho: '⌫', props: ' variant="destructive"' })}`),
  );
}

/** Composição WithCheckbox: cada item guarda a própria marcação. */
export function contextMenuComMarcacaoSource(): string {
  return svelteSnippet(
    `${importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuLabel',
      'ContextMenuCheckboxItem',
    ])}

let mostrarGrade = $state(false);
let mostrarReguas = $state(true);`,
    menu(`    <ContextMenuLabel>Visualização</ContextMenuLabel>
    <ContextMenuCheckboxItem bind:checked={mostrarGrade}>
      Mostrar grade
    </ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem bind:checked={mostrarReguas}>
      Mostrar réguas
    </ContextMenuCheckboxItem>`),
  );
}

/** Composição WithRadioGroup: escolha única, o valor vive no grupo. */
export function contextMenuComEscolhaUnicaSource(): string {
  return svelteSnippet(
    `${importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuLabel',
      'ContextMenuRadioGroup',
      'ContextMenuRadioItem',
    ])}

let layout = $state('grid');`,
    menu(`    <ContextMenuLabel>Layout</ContextMenuLabel>
    <ContextMenuRadioGroup bind:value={layout}>
      <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
      <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
      <ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>
    </ContextMenuRadioGroup>`),
  );
}

/** Composição WithSubmenu: o segundo nível abre ao lado do item que o dispara. */
export function contextMenuComSubmenuSource(): string {
  return svelteSnippet(
    importar([
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

/**
 * Composição completa: marcação, escolha única e submenu no mesmo menu.
 *
 * Aqui o agrupamento é nomeado pela dupla `ContextMenuGroup` +
 * `ContextMenuGroupHeading` — o cabeçalho vira o nome do grupo, e é isso que
 * faz o leitor de tela anunciar "Ações, grupo" em vez de um bloco anônimo. O
 * rótulo solto desenha igual e não amarra nada.
 */
export function contextMenuCompletoSource(): string {
  return svelteSnippet(
    `${importar([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
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

let mostrarGrade = $state(false);
let layout = $state('grid');`,
    menu(`    <ContextMenuGroup>
      <ContextMenuGroupHeading>Ações</ContextMenuGroupHeading>
${item('Editar', { atalho: '⌘E', indent: '      ' })}
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
      <ContextMenuGroupHeading>Visualização</ContextMenuGroupHeading>
      <ContextMenuCheckboxItem bind:checked={mostrarGrade}>
        Mostrar grade
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuGroup>
      <ContextMenuGroupHeading>Layout</ContextMenuGroupHeading>
      <ContextMenuRadioGroup bind:value={layout}>
        <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
        <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuGroup>
    <ContextMenuSeparator />
${item('Excluir', { atalho: '⌫', props: ' variant="destructive"' })}`),
  );
}
