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
 * Em 2026-09-17 fecharam as DUAS últimas, `TabLeavesMenu` e `TabAtPageEnd`: elas
 * nasceram depois daquela rodada, no arquivo-raiz, e a regra
 * `story_file_sem_transform` as pegou publicando template cru. São quinze
 * construtores para quinze stories, sem exclusão declarada.
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

/** Menu sem estado externo nenhum — a forma de doze dos quinze snippets. */
function simpleMenu(trigger: string, items: string, rootAttrs = ''): string {
  return example(menuMarkup({ rootAttrs, trigger, items }));
}

/**
 * A fileira em que o menu é UMA parada de tabulação entre outras.
 *
 * Os vizinhos não são andaime aqui, e a diferença é do assunto: nas duas stories
 * de Tab o que se ensina é PARA ONDE o foco vai quando o menu fecha, e sem um
 * ponto de tabulação ao lado não há destino nenhum a mostrar. É o contrário do
 * que vale na `States/Focused` do popover, onde a mesma fileira existe só para a
 * play ter onde medir e por isso fica fora do snippet.
 *
 * `hasAfter` é o que separa as duas: com vizinho depois, o Tab sai para ele; sem
 * vizinho, o gatilho é a última parada da página e o foco volta para ele.
 */
function tabRow(menu: string, hasAfter: boolean): string {
  const after = hasAfter ? '\n      <button ndsButton variant="ghost">Depois</button>' : '';
  return `    <div class="nds-cluster" data-spacing="md">
      <button ndsButton variant="ghost">Antes</button>
${menu}${after}
    </div>`;
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

// ─── Tab sai do menu ──────────────────────────────────────────────────────────

/**
 * O menu entre dois pontos de tabulação da página.
 *
 * Menu não é diálogo: o Tab fecha e o foco segue a página a partir do GATILHO —
 * o vizinho depois dele, ou o de antes no Shift+Tab —, e de dentro do submenu
 * fecha o menu INTEIRO. Nada disso pede prop: é o que o componente faz, e o que
 * o snippet ensina é o CONTEXTO em que dá para ver isso acontecer.
 *
 * O submenu está aqui pelo mesmo motivo: sem o segundo nível não haveria como
 * mostrar que o Tab de dentro dele não fecha só o filho.
 */
export function dropdownMenuTabLeavesMenuSource(): string {
  return example(
    tabRow(
      menuMarkup({
        trigger: 'Abrir menu',
        items: `          <div ndsDropdownMenuItem>Perfil</div>
          <div ndsDropdownMenuItem>Configurações</div>

          <nds-dropdown-menu-sub>
            <div ndsDropdownMenuSubTrigger>Exportar</div>

            <ng-template ndsDropdownMenuSubContent>
              <div ndsDropdownMenuItem>PDF</div>
              <div ndsDropdownMenuItem>CSV</div>
            </ng-template>
          </nds-dropdown-menu-sub>`,
        pad: '      ',
      }),
      true,
    ),
  );
}

/**
 * O gatilho como ÚLTIMA parada da página.
 *
 * Construtor próprio, e não um reaproveitamento de `dropdownMenuClosedSource`:
 * o menu é o mesmo, mas o snippet daquela story publica o menu SOZINHO, e aqui
 * é justamente a fileira — com vizinho antes e nenhum depois — que faz a lição
 * existir. Markup diferente não compartilha construtor.
 */
export function dropdownMenuTabAtPageEndSource(): string {
  return example(
    tabRow(
      menuMarkup({
        trigger: 'Abrir menu',
        items: `          <div ndsDropdownMenuItem>Perfil</div>
          <div ndsDropdownMenuItem>Configurações</div>`,
        pad: '      ',
      }),
      false,
    ),
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
          <div
            ndsDropdownMenuCheckboxItem
            [checked]="showRole()"
            (checkedChange)="showRole.set($event)"
          >Função</div>
        </div>`,
    }),
    `  readonly showName = signal(true);
  readonly showEmail = signal(false);
  readonly showRole = signal(false);`,
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
 * é o painel filho. O chevron entra pelo componente, e o ARIA também:
 * `aria-haspopup`, `aria-expanded` e o `aria-owns` que liga o item ao painel
 * portalado — a seta para a direita entra, a da esquerda volta, e nada disso
 * pede prop.
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

// ─── O menu como DADO ─────────────────────────────────────────────────────────
//
// O card de Variantes da docs page monta a prévia VIVA e o código ao lado a
// partir da MESMA lista de entradas — é isso que impede os dois de divergirem.
// Até 2026-09-18 o construtor morava dentro da própria docs page
// (`DropdownMenuDocs.ts`), onde react, vue e vanilla já o expunham em `ui/`
// (inconsistência 22 da §7 do PRD): snippet montado dentro da página não é
// importável, e por isso não era testável.
//
// Os rótulos chegam RESOLVIDOS — quem chama os lê do conteúdo compartilhado, no
// idioma da página. O construtor não conhece `translations.json`, e é essa
// fronteira que o deixa rodar em node.
//
// O que NÃO entra: a instrumentação da página (`(onOpenChange)`, `(onSelect)`
// ligados ao rastreio). É andaime da docs page, não lição do menu.

/** Item de ação. `label` já vem no idioma de quem chama. */
export type DropdownMenuSnippetItem = {
  kind: 'item';
  label: string;
  /** Texto do atalho exibido à direita, quando há. */
  shortcut?: string;
  destructive?: boolean;
};

/** Item de marcação — `checked` é o estado que o exemplo publica. */
export type DropdownMenuSnippetCheckbox = {
  kind: 'checkbox';
  label: string;
  checked: boolean;
};

export type DropdownMenuSnippetEntry =
  | DropdownMenuSnippetItem
  | DropdownMenuSnippetCheckbox
  | { kind: 'separator' }
  /** O rótulo vai DENTRO do grupo, que é o que faz dele o nome do bloco. */
  | {
      kind: 'group';
      label: string;
      entries: readonly (DropdownMenuSnippetItem | DropdownMenuSnippetCheckbox)[];
    }
  | {
      kind: 'radio-group';
      label: string;
      value: string;
      options: readonly { label: string; value: string }[];
    }
  | { kind: 'sub'; label: string; entries: readonly DropdownMenuSnippetItem[] };

export type DropdownMenuSnippetOptions = {
  /** Texto do botão que abre o menu. */
  triggerLabel?: string;
  /** O menu como lista de entradas; sem ela, o menu canônico. */
  entries?: readonly DropdownMenuSnippetEntry[];
};

/**
 * O menu canônico — o mesmo grupo rotulado, divisor e saída destrutiva que a
 * guarda transversal chama sem argumento nenhum.
 */
const SNIPPET_ENTRIES_DEFAULT: readonly DropdownMenuSnippetEntry[] = [
  {
    kind: 'group',
    label: 'Conta',
    entries: [
      { kind: 'item', label: 'Perfil' },
      { kind: 'item', label: 'Configurações' },
    ],
  },
  { kind: 'separator' },
  { kind: 'item', label: 'Sair', destructive: true },
];

/** O trecho do menu descrito por `entries`, com os rótulos exatamente como chegam. */
export function dropdownMenuSnippet(o: DropdownMenuSnippetOptions = {}): string {
  const entries = o.entries ?? SNIPPET_ENTRIES_DEFAULT;
  const pad = (n: number) => ' '.repeat(n);
  const itemLines = (e: DropdownMenuSnippetItem, n: number): string[] => {
    const variant = e.destructive ? ' variant="destructive"' : '';
    if (!e.shortcut) return [`${pad(n)}<div ndsDropdownMenuItem${variant}>${e.label}</div>`];
    return [
      `${pad(n)}<div ndsDropdownMenuItem${variant}>`,
      `${pad(n + 2)}${e.label} <span ndsDropdownMenuShortcut>${e.shortcut}</span>`,
      `${pad(n)}</div>`,
    ];
  };
  const leaf = (e: DropdownMenuSnippetItem | DropdownMenuSnippetCheckbox, n: number): string[] =>
    e.kind === 'item'
      ? itemLines(e, n)
      : [`${pad(n)}<div ndsDropdownMenuCheckboxItem [checked]="${e.checked}">${e.label}</div>`];

  const lines: string[] = [];
  for (const entry of entries) {
    if (entry.kind === 'separator') {
      lines.push(`${pad(4)}<div ndsDropdownMenuSeparator></div>`);
    } else if (entry.kind === 'item' || entry.kind === 'checkbox') {
      lines.push(...leaf(entry, 4));
    } else if (entry.kind === 'group') {
      lines.push(`${pad(4)}<div ndsDropdownMenuGroup>`);
      lines.push(`${pad(6)}<div ndsDropdownMenuLabel>${entry.label}</div>`);
      for (const child of entry.entries) lines.push(...leaf(child, 6));
      lines.push(`${pad(4)}</div>`);
    } else if (entry.kind === 'radio-group') {
      lines.push(`${pad(4)}<div ndsDropdownMenuRadioGroup value="${entry.value}">`);
      lines.push(`${pad(6)}<div ndsDropdownMenuLabel>${entry.label}</div>`);
      for (const opt of entry.options) {
        lines.push(`${pad(6)}<div ndsDropdownMenuRadioItem value="${opt.value}">${opt.label}</div>`);
      }
      lines.push(`${pad(4)}</div>`);
    } else {
      lines.push(`${pad(4)}<nds-dropdown-menu-sub>`);
      lines.push(`${pad(6)}<div ndsDropdownMenuSubTrigger>${entry.label}</div>`);
      lines.push(`${pad(6)}<ng-template ndsDropdownMenuSubContent>`);
      for (const child of entry.entries) lines.push(...itemLines(child, 8));
      lines.push(`${pad(6)}</ng-template>`);
      lines.push(`${pad(4)}</nds-dropdown-menu-sub>`);
    }
  }

  return `<nds-dropdown-menu>
  <button ndsDropdownMenuTrigger ndsButton variant="outline">${o.triggerLabel ?? 'Conta'}</button>

  <ng-template ndsDropdownMenuContent>
${lines.join('\n')}
  </ng-template>
</nds-dropdown-menu>`;
}
