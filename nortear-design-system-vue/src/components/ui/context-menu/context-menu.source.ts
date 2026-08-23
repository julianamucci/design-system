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

/**
 * Forma canônica: a área do gesto, um grupo de ações e a ação destrutiva
 * separada delas.
 *
 * `modal` nasce ligado na raiz — só a desativação entra no snippet.
 */
export const contextMenuSource: SourceTransform<ContextMenuArgs> = (_gerado, ctx) => {
  const label = text(ctx?.args?.triggerLabel, LABEL_DEFAULT);
  return vueSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ]),
    menu(
      `    <ContextMenuGroup>
${item('Editar', { atalho: '⌘E', recuo: '      ' })}
${item('Duplicar', { recuo: '      ' })}
    </ContextMenuGroup>
    <ContextMenuSeparator />
${item('Excluir', { atalho: '⌫', props: ' variant="destructive"' })}`,
      { label, root: attrBool('modal', ctx?.args?.modal, true) },
    ),
  );
};

/** Estado ItemDisabled: o item indisponível não recebe ponteiro nem Enter. */
export function contextMenuItemDisabledSource(): string {
  return vueSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ]),
    menu(`    <ContextMenuGroup>
${item('Editar', { atalho: '⌘E', recuo: '      ' })}
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
  return vueSnippet(
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
  return vueSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuItem',
      'ContextMenuSeparator',
      'ContextMenuShortcut',
    ]),
    menu(`    <ContextMenuGroup>
${item('Editar', { atalho: '⌘E', recuo: '      ' })}
      <ContextMenuItem>Duplicar</ContextMenuItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
${item('Excluir permanentemente', { atalho: '⌫', props: ' variant="destructive"' })}`),
  );
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
 */
export function contextMenuMarkupMistaSource(): string {
  return vueSnippet(
    importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuLabel',
      'ContextMenuCheckboxItem',
    ]),
    menu(`    <ContextMenuLabel>Mostrar na tela</ContextMenuLabel>
    <ContextMenuCheckboxItem checked="indeterminate">Colunas</ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem :checked="true">Régua</ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem :checked="false">Grade</ContextMenuCheckboxItem>`),
  );
}

/**
 * Estado DarkPalette: o mesmo markup, outra paleta.
 *
 * A troca de tema é global (classe no documento) e não muda uma linha do menu —
 * é exatamente isso que a story mostra.
 */
export function contextMenuPaletteDarkSource(): string {
  return vueSnippet(
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
  return vueSnippet(
    importing([
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

/**
 * Composição WithCheckbox: cada item guarda a própria marcação.
 *
 * `v-model:checked` é o par completo — a prop entra e o evento volta. Ligar só
 * `:checked` deixaria o item preso ao valor inicial.
 */
export function contextMenuWithMarkupSource(): string {
  return vueSnippet(
    `${importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuCheckboxItem',
    ])}
import { ref } from 'vue'

const mostrarGrade = ref(false)
const mostrarReguas = ref(true)`,
    menu(`    <ContextMenuGroup>
      <ContextMenuLabel>Visualização</ContextMenuLabel>
      <ContextMenuCheckboxItem v-model:checked="mostrarGrade">
        Mostrar grade
      </ContextMenuCheckboxItem>
      <ContextMenuCheckboxItem v-model:checked="mostrarReguas">
        Mostrar réguas
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>`),
  );
}

/** Composição WithRadioGroup: escolha única, o valor vive no grupo. */
export function contextMenuWithChoiceUnicaSource(): string {
  return vueSnippet(
    `${importing([
      'ContextMenu',
      'ContextMenuTrigger',
      'ContextMenuContent',
      'ContextMenuGroup',
      'ContextMenuLabel',
      'ContextMenuRadioGroup',
      'ContextMenuRadioItem',
    ])}
import { ref } from 'vue'

const layout = ref('grid')`,
    menu(`    <ContextMenuGroup>
      <ContextMenuLabel>Layout</ContextMenuLabel>
      <ContextMenuRadioGroup v-model="layout">
        <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
        <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
        <ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuGroup>`),
  );
}

/** Composição WithSubmenu: o segundo nível abre ao lado do item que o dispara. */
export function contextMenuWithSubmenuSource(): string {
  return vueSnippet(
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

/**
 * Composição completa: marcação, escolha única e submenu no mesmo menu.
 *
 * Cada bloco é um `ContextMenuGroup` com o próprio rótulo: é o agrupamento que
 * faz o leitor de tela anunciar a seção em vez de despejar uma lista corrida.
 */
export function contextMenuCompletoSource(): string {
  return vueSnippet(
    `${importing([
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
    ])}
import { ref } from 'vue'

const mostrarGrade = ref(true)
const layout = ref('grid')`,
    menu(`    <ContextMenuGroup>
      <ContextMenuLabel>Ações</ContextMenuLabel>
${item('Editar', { atalho: '⌘E', recuo: '      ' })}
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
      <ContextMenuCheckboxItem v-model:checked="mostrarGrade">
        Mostrar grade
      </ContextMenuCheckboxItem>
    </ContextMenuGroup>
    <ContextMenuSeparator />
    <ContextMenuGroup>
      <ContextMenuLabel>Layout</ContextMenuLabel>
      <ContextMenuRadioGroup v-model="layout">
        <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
        <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    </ContextMenuGroup>
    <ContextMenuSeparator />
${item('Excluir', { atalho: '⌫', props: ' variant="destructive"' })}`),
  );
}
