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
