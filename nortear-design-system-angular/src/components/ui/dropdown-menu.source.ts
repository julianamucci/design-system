/**
 * Transforms do painel Code do DropdownMenu.
 *
 * Fora do `.stories.ts` para entrar na varredura do `source-snippets.test.ts`,
 * que CHAMA cada export e cobra o texto publicado — que todo nome mandado
 * importar de `@/components/ui/<slug>` exista mesmo lá, e que nada do andaime
 * da story vaze para o que se copia.
 *
 * São QUATRO arquivos de story mostrando o mesmo componente, e até esta rodada
 * só o Playground tinha construtor: as outras DOZE stories imprimiam o template
 * CRU — `[side]="side"` apontando para um control que o leitor não tem,
 * `(onSelect)="onSelect('perfil')"` ligado ao espião da `play`, `name` e
 * `email` que são campos do objeto de props do renderer e não existem em
 * componente nenhum. Quem lê a docs page copia o snippet, não o preview.
 *
 * O que é ANDAIME e por isso não entra em snippet nenhum:
 *
 *  · `(openChange)="onOpenChange($event)"` do Playground, ligado ao espião;
 *  · `(onSelect)="onSelect(…)"`, que existe para a `play` provar que o item
 *    ativa — não é parte de nenhuma lição do menu;
 *  · `[defaultOpen]="true"` acompanhado de `[modal]="false"`, o par que abre o
 *    menu na montagem para a regressão visual fotografá-lo e destrava o canvas
 *    por trás do popup. Menu que se abre sozinho ao carregar a página é o
 *    OPOSTO do que se copia — é o mesmo recorte que Vue e Svelte já declaram
 *    para este componente.
 *
 * A EXCEÇÃO declarada ao item acima é `dropdownMenuOpenSource`: ali estar
 * aberto É o assunto da story, e sem `[defaultOpen]="true"` o snippet deixaria
 * de ensinar a única coisa que aquela story mostra. E o Playground escreve as
 * duas props quando — e só quando — o control as tira do padrão.
 *
 * O que os snippets ensinam, e é a lição do componente:
 *
 *  · o gatilho é um `<button>` do design system com `ndsDropdownMenuTrigger` no
 *    MESMO elemento. Um `<button>` dentro de outro é violação de ARIA e quebra
 *    o teclado — e é daí que saem o `aria-haspopup="menu"` e o
 *    `aria-expanded` que anunciam o menu antes de ele existir;
 *  · `side` e `align` moram no CONTEÚDO, nunca na raiz — é a raiz que tem
 *    `open`, `defaultOpen` e `modal`;
 *  · o item destrutivo vem por ÚLTIMO e separado por `ndsDropdownMenuSeparator`:
 *    a ação que não se desfaz não fica ao alcance de um clique distraído;
 *  · o atalho mora DENTRO do item e sem `aria-hidden` — é assim que ele entra
 *    no nome acessível ("Copiar Ctrl+C").
 *
 * Os textos são escritos aqui como as stories os escrevem. Elas não leem o
 * `translations.json` — o conteúdo compartilhado deste slug não tem rótulos de
 * demonstração para o menu inteiro —, então copiar de lá inventaria uma
 * sincronia que a story não tem. O que os snippets repetem é conferido contra
 * a story vizinha no `dropdown-menu.source.test.ts`.
 */
import type { DropdownMenuSide, DropdownMenuAlign } from './dropdown-menu';

