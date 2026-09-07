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
  areaClasse: string;
  onSelect: (item: string) => void;
};

/** Rótulo da moldura quando o control não trouxer texto. */
const LABEL_DEFAULT = 'Clique com o botão direito aqui';

const MENU_IMPORT = "import { NDS_CONTEXT_MENU } from '@/components/ui/context-menu';";

/** O componente que se escreve: import, template e — quando há estado — corpo. */
function example(template: string, body?: string): string {
  return `${MENU_IMPORT}

@Component({
  imports: [NDS_CONTEXT_MENU],
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
function menu(items: string, label = LABEL_DEFAULT): string {
  return `    <div ndsContextMenu>
      <div
        ndsContextMenuTrigger
        class="${AREA_CLICK_DIREITO}"
        data-align="center"
        data-justify="center"
      >${label}</div>

      <ng-template ndsContextMenuContent>
${items}
      </ng-template>
    </div>`;
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
 * com o rótulo atual do control já resolvido (ver a nota em
 * `separator.stories.ts`).
 */
export function contextMenuPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<ContextMenuArgs> } = {},
): string {
  const { triggerLabel = LABEL_DEFAULT } = ctx.args ?? {};

  return simpleMenu(
    `        <div ndsContextMenuItem>
          Editar
          <span ndsContextMenuShortcut>Ctrl+E</span>
        </div>
        <div ndsContextMenuItem>Duplicar</div>

        <div ndsContextMenuSeparator></div>

        <div ndsContextMenuItem variant="destructive">
          Excluir
          <span ndsContextMenuShortcut>Delete</span>
        </div>`,
    triggerLabel,
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
 */
export function contextMenuItemDisabledSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuItem>
          Editar
          <span ndsContextMenuShortcut>Ctrl+E</span>
        </div>
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
 */
export function contextMenuCheckboxIndeterminateSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuLabel>Mostrar na tela</div>
        <div ndsContextMenuCheckboxItem [checked]="'indeterminate'">Colunas</div>
        <div ndsContextMenuCheckboxItem [checked]="true">Régua</div>
        <div ndsContextMenuCheckboxItem [checked]="false">Grade</div>`,
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
 * Ligar só a primeira prenderia o item ao valor inicial.
 */
export function contextMenuWithCheckboxSource(): string {
  return example(
    menu(`        <div ndsContextMenuLabel>Visualização</div>
        <div
          ndsContextMenuCheckboxItem
          [checked]="showGrid()"
          (checkedChange)="showGrid.set($event)"
        >Mostrar grade</div>
        <div
          ndsContextMenuCheckboxItem
          [checked]="showRulers()"
          (checkedChange)="showRulers.set($event)"
        >Mostrar réguas</div>`),
    `  readonly showGrid = signal(false);
  readonly showRulers = signal(true);`,
  );
}

/**
 * Escolha única: o valor vive no GRUPO, não no item.
 *
 * É o que separa a escolha única da marcação — escolher um item desmarca o
 * anterior sem que ninguém escreva essa regra. Cada opção só declara o `value`
 * que representa, e o rótulo fica FORA do grupo, como a story ao lado o põe.
 */
export function contextMenuWithRadioGroupSource(): string {
  return example(
    menu(`        <div ndsContextMenuLabel>Layout</div>
        <div ndsContextMenuRadioGroup [value]="layout()" (valueChange)="layout.set($event)">
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
 * para a direita entra, o Escape volta, e nada disso pede prop.
 */
export function contextMenuWithSubmenuSource(): string {
  return simpleMenu(
    `        <div ndsContextMenuItem>Editar</div>

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
