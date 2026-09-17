/**
 * Transforms do painel Code do ContextMenu.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * estes construtores sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * São TRÊS arquivos de story mostrando o mesmo componente, e até esta rodada só
 * o Playground tinha construtor: as outras DEZ imprimiam o template CRU no
 * painel Code — `[class]="areaClasse"` apontando para um campo do objeto de
 * props do renderer, `(onSelect)="onSelect('duplicar')"` ligado ao espião da
 * `play`, `data-testid` que só o teste consulta. Quem lê a docs page copia o
 * snippet, não o preview.
 *
 * Em 2026-09-17 fechou a ÚLTIMA, `TabLeavesMenu`: ela nasceu depois daquela
 * rodada, no arquivo-raiz, e a regra `story_file_sem_transform` a pegou
 * publicando template cru. São doze construtores para doze stories, sem exclusão
 * declarada.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum:
 *
 *  · `(onSelect)="onSelect(…)"`, que existe para a `play` provar que o item
 *    ativa — não é lição de menu nenhum;
 *  · `[class]="areaClasse"`, que é o mesmo vocabulário de classe escrito por
 *    binding só porque o renderer monta um objeto de props. O snippet escreve a
 *    classe por extenso, da constante compartilhada;
 *  · `data-testid`, endereço do teste;
 *  · `[(checked)]="grade"` e `[(value)]="layout"` contra campo comum do objeto
 *    de props. Num componente de verdade quem agenda o redesenho é a escrita no
 *    SINAL, e é o par `[checked]`/`(checkedChange)` que os snippets publicam —
 *    a mesma forma dos snippets do DropdownMenu.
 *
 * O que os snippets ensinam, e é a lição do componente:
 *
 *  · o gatilho não é botão: é a ÁREA que responde ao gesto de contexto (clique
 *    direito, toque longo, tecla Menu / Shift+F10). Ele não abre por clique
 *    comum, e por isso a moldura tracejada diz onde clicar. Numa tela real o
 *    gatilho embrulha o conteúdo — um cartão, uma linha de lista — e dispensa a
 *    moldura;
 *  · o miolo mora num `<ng-template>`, e só é instanciado quando o menu abre —
 *    nó projetado pertence à view de quem consome, e o portal o removeria do
 *    DOM sem destruir as diretivas;
 *  · o item destrutivo vem por ÚLTIMO e depois de `ndsContextMenuSeparator`: a
 *    ação que não se desfaz não fica ao alcance de um clique distraído;
 *  · o atalho mora DENTRO do item e sem `aria-hidden` — é assim que ele entra
 *    no nome acessível ("Excluir, Delete");
 *  · o submenu é a tríade `ndsContextMenuSub` + `ndsContextMenuSubTrigger` +
 *    `ng-template ndsContextMenuSubContent`, e o ARIA do segundo nível
 *    (`aria-haspopup`, `aria-expanded`, `aria-owns`) sai do próprio
 *    sub-gatilho: escrevê-lo à mão ensinaria API que não existe.
 *
 * A EXTRAÇÃO ENCONTROU DOIS DEFEITOS, e os dois estão corrigidos aqui:
 *
 *  1. os `(onSelect)` do Playground chamavam `editar()` e `excluir()` contra uma
 *     classe `Exemplo` VAZIA. Expressão de template do Angular só enxerga membro
 *     de classe, então quem copiasse receberia dois bindings que não resolvem. O
 *     conserto é o recorte: o espião é andaime, e saiu inteiro;
 *  2. o rótulo padrão do gatilho era "Clique com o botão direito", e a story ao
 *     lado renderiza "Clique com o botão direito aqui" — o mesmo texto que o
 *     conteúdo compartilhado publica em `demonstration.labels.triggerLabel`.
 *
 * Os textos são escritos aqui como as stories os escrevem. Elas não leem o
 * `translations.json`, então copiar de lá inventaria uma sincronia que a story
 * não tem; o que os snippets repetem é conferido contra a story vizinha no
 * `context-menu.source.test.ts`.
 */
