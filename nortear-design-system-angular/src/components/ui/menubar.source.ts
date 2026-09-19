/**
 * Transforms do painel Code do Menubar.
 *
 * Fora do `.stories.ts` porque só assim a guarda `source-snippets.test.ts`
 * alcança o construtor: ela varre `*.source.ts` por glob e CHAMA cada export
 * para ler o texto. Função local não é exportada nem alcançável.
 *
 * São QUATRO arquivos de story, e até 2026-09-11 só o Playground tinha
 * construtor: as outras TREZE stories imprimiam o template CRU — o `@for` que
 * monta a barra a partir de uma lista da story, `marcados[e]` e `theme = $event`
 * ligados a campos do objeto de props do renderer, `(onSelect)="onSelect(…)"`
 * ligado ao espião da `play`. Quem lê a docs page copia o snippet, não o
 * preview (`story_file_sem_transform`, três arquivos).
 *
 * Em 2026-09-17 fecharam as DUAS últimas, `TabLeavesMenubar` e `TabAtPageEnd`:
 * elas nasceram depois daquela rodada, no arquivo-raiz, e a mesma regra as pegou
 * publicando template cru. São dezesseis construtores para dezesseis stories,
 * sem exclusão declarada.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum:
 *
 *  · `(openChange)="onOpenChange($event)"` e `(onSelect)="onSelect(…)"`,
 *    ligados aos espiões que a `play` consulta;
 *  · `[modal]="false"` na barra e `[defaultOpen]="true"` no menu — o par que
 *    abre o menu na montagem para a regressão visual fotografá-lo e destrava o
 *    canvas por trás do painel. Barra que abre um menu sozinha ao carregar a
 *    página é o OPOSTO do que se copia.
 *
 * A EXCEÇÃO declarada ao item acima é `menubarOpenSource`: ali estar aberto É o
 * assunto da story, e sem `[defaultOpen]="true"` o snippet deixaria de ensinar
 * a única coisa que aquela story mostra.
 *
 * O que os snippets ensinam, e é a lição do componente:
 *
 *  · a barra é `<nds-menubar>`, e cada menu é um `<nds-menubar-menu>` com o
 *    gatilho `ndsMenubarTrigger` e o miolo num `ng-template ndsMenubarContent`;
 *  · o estado de abertura mora no MENU, não na barra: `open`/`openChange` são
 *    de `nds-menubar-menu`, e é isso que deixa controlar um menu enquanto os
 *    vizinhos se governam sozinhos;
 *  · o atalho mora DENTRO do item e sem `aria-hidden` — é assim que ele entra
 *    no nome acessível ("Desfazer Ctrl+Z");
 *  · o item destrutivo vem por ÚLTIMO, separado por `ndsMenubarSeparator`.
 *
 * Os textos são escritos aqui como as stories os escrevem — elas não leem o
 * `translations.json`. O que os snippets repetem é conferido contra a story
 * vizinha no `menubar.source.test.ts`.
 */