export type DropdownMenuArgs = {
  side: DropdownMenuSide;
  align: DropdownMenuAlign;
  modal: boolean;
  defaultOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const MENU_IMPORT = "import { NDS_DROPDOWN_MENU } from '@/components/ui/dropdown-menu';";
const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";
const COMPONENT_IMPORTS = '...NDS_DROPDOWN_MENU, NdsButton';

/** Atributos que sobraram depois de omitir os padrões, com o espaço à esquerda. */
function attrs(...list: Array<string | false | undefined>): string {
  const used = list.filter(Boolean);
  return used.length ? ` ${used.join(' ')}` : '';
}

/** O componente que se escreve: imports, template e — quando há estado — corpo. */
function example(template: string, body?: string): string {
  return `${MENU_IMPORT}
${BUTTON_IMPORT}

@Component({
  imports: [${COMPONENT_IMPORTS}],
  template: \`
${template}
  \`,
})
export class Exemplo {${body ? `\n${body}\n` : ''}}`;
}

/**
 * A forma canônica do menu: raiz, gatilho no mesmo `<button>` e o `ng-template`
 * de conteúdo.
 *
 * `items` chega pronto e já indentado — cada story tem um miolo diferente, e é
 * justamente o miolo o assunto de quase todas elas.
 */
function menuMarkup(o: {
  rootAttrs?: string;
  contentAttrs?: string;
  trigger: string;
  items: string;
  pad?: string;
}): string {
  const pad = o.pad ?? '    ';
  const p2 = `${pad}  `;

  return `${pad}<nds-dropdown-menu${o.rootAttrs ?? ''}>
${p2}<button ndsDropdownMenuTrigger ndsButton variant="outline">${o.trigger}</button>

${p2}<ng-template ndsDropdownMenuContent${o.contentAttrs ?? ''}>
${o.items}
${p2}</ng-template>
${pad}</nds-dropdown-menu>`;
}

/** Menu sem estado externo nenhum — a forma de doze dos treze snippets. */
function simpleMenu(trigger: string, items: string, rootAttrs = ''): string {
  return example(menuMarkup({ rootAttrs, trigger, items }));
}

// ─── Playground ───────────────────────────────────────────────────────────────

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args (`[side]="side"`). Isso é o andaime da story, não o
 * que alguém escreve para usar o menu. O `transform` devolve o uso real, com os
 * valores atuais dos controls já resolvidos (ver a nota em `separator.stories.ts`).
 */
export function dropdownMenuPlaygroundSource(
  _gerado?: string,
  ctx: { args?: Partial<DropdownMenuArgs> } = {},
): string {
  const {
    side = 'bottom',
    align = 'start',
    modal = true,
    defaultOpen = false,
  } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor default ensina
  // ruído a quem copia. A raiz carrega abertura e modalidade; o conteúdo
  // carrega lado e alinhamento — trocar de lugar é o erro mais fácil aqui.
  return example(
    menuMarkup({
      rootAttrs: attrs(
        defaultOpen ? '[defaultOpen]="true"' : '',
        modal ? '' : '[modal]="false"',
      ),
      contentAttrs: attrs(
        side === 'bottom' ? '' : `side="${side}"`,
        align === 'start' ? '' : `align="${align}"`,
      ),
      trigger: 'Abrir menu',
      items: `        <div ndsDropdownMenuGroup>
          <div ndsDropdownMenuLabel>Conta</div>
          <div ndsDropdownMenuItem>Perfil</div>
          <div ndsDropdownMenuItem>Configurações</div>
          <div ndsDropdownMenuSeparator></div>
          <div ndsDropdownMenuItem variant="destructive">Sair</div>
        </div>`,
    }),
  );
}

// ─── Variantes: as duas ênfases de item ───────────────────────────────────────

/**
 * Item neutro — a ênfase que não se escreve.
 *
 * `variant="default"` é o padrão da diretiva, e escrevê-lo daria a entender que
 * existe uma escolha a fazer no caso comum.
 */
export function dropdownMenuDefaultSource(): string {
  return simpleMenu(
    'Conta',
    `        <div ndsDropdownMenuItem>Perfil</div>
        <div ndsDropdownMenuItem>Configurações</div>
        <div ndsDropdownMenuItem>Equipe</div>`,
  );
}

/**
 * Item destrutivo — a ação irreversível marcada pela cor de perigo.
 *
 * Ela existe para que "Excluir conta" não pareça "Editar perfil", e vem por
 * ÚLTIMO, separada das demais: o separador é o que a tira do alcance de um
 * clique distraído.
 */
export function dropdownMenuDestructiveSource(): string {
  return simpleMenu(
    'Conta',
    `        <div ndsDropdownMenuItem>Perfil</div>
        <div ndsDropdownMenuSeparator></div>
        <div ndsDropdownMenuItem variant="destructive">Excluir conta</div>`,
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

/**
 * Fechado — o estado inicial, e o uso mais comum do componente.
 *
 * Não há prop nenhuma para isso: fechado é o que o componente faz sem que se
 * peça, e o popup sequer chega ao DOM. É a ausência que é o assunto.
 */
export function dropdownMenuClosedSource(): string {
  return simpleMenu(
    'Abrir menu',
    `        <div ndsDropdownMenuItem>Perfil</div>
        <div ndsDropdownMenuItem>Configurações</div>`,
  );
}

/**
 * Aberto de saída — a exceção declarada à regra de não publicar `defaultOpen`.
 *
 * Aqui estar aberto É o assunto: setas, Home, End e o salto por letra vêm do
 * primitivo e não pedem prop nenhuma, então sem o menu montado a story não
 * mostraria nada. Escrever uma prop para o teclado ensinaria API que não existe.
 */
export function dropdownMenuOpenSource(): string {
  return simpleMenu(
    'Abrir menu',
    `        <div ndsDropdownMenuItem>Perfil</div>
        <div ndsDropdownMenuItem>Configurações</div>
        <div ndsDropdownMenuItem>Equipe</div>`,
    ' [defaultOpen]="true"',
  );
}

/**
 * Abertura decidida por fora: `open` entra ligado e `openChange` devolve cada
 * mudança.
 *
 * Ligar só a primeira é o defeito clássico — o menu fecha na tela pelo Escape
 * ou pelo clique fora, o valor de fora continua `true`, e ele reabre no ciclo
 * seguinte de detecção.
 *
 * O estado é um SINAL, e aqui o snippet se afasta de propósito do `props` da
 * story: o renderer do Storybook aceita um campo comum porque monta um objeto
 * de props, mas num componente de verdade quem agenda o redesenho é a escrita
 * no sinal. A tela é a mesma; o que se escreve, não.
 */
export function dropdownMenuControlledSource(): string {
  const menu = menuMarkup({
    rootAttrs: ' [open]="isOpen()" (openChange)="isOpen.set($event)"',
    trigger: 'Ações',
    items: `          <div ndsDropdownMenuItem>Duplicar</div>
          <div ndsDropdownMenuItem>Arquivar</div>`,
    pad: '      ',
  });

  return example(
    `    <div class="nds-cluster" data-spacing="md">
      <button ndsButton variant="secondary" (click)="isOpen.set(!isOpen())">
        {{ isOpen() ? 'Fechar pelo estado' : 'Abrir pelo estado' }}
      </button>

${menu}
    </div>`,
    '  readonly isOpen = signal(false);',
  );
}

/**
 * Item indisponível — continua no menu, e é anunciado.
 *
 * O padrão WAI-ARIA de menu quer o item desabilitado ALCANÇÁVEL pela seta, para
 * que o leitor de tela o anuncie; o que ele não pode é executar. As duas coisas
 * vêm da prop, não de cada consumidor: `aria-disabled`, e `pointer-events: none`
 * que impede o clique de chegar.
 */
export function dropdownMenuItemDisabledSource(): string {
  return simpleMenu(
    'Ações',
    `        <div ndsDropdownMenuItem>Duplicar</div>
        <div ndsDropdownMenuItem disabled>Arquivar</div>`,
  );
}

/**
 * Os três estados de uma marcação, lado a lado.
 *
 * O estado é TRI-VALORADO: `true`, `false` e `'indeterminate'` — o misto,
 * "alguns dos filhos". Os três são escritos por extenso de propósito: o assunto
 * é o CONTRASTE entre eles, e omitir o desmarcado apagaria metade da lição.
 *
 * O valor entra fixo, e não ligado a estado: um par `checked`/`checkedChange`
 * aqui pediria um estado que a story não tem — e o primeiro clique num item
 * misto o resolve para marcado, que é outro assunto.
 */
export function dropdownMenuCheckboxIndeterminateSource(): string {
  return simpleMenu(
    'Colunas',
    `        <div ndsDropdownMenuLabel>Colunas visíveis</div>
        <div ndsDropdownMenuCheckboxItem [checked]="'indeterminate'">Nome</div>
        <div ndsDropdownMenuCheckboxItem [checked]="true">E-mail</div>
        <div ndsDropdownMenuCheckboxItem [checked]="false">Telefone</div>`,
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Grupos nomeados pelo próprio rótulo.
 *
 * É o que o rótulo entrega além do texto: sem ele o leitor anuncia "grupo" e a
 * pessoa não sabe de qual bloco se trata. O rótulo NÃO é item de menu — a seta
 * não pousa nele, e o salto por letra não o traz como resultado.
 */
export function dropdownMenuWithLabelSource(): string {
  return simpleMenu(
    'Conta',
    `        <div ndsDropdownMenuGroup>
          <div ndsDropdownMenuLabel>Conta</div>
          <div ndsDropdownMenuItem>Perfil</div>
          <div ndsDropdownMenuItem>Configurações</div>
        </div>

        <div ndsDropdownMenuSeparator></div>

        <div ndsDropdownMenuGroup>
          <div ndsDropdownMenuLabel>Suporte</div>
          <div ndsDropdownMenuItem>Documentação</div>
          <div ndsDropdownMenuItem>Sair</div>
        </div>`,
  );
}

/**
 * Alternadores independentes entre si.
 *
 * Cada item guarda a própria marcação, e alternar NÃO fecha o menu — quem marca
 * uma coluna costuma marcar a próxima. É o que separa a marcação da escolha
 * única, onde o valor mora no grupo.
 */
export function dropdownMenuWithCheckboxSource(): string {
  return example(
    menuMarkup({
      trigger: 'Colunas',
      items: `        <div ndsDropdownMenuGroup>
          <div ndsDropdownMenuLabel>Colunas visíveis</div>
          <div
            ndsDropdownMenuCheckboxItem
            [checked]="showName()"
            (checkedChange)="showName.set($event)"
          >Nome</div>
          <div
            ndsDropdownMenuCheckboxItem
            [checked]="showEmail()"
            (checkedChange)="showEmail.set($event)"
          >E-mail</div>
        </div>`,
    }),
    `  readonly showName = signal(true);
  readonly showEmail = signal(false);`,
  );
}

/**
 * Escolha única: o valor vive no GRUPO, não no item.
 *
 * É o que separa a escolha única da marcação — escolher um item desmarca o
 * anterior sem que ninguém escreva essa regra. Cada opção só declara o `value`
 * que representa.
 */
export function dropdownMenuWithRadioSource(): string {
  return example(
    menuMarkup({
      trigger: 'Tema',
      items: `        <div ndsDropdownMenuRadioGroup [value]="theme()" (valueChange)="theme.set($event)">
          <div ndsDropdownMenuLabel>Aparência</div>
          <div ndsDropdownMenuRadioItem value="light">Claro</div>
          <div ndsDropdownMenuRadioItem value="dark">Escuro</div>
          <div ndsDropdownMenuRadioItem value="system">Sistema</div>
        </div>`,
    }),
    "  readonly theme = signal('light');",
  );
}

/**
 * Um segundo nível que abre AO LADO.
 *
 * A tríade é obrigatória: `<nds-dropdown-menu-sub>` guarda o estado, o
 * `ndsDropdownMenuSubTrigger` é o item que abre, e o `ndsDropdownMenuSubContent`
 * é o painel filho. O chevron entra pelo componente e o par
 * `aria-haspopup`/`aria-expanded` também — a seta para a direita entra, a da
 * esquerda volta, e nada disso pede prop.
 */
export function dropdownMenuWithSubmenuSource(): string {
  return simpleMenu(
    'Arquivo',
    `        <div ndsDropdownMenuItem>Renomear</div>

        <nds-dropdown-menu-sub>
          <div ndsDropdownMenuSubTrigger>Exportar</div>

          <ng-template ndsDropdownMenuSubContent>
            <div ndsDropdownMenuItem>PDF</div>
            <div ndsDropdownMenuItem>CSV</div>
          </ng-template>
        </nds-dropdown-menu-sub>`,
  );
}

/**
 * O atalho encostado na borda direita do item.
 *
 * Ele mora DENTRO do item, e sem `aria-hidden`: é assim que entra no nome
 * acessível ("Copiar Ctrl+C"). Escondido, a pessoa ouviria só "Copiar" e nunca
 * saberia que existe uma tecla. Registrar a tecla continua sendo de quem
 * consome — o componente só exibe.
 */
export function dropdownMenuWithShortcutsSource(): string {
  return simpleMenu(
    'Editar',
    `        <div ndsDropdownMenuItem>
          Desfazer <span ndsDropdownMenuShortcut>Ctrl+Z</span>
        </div>
        <div ndsDropdownMenuItem>
          Copiar <span ndsDropdownMenuShortcut>Ctrl+C</span>
        </div>
        <div ndsDropdownMenuSeparator></div>
        <div ndsDropdownMenuItem>
          Colar <span ndsDropdownMenuShortcut>Ctrl+V</span>
        </div>`,
  );
}