import { AREA_CLICK_DIREITO } from '@shared/primitives/context-menu-area';

export type ContextMenuArgs = {
  triggerLabel: string;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
  areaClasse: string;
  onSelect: (item: string) => void;
  onOpenChange: (open: boolean) => void;
};

/** Rótulo da moldura quando o control não trouxer texto. */
const LABEL_DEFAULT = 'Clique com o botão direito aqui';

const MENU_IMPORT = "import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';";
const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";

/**
 * O componente que se escreve: import, template e — quando há estado — corpo.
 *
 * `withButton` existe por um snippet só, o da story de Tab: ali a lição é o
 * destino do foco, e o vizinho de tabulação é um botão do design system. Import
 * e `imports` andam juntos — snippet que usa `ndsButton` sem declará-lo não
 * compila para quem copia.
 */
function example(template: string, body?: string, withButton = false): string {
  const imports = withButton ? `${MENU_IMPORT}\n${BUTTON_IMPORT}` : MENU_IMPORT;
  const components = withButton ? 'NDS_CONTEXT_MENU, NdsButton' : 'NDS_CONTEXT_MENU';
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
 * A forma canônica do menu: raiz, a área do gesto e o `ng-template` do miolo.
 *
 * A moldura tracejada é o componente inteiro do ponto de vista de quem olha — o
 * ContextMenu não tem botão. As duas classes de borda são necessárias:
 * `nds-border-default` traz largura e cor, `nds-border-dashed` só troca o estilo
 * do traço. E o quadro não tem altura: ele nasce do `nds-p-8` e cresce junto
 * quando a pessoa aumenta a fonte do navegador (WCAG 1.4.4).
 *
 * `items` chega pronto e já indentado com oito espaços — cada story tem um
 * miolo diferente, e é justamente o miolo o assunto de quase todas elas.
 */
function menu(items: string, label = LABEL_DEFAULT, pad = '    '): string {
  const p2 = `${pad}  `;
  return `${pad}<div ndsContextMenu>
${p2}<div
${p2}  ndsContextMenuTrigger
${p2}  class="${AREA_CLICK_DIREITO}"
${p2}  data-align="center"
${p2}  data-justify="center"
${p2}>${label}</div>

${p2}<ng-template ndsContextMenuContent>
${items}
${p2}</ng-template>
${pad}</div>`;
}

/** Menu sem estado externo nenhum — a forma de nove dos onze snippets. */
function simpleMenu(items: string, label = LABEL_DEFAULT): string {
  return example(menu(items, label));
}

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args e ao espião da `play`. Isso é o andaime da story,
 * não o que alguém escreve para usar o menu. O `transform` devolve o uso real,
 * com os controls já resolvidos (ver a nota em `separator.stories.ts`): o
 * rótulo da área e os três `show*`, que tiram do menu o atalho, a divisória e a
 * saída destrutiva. O snippet escreve só o que o preview mostra — um `@if` aqui
 * ensinaria um menu condicional que ninguém pediu.
 */
export function contextMenuPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ContextMenuArgs> } = {},
): string {
  const {
    triggerLabel = LABEL_DEFAULT,
    showDestructive = true,
    showSeparator = true,
    showShortcuts = true,
  } = ctx.args ?? {};

  const blocks = [
    `${itemWithShortcut('Editar', showShortcuts ? 'Ctrl+E' : undefined)}
        <div ndsContextMenuItem>Duplicar</div>`,
  ];
  if (showSeparator) blocks.push('        <div ndsContextMenuSeparator></div>');
  if (showDestructive) {
    blocks.push(
      itemWithShortcut('Excluir', showShortcuts ? 'Delete' : undefined, ' variant="destructive"'),
    );
  }

  return simpleMenu(blocks.join('\n\n'), triggerLabel);
}

/**
 * Um item de ação, com o atalho DENTRO dele quando há atalho — é assim que ele
 * entra no nome acessível. Sem atalho o item cabe numa linha só.
 */