import type { MenubarSide, MenubarAlign } from './menubar';
export type MenubarArgs = {
  side: MenubarSide;
  align: MenubarAlign;
  modal: boolean;
  loopFocus: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const MENUBAR_IMPORT = "import { NDS_MENUBAR } from '@/components/ui/menubar';";
const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";

/** O componente que se escreve: imports, template e — quando há estado — corpo. */
function example(template: string, body?: string, withButton = false): string {
  const imports = withButton ? `${MENUBAR_IMPORT}\n${BUTTON_IMPORT}` : MENUBAR_IMPORT;
  const components = withButton ? '...NDS_MENUBAR, NdsButton' : '...NDS_MENUBAR';
  return `${imports}

@Component({
  imports: [${components}],
  template: \`
${template}
  \`,
})
export class Exemplo {${body ? `\n${body}\n` : ''}}`;
}

/**
 * Um menu da barra: gatilho e miolo. `items` chega pronto e já indentado —
 * cada story tem um miolo diferente, e é justamente o miolo o assunto dela.
 */
function menu(trigger: string, items: string, attrs = '', pad = '      '): string {
  return `${pad}<nds-menubar-menu${attrs}>
${pad}  <button ndsMenubarTrigger>${trigger}</button>
${pad}  <ng-template ndsMenubarContent>
${items}
${pad}  </ng-template>
${pad}</nds-menubar-menu>`;
}

/** A barra com os menus dados, separados por uma linha em branco. */
function bar(menus: string[], pad = '    '): string {
  return `${pad}<nds-menubar>
${menus.join('\n\n')}
${pad}</nds-menubar>`;
}

/** Linhas de item no recuo do miolo de um menu da barra. */
function lines(...items: string[]): string {
  return items.map((i) => `          ${i}`).join('\n');
}

/** As mesmas linhas, no recuo mais fundo de uma barra dentro de uma fileira. */
function rowLines(...items: string[]): string {
  return items.map((i) => `            ${i}`).join('\n');
}

/**
 * A fileira em que a barra é UMA parada de tabulação entre outras.
 *
 * Os vizinhos não são andaime aqui, e a diferença é do assunto: nas duas stories
 * de Tab o que se ensina é PARA ONDE o foco vai quando o menu fecha, e sem um
 * ponto de tabulação ao lado não há destino nenhum a mostrar. Some com eles e o
 * snippet vira uma barra qualquer, que as outras doze já ensinam.
 *
 * `hasAfter` é o que separa as duas: com vizinho depois, o Tab sai da barra
 * inteira para ele; sem vizinho, a barra é a última parada da página e o foco
 * volta ao gatilho do menu que estava aberto.
 */
function tabRow(menus: string[], hasAfter: boolean): string {
  const after = hasAfter ? '\n      <button ndsButton variant="ghost">Depois</button>' : '';
  return `    <div class="nds-cluster" data-spacing="md">
      <button ndsButton variant="ghost">Antes</button>
${bar(menus, '      ')}${after}
    </div>`;
}

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O painel Code imprime o `template` da story como está escrito — com o `@for`
 * que monta a barra e com `[side]="side"` ligado ao arg. É o andaime da story,
 * não o que alguém escreve para usar o menubar. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos.
 *
 * O snippet ensina a barra escrita à mão, com dois menus explícitos — e não o
 * `@for` que a story usa para montá-la a partir de uma lista. Quem copia
 * precisa ver a forma de um `nds-menubar-menu`: gatilho, conteúdo em
 * `ng-template` e itens com atalho.
 */
export function menubarPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<MenubarArgs> } = {},
): string {
  const { side = 'bottom', align = 'start', modal = true, loopFocus = true } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia.
  const barra = ['<nds-menubar']
    .concat(modal ? [] : ['[modal]="false"'])
    .concat(loopFocus ? [] : ['[loopFocus]="false"'])
    .join(' ') + '>';
  const content = ['<ng-template ndsMenubarContent']
    .concat(side === 'bottom' ? [] : [`side="${side}"`])
    .concat(align === 'start' ? [] : [`align="${align}"`])
    .join(' ') + '>';

  return `import { NDS_MENUBAR } from '@/components/ui/menubar';

@Component({
  imports: [...NDS_MENUBAR],
  template: \`
    ${barra}
      <nds-menubar-menu>
        <button ndsMenubarTrigger>Arquivo</button>

        ${content}
          <div ndsMenubarItem>Novo <span ndsMenubarShortcut>Ctrl+N</span></div>
          <div ndsMenubarItem>Abrir <span ndsMenubarShortcut>Ctrl+O</span></div>
        </ng-template>
      </nds-menubar-menu>

      <nds-menubar-menu>
        <button ndsMenubarTrigger>Editar</button>

        ${content}
          <div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>Ctrl+Z</span></div>
          <div ndsMenubarItem>Refazer <span ndsMenubarShortcut>Ctrl+Shift+Z</span></div>
        </ng-template>
      </nds-menubar-menu>
    </nds-menubar>
  \`,
})
export class Exemplo {}`;
}

// ─── Tab sai da barra ─────────────────────────────────────────────────────────

/**
 * A barra entre dois pontos de tabulação da página.
 *
 * A barra inteira é UMA parada (roving tabindex), então o Tab não passa de um
 * gatilho ao vizinho: ele fecha o menu aberto e sai para o que vem DEPOIS da
 * barra — e de dentro do submenu fecha o menu inteiro. Nada disso pede prop: é o
 * que o componente faz, e o que o snippet ensina é o CONTEXTO em que dá para ver
 * isso acontecer.
 *
 * O segundo menu e o submenu estão aqui pelo mesmo motivo: sem o vizinho
 * "Editar" não haveria como mostrar que o Tab não anda dentro da barra, e sem o
 * segundo nível não haveria como mostrar que ele não fecha só o filho.
 */
export function menubarTabLeavesMenubarSource(): string {
  return example(
    tabRow(
      [
        menu(
          'Arquivo',
          rowLines(
            '<div ndsMenubarItem>Novo</div>',
            '<div ndsMenubarItem>Abrir</div>',
            '<nds-menubar-sub>',
            '  <div ndsMenubarSubTrigger>Exportar</div>',
            '  <ng-template ndsMenubarSubContent>',
            '    <div ndsMenubarItem>PDF</div>',
            '    <div ndsMenubarItem>CSV</div>',
            '  </ng-template>',
            '</nds-menubar-sub>',
          ),
          '',
          '        ',
        ),
        menu(
          'Editar',
          rowLines('<div ndsMenubarItem>Desfazer</div>', '<div ndsMenubarItem>Refazer</div>'),
          '',
          '        ',
        ),
      ],
      true,
    ),
    undefined,
    true,
  );
}

/**
 * A barra como ÚLTIMA parada da página.
 *
 * Construtor próprio, e não um reaproveitamento do vizinho: o que muda não é só
 * o vizinho de depois — o submenu e o segundo item do Editar saem junto, porque
 * aqui o assunto é o Tab não ter para onde levar o foco, e cena a mais só
 * disputaria atenção com ele.
 */
export function menubarTabAtPageEndSource(): string {
  return example(
    tabRow(
      [
        menu(
          'Arquivo',
          rowLines('<div ndsMenubarItem>Novo</div>', '<div ndsMenubarItem>Abrir</div>'),
          '',
          '        ',
        ),
        menu('Editar', rowLines('<div ndsMenubarItem>Desfazer</div>'), '', '        '),
      ],
      false,
    ),
    undefined,
    true,
  );
}

// ─── Variantes: as duas ênfases de item ───────────────────────────────────────

/**
 * Item neutro — a ênfase que não se escreve. `variant="default"` é o padrão da
 * diretiva, e escrevê-lo daria a entender que existe uma escolha a fazer no
 * caso comum.
 */
export function menubarDefaultSource(): string {
  return example(
    bar([
      menu(
        'Arquivo',
        lines('<div ndsMenubarItem>Novo</div>', '<div ndsMenubarItem>Abrir</div>', '<div ndsMenubarItem>Salvar</div>'),
      ),
      menu('Editar', lines('<div ndsMenubarItem>Desfazer</div>')),
    ]),
  );
}

/**
 * Item destrutivo — a ação irreversível marcada pela cor de perigo, por ÚLTIMO
 * e separada das demais: o separador a tira do alcance de um clique distraído.
 */