function itemWithShortcut(label: string, shortcut?: string, attrs = ''): string {
  if (!shortcut) return `        <div ndsContextMenuItem${attrs}>${label}</div>`;
  return `        <div ndsContextMenuItem${attrs}>
          ${label}
          <span ndsContextMenuShortcut>${shortcut}</span>
        </div>`;
}

// ─── Tab sai do menu ──────────────────────────────────────────────────────────

/**
 * A área entre dois pontos de tabulação da página.
 *
 * Menu não é diálogo: o Tab fecha e o foco segue a página a partir da ÁREA — o
 * vizinho depois dela, ou o de antes no Shift+Tab —, e de dentro do submenu
 * fecha o menu INTEIRO. Nada disso pede prop: é o que o componente faz, e o que
 * o snippet ensina é o CONTEXTO em que dá para ver isso acontecer.
 *
 * Os vizinhos NÃO são andaime aqui, e a diferença é do assunto: sem um ponto de
 * tabulação ao lado não há destino nenhum a mostrar, e o snippet viraria uma
 * cópia do submenu que `contextMenuWithSubmenuSource` já ensina. A área como
 * ÚLTIMA parada — o caso em que o foco volta para ela — é o que o Playground
 * mostra, e por isso não tem construtor próprio aqui.
 */
export function contextMenuTabLeavesMenuSource(): string {
  return example(
    `    <div class="nds-cluster" data-spacing="md">
      <button ndsButton variant="ghost">Antes</button>
${menu(
  `          <div ndsContextMenuItem>Editar</div>
          <div ndsContextMenuItem>Duplicar</div>

          <div ndsContextMenuSub>
            <div ndsContextMenuSubTrigger>Compartilhar</div>
            <ng-template ndsContextMenuSubContent>
              <div ndsContextMenuItem>Por e-mail</div>
              <div ndsContextMenuItem>Por link</div>
            </ng-template>
          </div>`,
  LABEL_DEFAULT,
  '      ',
)}
      <button ndsButton variant="ghost">Depois</button>
    </div>`,
    undefined,
    true,
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Item indisponível — continua no menu, e é anunciado.
 *
 * O padrão WAI-ARIA de menu quer o item desabilitado ALCANÇÁVEL pela seta, para
 * que o leitor de tela o anuncie; o que ele não pode é executar. As duas coisas
 * vêm da prop, não de cada consumidor: `aria-disabled`, e o `pointer-events:
 * none` que impede o clique de chegar.
 *
 * `disabled` entra como atributo simples: a prop tem transformação booleana, e
 * escrever o binding por extenso só acrescentaria cerimônia ao caso comum.
 *
 * Sem atalho, como o conteúdo do Vanilla: o assunto é o item indisponível, e o
 * atalho no primeiro item era a única diferença entre as cinco.
 */
export function contextMenuItemDisabledSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuItem>Editar</div>
        <div ndsContextMenuItem disabled>Duplicar</div>
        <div ndsContextMenuItem>Renomear</div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem variant="destructive" disabled>Excluir</div>`,
  );
}

/**
 * Item recuado — o recuo alinha o rótulo com os itens que têm indicador à
 * esquerda.
 *
 * Ele empurra só a borda esquerda: a caixa continua terminando onde as outras
 * terminam, senão o menu ganharia um degrau à direita. `inset` é `input(false)`
 * sem transformação, então o valor vai por binding — atributo simples chegaria
 * como texto e o compilador de templates reprovaria.
 */
export function contextMenuItemInsetSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuGroup>
          <div ndsContextMenuLabel [inset]="true">Arquivo</div>
          <div ndsContextMenuItem>Editar</div>
          <div ndsContextMenuItem [inset]="true">Duplicar</div>
        </div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem [inset]="true" variant="destructive">Excluir</div>`,
  );
}

/**
 * Item destrutivo — a ação irreversível marcada pela cor de perigo.
 *
 * Ela existe para que "Excluir permanentemente" não pareça "Editar", e vem por
 * ÚLTIMO, separada das demais: o separador é o que a tira do alcance de um
 * clique distraído. Quem escreve a cor é a variante, e não uma classe à mão.
 */
export function contextMenuItemDestructiveSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuGroup>
          <div ndsContextMenuItem>
            Editar
            <span ndsContextMenuShortcut>Ctrl+E</span>
          </div>
          <div ndsContextMenuItem>Duplicar</div>
        </div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem variant="destructive">
          Excluir permanentemente
          <span ndsContextMenuShortcut>Delete</span>
        </div>`,
  );
}

/**
 * Os três estados de uma marcação, lado a lado.
 *
 * O estado é TRI-VALORADO: `true`, `false` e `'indeterminate'` — o misto,
 * "alguns dos filhos", que desenha traço enquanto o marcado desenha tique. Os
 * três são escritos por extenso de propósito: o assunto é o CONTRASTE entre
 * eles, e omitir o desmarcado apagaria metade da lição.
 *
 * O valor entra FIXO, e não ligado a um sinal: o primeiro clique num item misto
 * o resolve para marcado, que é outro assunto — e a story ao lado não interage
 * com os itens justamente por isso.
 *
 * O rótulo mora DENTRO do grupo, e é o nome dele: rótulo solto entre itens é
 * texto que o leitor de tela anuncia sem dizer a que se aplica (a folha
 * compartilhada chama isso de padrão errado).
 */
export function contextMenuCheckboxIndeterminateSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuGroup>
          <div ndsContextMenuLabel>Mostrar na tela</div>
          <div ndsContextMenuCheckboxItem [checked]="'indeterminate'">Colunas</div>
          <div ndsContextMenuCheckboxItem [checked]="true">Régua</div>
          <div ndsContextMenuCheckboxItem [checked]="false">Grade</div>
        </div>`,
  );
}

/**
 * Paleta escura — o mesmo markup, outra paleta.
 *
 * A troca de tema é global (classe no documento) e não muda uma linha do menu.
 * É exatamente isso que a story mostra, e é por isso que o snippet não publica
 * prop nenhuma de tema: escrever uma ensinaria API que não existe.
 */
export function contextMenuDarkPaletteSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuItem>Editar</div>
        <div ndsContextMenuItem disabled>Duplicar</div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem variant="destructive">Excluir</div>`,
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * O atalho encostado na borda direita do item.
 *
 * Ele mora DENTRO do item, e sem `aria-hidden`: é assim que entra no nome
 * acessível ("Excluir, Delete"). Escondido, a pessoa ouviria só "Excluir" e
 * nunca saberia que existe uma tecla. Registrar a tecla continua sendo de quem
 * consome — o componente só exibe.
 */
export function contextMenuWithShortcutSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuItem>
          Editar
          <span ndsContextMenuShortcut>Ctrl+E</span>
        </div>
        <div ndsContextMenuItem>
          Desfazer
          <span ndsContextMenuShortcut>Ctrl+Z</span>
        </div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem variant="destructive">
          Excluir
          <span ndsContextMenuShortcut>Delete</span>
        </div>`,
  );
}

/**
 * Alternadores independentes entre si.
 *
 * Cada item guarda a própria marcação, e alternar NÃO fecha o menu — quem marca
 * uma opção costuma marcar a próxima. É o que separa a marcação da escolha
 * única, onde o valor mora no grupo.
 *
 * As duas pontas são ligadas: `[checked]` entra e `(checkedChange)` volta.
 * Ligar só a primeira prenderia o item ao valor inicial. E o rótulo mora dentro
 * de `ndsContextMenuGroup`, que é o que o faz NOMEAR os dois itens.
 */
export function contextMenuWithCheckboxSource(): string {
  return example(
    menu(`        <div ndsContextMenuGroup>
          <div ndsContextMenuLabel>Visualização</div>
          <div
            ndsContextMenuCheckboxItem
            [checked]="showGrid()"
            (checkedChange)="showGrid.set($event)"
          >Mostrar grade</div>
          <div
            ndsContextMenuCheckboxItem
            [checked]="showRulers()"
            (checkedChange)="showRulers.set($event)"
          >Mostrar réguas</div>
        </div>`),
    `  readonly showGrid = signal(false);
  readonly showRulers = signal(true);`,
  );
}