export function menubarDestructiveSource(): string {
  return example(
    bar([
      menu(
        'Arquivo',
        lines(
          '<div ndsMenubarItem>Salvar</div>',
          '<div ndsMenubarSeparator></div>',
          '<div ndsMenubarItem variant="destructive">Descartar alterações</div>',
        ),
      ),
    ]),
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Fechada — a barra como ela nasce. Não há prop nenhuma para isso: os painéis
 * sequer chegam ao DOM, e é a ausência que é o assunto.
 */
export function menubarClosedSource(): string {
  return example(
    bar(
      ['Arquivo', 'Editar', 'Exibir', 'Ajuda'].map((m) =>
        menu(
          m,
          lines(
            `<div ndsMenubarItem>${m} — primeira ação</div>`,
            `<div ndsMenubarItem>${m} — segunda ação</div>`,
          ),
        ),
      ),
    ),
  );
}

/**
 * Aberto de saída — a exceção declarada à regra de não publicar `defaultOpen`.
 * Aqui estar aberto É o assunto: o gatilho aberto se distingue dos vizinhos e
 * o painel ancora abaixo dele.
 */
export function menubarOpenSource(): string {
  return example(
    bar([
      menu(
        'Arquivo',
        lines('<div ndsMenubarItem>Novo</div>', '<div ndsMenubarItem>Abrir</div>'),
        ' [defaultOpen]="true"',
      ),
      menu('Editar', lines('<div ndsMenubarItem>Desfazer</div>')),
    ]),
  );
}

/**
 * Item indisponível — continua no menu e é anunciado. A seta pousa nele, para
 * que o leitor de tela o anuncie; o que ele não pode é executar. As duas coisas
 * vêm da prop, e não de cada consumidor.
 */
export function menubarItemDisabledSource(): string {
  return example(
    bar([
      menu(
        'Arquivo',
        lines(
          '<div ndsMenubarItem>Novo</div>',
          '<div ndsMenubarItem>Salvar</div>',
          '<div ndsMenubarItem disabled>Enviar para revisão</div>',
        ),
      ),
    ]),
  );
}

/**
 * Alternadores com o estado num SINAL — um por item, independentes entre si. A
 * story liga `[checked]` a campos do objeto de props do renderer, que não
 * existem em componente nenhum.
 */
export function menubarCheckboxCheckedSource(): string {
  return example(
    bar([
      menu(
        'Exibir',
        lines(
          '<div ndsMenubarLabel>Mostrar na tela</div>',
          '<div ndsMenubarCheckboxItem [checked]="ruler()" (checkedChange)="ruler.set($event)">Régua</div>',
          '<div ndsMenubarCheckboxItem [checked]="grid()" (checkedChange)="grid.set($event)">Grade</div>',
        ),
      ),
    ]),
    `  readonly ruler = signal(true);
  readonly grid = signal(false);`,
  );
}

/**
 * Os três estados de uma marcação, lado a lado. O estado é TRI-VALORADO, e os
 * três são escritos por extenso: o assunto é o CONTRASTE entre eles. O valor
 * entra fixo — o primeiro clique num item misto o resolve para marcado, que é
 * outro assunto.
 */
export function menubarCheckboxIndeterminateSource(): string {
  return example(
    bar([
      menu(
        'Exibir',
        lines(
          '<div ndsMenubarLabel>Mostrar na tela</div>',
          `<div ndsMenubarCheckboxItem [checked]="'indeterminate'">Colunas</div>`,
          '<div ndsMenubarCheckboxItem [checked]="true">Régua</div>',
          '<div ndsMenubarCheckboxItem [checked]="false">Grade</div>',
        ),
      ),
    ]),
  );
}

/**
 * O menu CONTROLADO: `open` entra ligado e `openChange` devolve cada mudança —
 * no MENU, e não na barra. Ligar só a primeira é o defeito clássico: o menu
 * fecha na tela pelo Escape, o valor de fora continua `true`, e ele não fecha
 * mais (WCAG 2.1.2).
 */
export function menubarControlledSource(): string {
  const file = menu(
    'Arquivo',
    lines('<div ndsMenubarItem>Novo</div>', '<div ndsMenubarItem>Abrir</div>').replace(/^ {10}/gm, '            '),
    ' [open]="fileOpen()" (openChange)="fileOpen.set($event)"',
    '        ',
  );
  const edit = menu(
    'Editar',
    lines('<div ndsMenubarItem>Desfazer</div>').replace(/^ {10}/gm, '            '),
    '',
    '        ',
  );

  return example(
    `    <div class="nds-stack" data-spacing="sm">
      <button ndsButton variant="outline" size="sm" (click)="fileOpen.set(true)">Abrir Arquivo</button>

${bar([file, edit], '      ')}
    </div>`,
    '  readonly fileOpen = signal(false);',
    true,
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * O atalho DENTRO do item, e sem `aria-hidden`: é assim que ele entra no nome
 * acessível ("Desfazer Ctrl+Z"). Registrar a tecla continua sendo de quem
 * consome — o componente só exibe.
 */
export function menubarWithShortcutsSource(): string {
  return example(
    bar([
      menu(
        'Editar',
        lines(
          '<div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>Ctrl+Z</span></div>',
          '<div ndsMenubarItem>Refazer <span ndsMenubarShortcut>Ctrl+Shift+Z</span></div>',
          '<div ndsMenubarItem>Copiar <span ndsMenubarShortcut>Ctrl+C</span></div>',
        ),
      ),
    ]),
  );
}

/**
 * Um segundo nível que abre AO LADO. A tríade é obrigatória: `<nds-menubar-sub>`
 * guarda o estado, o `ndsMenubarSubTrigger` é o item que abre, e o
 * `ndsMenubarSubContent` é o painel filho. O chevron e o ARIA entram pelo
 * componente, e nada disso pede prop.
 */
export function menubarWithSubmenuSource(): string {
  return example(
    bar([
      menu(
        'Arquivo',
        lines(
          '<div ndsMenubarItem>Novo</div>',
          '',
          '<nds-menubar-sub>',
          '  <div ndsMenubarSubTrigger>Exportar</div>',
          '  <ng-template ndsMenubarSubContent>',
          '    <div ndsMenubarItem>PDF</div>',
          '    <div ndsMenubarItem>CSV</div>',
          '    <div ndsMenubarItem>PNG</div>',
          '  </ng-template>',
          '</nds-menubar-sub>',
        ).replace(/^ +$/gm, ''),
      ),
    ]),
  );
}

/**
 * Alternadores independentes, cada um com o próprio sinal — e marcar NÃO fecha
 * o menu: quem liga a régua costuma querer ligar a grade logo em seguida.
 */
export function menubarWithCheckboxSource(): string {
  return example(
    bar([
      menu(
        'Exibir',
        lines(
          '<div ndsMenubarLabel>Mostrar na tela</div>',
          '<div ndsMenubarCheckboxItem [checked]="showRuler()" (checkedChange)="showRuler.set($event)">Régua</div>',
          '<div ndsMenubarCheckboxItem [checked]="showSidebar()" (checkedChange)="showSidebar.set($event)">Barra lateral</div>',
          '<div ndsMenubarCheckboxItem [checked]="showGrid()" (checkedChange)="showGrid.set($event)">Grade</div>',
        ),
      ),
    ]),
    `  readonly showRuler = signal(true);
  readonly showSidebar = signal(false);
  readonly showGrid = signal(false);`,
  );
}

/**
 * Escolha única: o valor vive no GRUPO, não no item — escolher uma opção
 * desmarca a anterior sem que ninguém escreva essa regra, e o menu segue
 * aberto. Cada opção só declara o `value` que representa.
 */
export function menubarWithRadioSource(): string {
  return example(
    bar([
      menu(
        'Aparência',
        lines(
          '<div ndsMenubarRadioGroup [value]="theme()" (valueChange)="theme.set($event)">',
          '  <div ndsMenubarLabel>Tema</div>',
          '  <div ndsMenubarRadioItem value="light">Claro</div>',
          '  <div ndsMenubarRadioItem value="dark">Escuro</div>',
          '  <div ndsMenubarRadioItem value="system">Do sistema</div>',
          '</div>',
        ),
      ),
    ]),
    "  readonly theme = signal('light');",
  );
}

/**
 * A barra completa de um editor: as quatro categorias clássicas lado a lado,
 * com grupo nomeado, atalhos, marcação e a saída destrutiva por último.
 */
export function menubarEditorSource(): string {
  return example(
    bar([
      menu(
        'Arquivo',
        lines(
          '<div ndsMenubarGroup>',
          '  <div ndsMenubarLabel>Documento</div>',
          '  <div ndsMenubarItem>Novo <span ndsMenubarShortcut>Ctrl+N</span></div>',
          '  <div ndsMenubarItem>Abrir <span ndsMenubarShortcut>Ctrl+O</span></div>',
          '</div>',
          '<div ndsMenubarSeparator></div>',
          '<div ndsMenubarItem variant="destructive">Descartar alterações</div>',
        ),
      ),
      menu(
        'Editar',
        lines(
          '<div ndsMenubarItem>Desfazer <span ndsMenubarShortcut>Ctrl+Z</span></div>',
          '<div ndsMenubarItem>Refazer <span ndsMenubarShortcut>Ctrl+Shift+Z</span></div>',
        ),
      ),
      menu(
        'Exibir',
        lines(
          '<div ndsMenubarLabel>Mostrar na tela</div>',
          '<div ndsMenubarCheckboxItem [checked]="true">Régua</div>',
          '<div ndsMenubarCheckboxItem>Grade</div>',
        ),
      ),
      menu(
        'Ajuda',
        lines('<div ndsMenubarItem>Documentação</div>', '<div ndsMenubarItem>Atalhos de teclado</div>'),
      ),
    ]),
  );
}

// ─── Menu longo ───────────────────────────────────────────────────────────────

/**
 * Quantas ações o menu longo lista.
 *
 * Trinta e seis a ~32px de altura passam de mil pixels — mais alto que qualquer
 * viewport que a suíte abra, e é isso que faz o painel RECORTAR e rolar. Número
 * menor deixaria a story verde sem exercer o recorte, que é o assunto dela
 * (D17 do PRD do dropdown-menu).
 */
export const LONG_MENU_ITEMS = 36;

/** Os rótulos do menu longo — a mesma lista que a story renderiza. */
export const LONG_MENU_LABELS: readonly string[] = Array.from(
  { length: LONG_MENU_ITEMS },
  (_, i) => `Ação ${i + 1}`,
);

/**
 * O menu que não cabe na tela, escrito à mão.
 *
 * A story monta a lista com `@for`; o snippet escreve os itens, porque o `@for`
 * é do andaime dela e quem copia precisa ver a forma de um item. A lição do
 * exemplo é que NÃO HÁ nada a escrever: o recorte e a rolagem saem da folha
 * (`max-height` pela altura disponível, `overflow-y: auto`), e o teclado
 * continua alcançando o item que rolou para fora porque o foco é itinerante.
 */
export function menubarLongMenuSource(): string {
  return example(
    bar([menu('Ações', LONG_MENU_LABELS.map((l) => `          <div ndsMenubarItem>${l}</div>`).join('\n'))]),
  );
}

// ─── A barra como DADO ────────────────────────────────────────────────────────
//
// A ficha de Variantes da docs page monta a barra VIVA e o código ao lado a
// partir da MESMA lista de menus — é isso que impede os dois de divergirem.
// Até 2026-09-18 o construtor morava dentro da própria docs page
// (`MenubarDocs.ts`), onde react, vue e vanilla já o expunham em `ui/`
// (inconsistência 22 da §7 do PRD): snippet montado dentro da página não é
// importável, e por isso não era testável.
//
// Os rótulos chegam RESOLVIDOS — quem chama os lê do conteúdo compartilhado, no
// idioma da página. O construtor não conhece `translations.json`, e é essa
// fronteira que o deixa rodar em node.
//
// O que NÃO entra: a instrumentação da página (`(onOpenChange)`, `(onSelect)`
// ligados ao rastreio). É andaime da docs page, não lição do menubar.

/** Item de ação. `label` já vem no idioma de quem chama. */
export type MenubarSnippetItem = {
  kind: 'item';
  label: string;
  /** Texto do atalho exibido à direita, quando há. */
  shortcut?: string;
  destructive?: boolean;
};

/** Item de marcação — `checked` é o estado que o exemplo publica. */
export type MenubarSnippetCheckbox = {
  kind: 'checkbox';
  label: string;
  checked: boolean;
};

/** Submenu dentro de submenu — o segundo nível, que só um exemplo usa. */
export type MenubarSnippetNestedSub = {
  kind: 'sub';
  label: string;
  entries: readonly MenubarSnippetItem[];
};

export type MenubarSnippetEntry =
  | MenubarSnippetItem
  | MenubarSnippetCheckbox
  | { kind: 'separator' }
  /** O rótulo vai DENTRO do grupo, que é o que faz dele o nome do bloco. */
  | {
      kind: 'group';
      label: string;
      entries: readonly (MenubarSnippetItem | MenubarSnippetCheckbox)[];
    }
  /** O rótulo é opcional aqui: um grupo de escolha única pode dispensar cabeçalho. */
  | {
      kind: 'radio-group';
      label?: string;
      value: string;
      options: readonly { label: string; value: string }[];
    }
  | { kind: 'sub'; label: string; entries: readonly (MenubarSnippetItem | MenubarSnippetNestedSub)[] };

/** Um menu da barra: o texto do gatilho e o que ele abre. */
export type MenubarSnippetMenu = {
  trigger: string;
  entries: readonly MenubarSnippetEntry[];
};

/** A barra canônica — dois menus, que é o que a guarda transversal chama sem argumento. */
const SNIPPET_MENUS_DEFAULT: readonly MenubarSnippetMenu[] = [
  {
    trigger: 'Arquivo',
    entries: [
      { kind: 'item', label: 'Novo' },
      { kind: 'item', label: 'Abrir' },
    ],
  },
  {
    trigger: 'Editar',
    entries: [
      { kind: 'item', label: 'Desfazer' },
      { kind: 'item', label: 'Refazer' },
    ],
  },
];

/** A barra descrita por `menus`, com os rótulos exatamente como chegam. */
export function menubarSnippet(menus: readonly MenubarSnippetMenu[] = SNIPPET_MENUS_DEFAULT): string {
  const pad = (n: number) => ' '.repeat(n);
  const itemLines = (e: MenubarSnippetItem, n: number): string[] => {
    const variant = e.destructive ? ' variant="destructive"' : '';
    const shortcut = e.shortcut ? ` <span ndsMenubarShortcut>${e.shortcut}</span>` : '';
    return [`${pad(n)}<div ndsMenubarItem${variant}>${e.label}${shortcut}</div>`];
  };
  const leaf = (e: MenubarSnippetItem | MenubarSnippetCheckbox, n: number): string[] =>
    e.kind === 'item'
      ? itemLines(e, n)
      : [`${pad(n)}<div ndsMenubarCheckboxItem [checked]="${e.checked}">${e.label}</div>`];
  const sub = (label: string, children: string[], n: number): string[] => [
    `${pad(n)}<nds-menubar-sub>`,
    `${pad(n + 2)}<div ndsMenubarSubTrigger>${label}</div>`,
    `${pad(n + 2)}<ng-template ndsMenubarSubContent>`,
    ...children,
    `${pad(n + 2)}</ng-template>`,
    `${pad(n)}</nds-menubar-sub>`,
  ];

  const entryLines = (entries: readonly MenubarSnippetEntry[], n: number): string[] => {
    const lines: string[] = [];
    for (const entry of entries) {
      if (entry.kind === 'separator') {
        lines.push(`${pad(n)}<div ndsMenubarSeparator></div>`);
      } else if (entry.kind === 'item' || entry.kind === 'checkbox') {
        lines.push(...leaf(entry, n));
      } else if (entry.kind === 'group') {
        lines.push(`${pad(n)}<div ndsMenubarGroup>`);
        lines.push(`${pad(n + 2)}<div ndsMenubarLabel>${entry.label}</div>`);
        for (const child of entry.entries) lines.push(...leaf(child, n + 2));
        lines.push(`${pad(n)}</div>`);
      } else if (entry.kind === 'radio-group') {
        lines.push(`${pad(n)}<div ndsMenubarRadioGroup value="${entry.value}">`);
        if (entry.label) lines.push(`${pad(n + 2)}<div ndsMenubarLabel>${entry.label}</div>`);
        for (const opt of entry.options) {
          lines.push(`${pad(n + 2)}<div ndsMenubarRadioItem value="${opt.value}">${opt.label}</div>`);
        }
        lines.push(`${pad(n)}</div>`);
      } else {
        const children: string[] = [];
        for (const child of entry.entries) {
          if (child.kind === 'sub') {
            const leaves = child.entries.flatMap((l) => itemLines(l, n + 8));
            children.push(...sub(child.label, leaves, n + 4));
          } else {
            children.push(...itemLines(child, n + 4));
          }
        }
        lines.push(...sub(entry.label, children, n));
      }
    }
    return lines;
  };

  const body = menus.map((m) =>
    [
      `  <nds-menubar-menu>`,
      `    <button ndsMenubarTrigger>${m.trigger}</button>`,
      `    <ng-template ndsMenubarContent>`,
      ...entryLines(m.entries, 6),
      `    </ng-template>`,
      `  </nds-menubar-menu>`,
    ].join('\n'),
  );

  return `<nds-menubar>\n${body.join('\n\n')}\n</nds-menubar>`;
}