/**
 * Escolha única: o valor vive no GRUPO, não no item.
 *
 * É o que separa a escolha única da marcação — escolher um item desmarca o
 * anterior sem que ninguém escreva essa regra. Cada opção só declara o `value`
 * que representa, e o rótulo fica DENTRO do grupo: o grupo de escolha única já
 * é `role="group"`, e o rótulo é o nome dele. Solto antes do grupo, era texto
 * que o leitor de tela anunciava sem dizer a que se aplicava.
 */
export function contextMenuWithRadioGroupSource(): string {
  return example(
    menu(`        <div ndsContextMenuRadioGroup [value]="layout()" (valueChange)="layout.set($event)">
          <div ndsContextMenuLabel>Layout</div>
          <div ndsContextMenuRadioItem value="grid">Grade</div>
          <div ndsContextMenuRadioItem value="list">Lista</div>
          <div ndsContextMenuRadioItem value="columns">Colunas</div>
        </div>`),
    `  readonly layout = signal('grid');`,
  );
}

/**
 * Um segundo nível que abre AO LADO.
 *
 * A tríade é obrigatória: `ndsContextMenuSub` guarda o estado, o
 * `ndsContextMenuSubTrigger` é o item que abre, e o `ndsContextMenuSubContent`
 * é o painel filho — outro `<ng-template>`, pelo mesmo motivo do miolo de cima.
 * O chevron entra pelo componente, e o ARIA também: `aria-haspopup`,
 * `aria-expanded` e o `aria-owns` que liga o item ao painel portalado. A seta
 * para a direita leva o foco ao primeiro item do painel filho, a esquerda o
 * devolve ao sub-gatilho, e nada disso pede prop.
 */
export function contextMenuWithSubmenuSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuItem>Editar</div>
        <div ndsContextMenuItem>Duplicar</div>

        <div ndsContextMenuSub>
          <div ndsContextMenuSubTrigger>Compartilhar</div>

          <ng-template ndsContextMenuSubContent>
            <div ndsContextMenuItem>Por e-mail</div>
            <div ndsContextMenuItem>Por link</div>
          </ng-template>
        </div>`,
  );
}

/**
 * Composição completa: ações com submenu, marcação e escolha única convivendo
 * no mesmo menu, cada bloco num grupo com o próprio rótulo.
 *
 * Vale como snippet próprio porque a convivência é o assunto — cada peça
 * isolada já aparece nas outras composições, e nenhuma delas mostra a ordem em
 * que os blocos se sucedem nem a saída destrutiva no fim de tudo.
 */
export function contextMenuCompleteCompositionSource(): string {
  return example(
    menu(`        <div ndsContextMenuGroup>
          <div ndsContextMenuLabel>Ações</div>
          <div ndsContextMenuItem>
            Editar
            <span ndsContextMenuShortcut>Ctrl+E</span>
          </div>

          <div ndsContextMenuSub>
            <div ndsContextMenuSubTrigger>Compartilhar</div>

            <ng-template ndsContextMenuSubContent>
              <div ndsContextMenuItem>Por e-mail</div>
              <div ndsContextMenuItem>Por link</div>
            </ng-template>
          </div>
        </div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuGroup>
          <div ndsContextMenuLabel>Visualização</div>
          <div
            ndsContextMenuCheckboxItem
            [checked]="showGrid()"
            (checkedChange)="showGrid.set($event)"
          >Mostrar grade</div>
        </div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuGroup>
          <div ndsContextMenuLabel>Layout</div>
          <div ndsContextMenuRadioGroup [value]="layout()" (valueChange)="layout.set($event)">
            <div ndsContextMenuRadioItem value="grid">Grade</div>
            <div ndsContextMenuRadioItem value="list">Lista</div>
          </div>
        </div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem variant="destructive">
          Excluir
          <span ndsContextMenuShortcut>Delete</span>
        </div>`),
    `  readonly showGrid = signal(true);
  readonly layout = signal('grid');`,
  );
}
