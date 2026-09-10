import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  RdxAutocompleteGroup,
  RdxAutocompleteGroupLabel,
  RdxAutocompleteInput,
  RdxAutocompleteItem,
  RdxAutocompleteList,
  RdxAutocompleteRoot,
  type AutocompleteValueChangeDetails,
} from '@radix-ng/primitives/autocomplete';
import type { ComboboxItemRef } from '@radix-ng/primitives/combobox';

// ─── Command ──────────────────────────────────────────────────────────────────
//
// Visual: classes `.nds-command-*` (docs/shared/styles/nds/command.css). O
// markup é o do Vanilla — a referência cross-stack:
//
//   <div class="nds-command" data-slot="command">
//     <div class="nds-command-input-wrapper">
//       <svg>…lupa…</svg>
//       <input class="nds-command-input" role="combobox">
//     </div>
//     <div class="nds-command-list" role="listbox">
//       <div class="nds-command-group">
//         <div class="nds-command-group-heading">Categoria</div>
//         <div class="nds-command-item" role="option" aria-selected="false">…</div>
//
// ─── DECISÃO DE ACESSIBILIDADE — versão curta ─────────────────────────────────
//
// Bloco canônico no `command.ts` do Vanilla. Em uma frase: a paleta é um
// COMBOBOX com listbox, e o que a define é o foco NUNCA sair do campo de busca
// — as setas movem o destaque, e quem conta ao leitor de tela onde ele está é o
// `aria-activedescendant`. É o que a separa do dropdown-menu (que move o foco
// de verdade), do popover (que recebe foco) e do tooltip (que nem recebe).
//
// O mecanismo desta stack está descrito logo abaixo, em "Por que COM primitivo":
// o `RdxAutocompleteRoot` entrega o par combobox → listbox inteiro, com id real
// dos dois lados. O que foi escrito à mão, e por quê:
//
//   · `NdsCommandEmpty` — região viva (`role="status"` + `aria-live` +
//     `aria-atomic`), montada o tempo todo e FORA da lista. É a ÚNICA região
//     viva do componente, e a justificativa está no item 6 do bloco canônico:
//     no vazio a mudança acontece longe do foco, e sem anúncio quem lê de
//     ouvido digitaria no vazio sem saber que a busca não achou nada;
//   · `NdsCommandSeparator` — decorativo, porque `RdxAutocompleteSeparator`
//     emite `role="separator"`, filho não permitido de `listbox`. E ele SAI
//     quando um dos lados esvazia no filtro: traço sem nada de um lado não
//     marca fronteira nenhuma (ver `NdsCommand.isSeparatorVisible`);
//   · a parada nas pontas: o primitivo LAÇA as setas (`loopFocus` nasce
//     `true` nele), e a paleta para no último comando — ver
//     `NdsCommand.stopAtEdge`;
//   · o texto que o filtro compara exclui o atalho — ver `NdsCommandShortcut`;
//   · o primeiro comando habilitado em destaque ao montar e a cada busca (PRD,
//     D11) — o `autoHighlight` do primitivo nasce desligado; ver
//     `NdsCommand.highlightFirstOnSearch`;
//   · `aria-selected` no item, que o primitivo marca só como
//     `data-highlighted`;
//   · o nome acessível da LISTA, herdado do campo (o axe cobra por
//     `aria-input-field-name`, e listbox anônimo é listbox sem nome), e
//     acompanhando o placeholder quando ele muda com o idioma;
//   · grupo sem cabeçalho sem papel de grupo — o primitivo escreve
//     `role="group"` fixo, e grupo anônimo não diz nada a quem ouve.
//
// ─── Por que COM primitivo, e qual ────────────────────────────────────────────
//
// O Radix NG não tem um primitivo "command". Tem `@radix-ng/primitives/
// autocomplete`, que é a mesma máquina: um campo de texto que FILTRA uma lista
// e a percorre por `aria-activedescendant`, sem nunca tirar o foco do campo. É
// exatamente o que separa uma paleta de comandos de um menu — e é a parte que
// se escreve errado à mão. O que ele entrega e não está reescrito aqui:
//
//   · `role="combobox"` no campo com `aria-autocomplete`, `aria-expanded`,
//     `aria-controls` apontando para o id REAL da lista e `aria-activedescendant`
//     apontando para o id REAL da opção em destaque;
//   · `role="listbox"` na lista e `role="option"` em cada item, com
//     `aria-setsize` / `aria-posinset` contados sobre os itens VISÍVEIS;
//   · filtro (contains sensível ao locale, ou função própria via `filter`),
//     com o item fora do resultado saindo da árvore de acessibilidade;
//   · grupo que se esconde sozinho quando todos os seus itens são filtrados;
//   · ↓ ↑ percorrendo só os itens navegáveis (o desabilitado é pulado), e o
//     item destacado rolando para dentro da vista;
//   · Enter selecionando o item em destaque; o foco NUNCA sai do campo.
//
// O próprio primitivo prevê este uso: o handler de Tab dele tem, escrito,
// "the always-open, inline command palette layout". A paleta é o autocomplete
// sem popup — a lista está sempre montada, então a raiz nasce aberta e nenhum
// fechamento é aceito (ver `NdsCommand`).
//
// ─── O que NÃO se compõe, e por quê ───────────────────────────────────────────
//
//   · `RdxAutocompletePortal` / `Positioner` / `Popup`: a paleta não flutua.
//     Quem flutua é o Dialog (padrão command palette), e ele já existe neste
//     stack.
//   · `RdxAutocompleteEmpty`: é `@Component`, e `@Component` não pode ser host
//     directive. A região viva foi reescrita — são quatro atributos.
//   · `RdxAutocompleteSeparator`: ele emite `role="separator"`, e separador não
//     é filho permitido de `role="listbox"` (o axe reprova por
//     `aria-required-children`). O divisor da paleta é decorativo, como no
//     Vanilla, e sai da árvore com `aria-hidden`.

/** O que sai quando um comando é escolhido. */
export interface CommandSelectDetails {
  /** `value` do item — estável, é o que vai para o analytics. */
  value: string;
  /** Texto do item que o filtro compara — o rótulo, sem o atalho. */
  label: string;
}

/** `a` vem antes de `b` na ordem do documento. */
function precedes(a: Node, b: Node): boolean {
  return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

// ─── NdsCommand ───────────────────────────────────────────────────────────────

/**
 * Raiz da paleta — estado da busca, filtro e navegação.
 *
 * `@Component` com seletor de ELEMENTO, e não diretiva de atributo, por causa
 * do template: o ícone de lupa e o invólucro do campo são parte do componente,
 * não do call site. Repetir seis linhas de SVG em toda página é como a lupa
 * some quando alguém esquece — mesmo raciocínio do botão X do Dialog. O
 * `<input ndsCommandInput>` que quem consome escreve é PROJETADO para dentro
 * desse invólucro, então o DOM final é o do Vanilla, nó por nó.
 *
 * A raiz nasce aberta e nunca fecha. `open` é o interruptor que o autocomplete
 * usa para decidir se há popup; aqui não há — a lista mora na página. Todo
 * pedido de fechamento (Escape, seleção de item) é VETADO pelo
 * `eventDetails.cancel()` que o próprio primitivo oferece, e não por um
 * `open.set(true)` reativo, que brigaria com a lib a cada quadro.
 */
@Component({
  selector: 'nds-command',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxAutocompleteRoot,
      // Só o que faz sentido numa paleta. `open` e `defaultOpen` ficam de fora
      // de propósito: expô-los deixaria quem consome desligar a lista sem que
      // nada no DOM sumisse, que é um estado impossível de explicar.
      //
      // `loopFocus` também fica de fora, mas por outro motivo: o padrão dele no
      // primitivo é `true`, e o contrato da paleta é o contrário — a seta PARA
      // no último comando. `hostDirectives` não troca o padrão de um input, e
      // um input de sinal não se escreve de fora; por isso a paleta declara o
      // PRÓPRIO `loopFocus` (padrão `false`) e barra a tecla nas pontas. Ver
      // `stopAtEdge`.
      //
      // `autoHighlight` saiu em 2026-09-10 (D11): o destaque do primeiro
      // comando é CONTRATO das cinco stacks, e não preferência. Ligado, o modo
      // do primitivo destacaria o primeiro comando que COMEÇA com a busca, e
      // não o primeiro da lista — duas regras disputando o mesmo destaque.
      inputs: [
        'value',
        'defaultValue',
        'filter',
        'locale',
        'limit',
        'disabled',
        'highlightItemOnHover',
      ],
      outputs: ['valueChange'],
    },
  ],
  host: {
    class: 'nds-command',
    '[attr.data-slot]': '"command"',
  },
  template: `
    <div class="nds-command-input-wrapper">
      <!--
        Lupa decorativa: o nome acessível do campo vem do rótulo dele, e
        repetir "buscar" no leitor de tela seria eco. Desenhada à mão, como o
        X do Dialog — ícone estático não precisa do pacote lucide.
      -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>

      <ng-content select="input[ndsCommandInput]" />
    </div>

    <ng-content />
  `,
})
export class NdsCommand {
  /**
   * Emitido a cada comando escolhido, por clique ou por Enter.
   *
   * Existe além do output por item porque a paleta costuma ter um único
   * despachante: quem monta a lista a partir de um array quer um handler só.
   */
  readonly itemSelect = output<CommandSelectDetails>();

  /**
   * As setas voltam ao começo depois do último comando (e ao fim antes do
   * primeiro). Desligado — o padrão —, elas param nas pontas.
   *
   * Parar é o que a pessoa espera de uma lista que ela está lendo de cima para
   * baixo: com laço, uma seta a mais leva o destaque de volta ao topo, longe do
   * que se estava olhando, e numa lista longa o salto some da vista.
   */
  readonly loopFocus = input(false, { transform: booleanAttribute });

  /**
   * Nome acessível da busca, publicado pelo campo e lido pela lista.
   *
   * O `role="listbox"` também precisa de nome (o axe cobra por
   * `aria-input-field-name`), e o Vanilla usa o placeholder para os dois. Aqui
   * o campo publica o valor resolvido e a lista o herda — assim ninguém
   * precisa escrever o mesmo texto duas vezes, e a lista nunca fica anônima.
   */
  readonly rotuloDeBusca = signal<string | undefined>(undefined);

  private readonly root = inject(RdxAutocompleteRoot, { self: true });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /**
   * Item do primitivo → emissor do `NdsCommandItem` correspondente.
   *
   * A seleção chega pela raiz (o primitivo não tem output por item), e é aqui
   * que ela vira o `(onSelect)` daquele item específico.
   */
  private readonly registro = new Map<ComboboxItemRef, (d: CommandSelectDetails) => void>();

  /**
   * Item que acabou de receber um clique, quando há um.
   *
   * O destaque resolve Enter e o arrasto, mas o clique só passa a valer quando
   * o ponteiro tiver se movido sobre o item antes (é o hover que destaca). Um
   * `.click()` sintético não move ponteiro nenhum e escolheria o item que
   * estivesse destacado de antes — o comando errado, sem erro nenhum.
   */
  private alvoDoClique: ComboboxItemRef | null = null;

  /**
   * A busca e o resultado que já receberam o destaque inicial.
   *
   * É o que deixa a mesma regra correr por dois caminhos sem que um desfaça o
   * outro: o campo a chama no próprio evento `input` (síncrono — Enter logo
   * depois de digitar precisa achar o destaque pronto), e o efeito a chama no
   * ciclo seguinte. Sem a marca, o efeito chegaria DEPOIS de uma seta rápida e
   * devolveria o destaque ao topo.
   */
  private highlightedFor: { query: string; items: readonly unknown[] } | null = null;

  constructor() {
    // Nenhum fechamento é aceito. O Escape dentro de um Dialog não passa por
    // aqui: a camada de dispensa do Dialog escuta o keydown no `document` em
    // fase de captura, fecha o diálogo e interrompe a propagação antes de o
    // campo ver a tecla.
    this.root.onOpenChange.subscribe((mudanca) => {
      if (!mudanca.open) mudanca.eventDetails.cancel();
    });

    this.root.onValueChange.subscribe((detalhes) => this.aoMudarValor(detalhes));

    // Depois das assinaturas: abrir emite `onOpenChange`, e um listener
    // registrado tarde demais não veria a primeira mudança.
    this.root.open.set(true);

    // O caminho que cobre o que não passa pelo campo: os comandos se registram
    // no render seguinte ao da montagem (é o "ao abrir"), itens entram e saem
    // da lista, e a busca é zerada por quem escolhe. Seta e ponteiro não mudam
    // nenhuma das duas leituras, então não disparam nada aqui.
    effect(() => {
      this.root.value();
      this.root.filteredItems();
      untracked(() => this.highlightFirstOnSearch());
    });
  }

  /**
   * @internal O PRIMEIRO comando habilitado vai para o destaque — ao montar e a
   * cada busca (PRD, D11). Digitar e apertar Enter executa.
   *
   * Roda uma vez por par busca × resultado: seta e ponteiro movem o destaque
   * depois disso, e só uma busca nova o devolve ao topo — mesmo quando o
   * comando destacado continua na lista. `highlightFirst` do primitivo já pula
   * o desabilitado e o filtrado, e com a lista vazia solta o destaque: o campo
   * não aponta para uma opção que não está na tela.
   */
  highlightFirstOnSearch(): void {
    if (!this.root.open()) return;
    const query = this.root.value();
    const items = this.root.filteredItems();
    const last = this.highlightedFor;
    if (last && last.query === query && last.items === items) return;
    this.highlightedFor = { query, items };
    this.root.highlightFirst('none');
  }

  /** @internal Chamado pelo `NdsCommandItem` ao nascer. */
  registrarItem(ref: ComboboxItemRef, emitir: (d: CommandSelectDetails) => void): void {
    this.registro.set(ref, emitir);
  }

  /** @internal Chamado pelo `NdsCommandItem` ao morrer. */
  desregistrarItem(ref: ComboboxItemRef): void {
    this.registro.delete(ref);
    if (this.alvoDoClique === ref) this.alvoDoClique = null;
  }

  /** @internal Anuncia o item sob o clique, antes de o primitivo reagir a ele. */
  marcarAlvoDoClique(ref: ComboboxItemRef): void {
    this.alvoDoClique = ref;
  }

  /** @internal Solta a marca depois que o clique já correu inteiro. */
  limparAlvoDoClique(ref: ComboboxItemRef): void {
    if (this.alvoDoClique === ref) this.alvoDoClique = null;
  }

  /** Os comandos que o filtro deixou na tela, na ordem do documento. */
  private visibleInOrder(): ComboboxItemRef[] {
    return [...this.registro.keys()]
      .filter((ref) => ref.element.isConnected && this.root.isVisible(ref))
      .sort((a, b) => (precedes(a.element, b.element) ? -1 : 1));
  }

  /**
   * @internal Barra a seta que passaria da ponta — chamado pelo campo, em
   * captura, ANTES do handler de teclado do primitivo.
   *
   * Com o destaque no último comando navegável, ↓ não faz nada; no primeiro, ↑
   * não faz nada. É exatamente o que o primitivo faria com `loopFocus` falso: a
   * tecla é interrompida só quando ele ia laçar, e em qualquer outro ponto da
   * lista ela segue para ele intacta. O `preventDefault` segura também o cursor
   * de texto, que a seta levaria para o começo ou o fim do campo.
   */
  stopAtEdge(event: KeyboardEvent): void {
    if (this.loopFocus()) return;
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
      return;
    }
    const direction = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
    if (direction === 0) return;

    const current = this.root.highlightedItem();
    if (!current) return;

    const navigable = this.visibleInOrder().filter((ref) => !ref.disabled());
    const edge = direction === 1 ? navigable[navigable.length - 1] : navigable[0];
    if (current !== edge) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  /**
   * @internal O traço `sep` tem comando visível dos DOIS lados?
   *
   * Um traço marca a fronteira entre dois blocos, e quando o filtro esvazia um
   * deles não sobra fronteira: ficaria uma linha solta encostada no cabeçalho
   * do grupo que restou, ou no fim da lista. Por isso o traço só aparece com
   * algum comando visível ANTES dele e algum DEPOIS — e o "depois" para no
   * traço seguinte, para que dois traços com um bloco vazio no meio não
   * desenhem uma linha dupla.
   *
   * A leitura de `filteredItems` é o que liga o `computed` do traço ao filtro:
   * ela muda a cada busca e a cada comando que entra ou sai da lista.
   */
  isSeparatorVisible(sep: HTMLElement): boolean {
    this.root.filteredItems();

    const visibleEls = this.visibleInOrder().map((ref) => ref.element);
    const separators = [...this.host.querySelectorAll<HTMLElement>('.nds-command-separator')];
    const next = separators[separators.indexOf(sep) + 1];

    const before = visibleEls.some((el) => precedes(el, sep));
    const after = visibleEls.some(
      (el) => precedes(sep, el) && (next === undefined || precedes(el, next)),
    );
    return before && after;
  }

  /**
   * Traduz "o autocomplete commitou um rótulo" para "um comando foi escolhido".
   *
   * No autocomplete o valor É o texto do campo, então escolher um item escreve
   * o rótulo dele na busca. Numa paleta isso é errado duas vezes: o campo
   * passaria a mostrar o nome do comando que acabou de rodar, e a lista
   * ficaria filtrada por ele. O `cancel()` veta a escrita — é o uso que o
   * próprio primitivo documenta para "não sobrescrever um valor externo" — e a
   * busca é zerada logo em seguida, que é o que o Vanilla faz ao selecionar.
   *
   * QUAL item foi escolhido nunca sai de comparar rótulos: o clique se anuncia
   * em fase de captura, antes de o primitivo reagir, e Enter e arrasto usam o
   * item em destaque — que só é limpo DEPOIS desta emissão.
   */
  private aoMudarValor(detalhes: AutocompleteValueChangeDetails): void {
    if (detalhes.reason !== 'item-press') return;

    detalhes.eventDetails.cancel();

    const escolhido = this.alvoDoClique ?? this.root.highlightedItem();
    // Zerar a busca reabre a lista inteira para o próximo comando — com o
    // primeiro dela já em destaque, no mesmo evento.
    this.root.value.set('');
    this.highlightFirstOnSearch();

    if (!escolhido) return;

    const raw = escolhido.value();
    const carga: CommandSelectDetails = {
      value: raw === null || raw === undefined ? '' : String(raw),
      label: escolhido.textValue(),
    };

    this.registro.get(escolhido)?.(carga);
    this.itemSelect.emit(carga);
  }
}

// ─── NdsCommandInput ──────────────────────────────────────────────────────────

/**
 * Campo de busca. Detém o foco o tempo todo — as setas movem o DESTAQUE, nunca
 * o foco, e é o `aria-activedescendant` que conta ao leitor de tela onde ele
 * está.
 *
 * `@Directive` porque o host já é o `<input>` e não há nada para renderizar
 * dentro dele. Sem `data-slot` disputado: o primitivo não liga esse atributo,
 * então a linha aqui é a única (armadilha 11).
 */
@Directive({
  selector: 'input[ndsCommandInput]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxAutocompleteInput,
      inputs: ['id', 'invalid'],
    },
  ],
  host: {
    type: 'text',
    class: 'nds-command-input',
    '[attr.data-slot]': '"command-input"',
    '[attr.aria-label]': 'resolvedLabel()',
    // DEPOIS do `(input)` do primitivo, e é essa a ordem que se quer: os
    // listeners de host directive são registrados antes dos do host, então
    // quando este corre a busca nova já está no valor do primitivo.
    '(input)': 'highlightFirstOnSearch()',
  },
})
export class NdsCommandInput implements OnInit {
  /**
   * Nome acessível do campo. Vazio, cai no `placeholder` — que é o que o
   * Vanilla faz e o que quase todo mundo escreve de qualquer forma.
   */
  readonly label = input<string | undefined>(undefined);

  private readonly hostRef = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly comando = inject(NdsCommand);

  private readonly placeholder = signal<string | undefined>(undefined);

  protected readonly resolvedLabel = computed(() => this.label() ?? this.placeholder());

  constructor() {
    // Publica para a lista herdar o mesmo nome. Efeito, e não uma escrita
    // única, porque o rótulo muda junto com o idioma.
    effect(() => this.comando.rotuloDeBusca.set(this.resolvedLabel()));

    // Em captura, e registrado aqui, pelo mesmo motivo do clique no item: o
    // handler de teclado do primitivo mora no `host` dele, no mesmo elemento,
    // e um `(keydown)` declarado em `host` correria DEPOIS dele (armadilha 10)
    // — a seta já teria laçado. No alvo, o ouvinte de captura corre primeiro.
    const field = this.hostRef.nativeElement;
    const onKeydown = (event: KeyboardEvent): void => this.comando.stopAtEdge(event);
    field.addEventListener('keydown', onKeydown, { capture: true });

    // O placeholder é de quem consome — atributo estático, `[placeholder]` ou
    // `[attr.placeholder]` —, e muda quando o idioma troca. Um input próprio
    // com esse nome tomaria o binding do elemento nativo (e o `[attr.]` do
    // template perderia para o host binding dele); observar o atributo cobre
    // as três formas sem disputar nenhuma. A propriedade `placeholder` é
    // refletida no atributo, então o binding de propriedade também chega aqui.
    const observer = new MutationObserver(() => this.readPlaceholder());
    observer.observe(field, { attributes: true, attributeFilter: ['placeholder'] });

    inject(DestroyRef).onDestroy(() => {
      field.removeEventListener('keydown', onKeydown, { capture: true });
      observer.disconnect();
    });
  }

  ngOnInit(): void {
    // A primeira leitura. No construtor o binding de quem consome ainda não
    // foi aplicado e o placeholder viria vazio (armadilha 9); daqui em diante
    // quem acompanha é o observador.
    this.readPlaceholder();
  }

  /** @internal Busca nova, primeiro comando em destaque — ver `NdsCommand`. */
  protected highlightFirstOnSearch(): void {
    this.comando.highlightFirstOnSearch();
  }

  private readPlaceholder(): void {
    this.placeholder.set(this.hostRef.nativeElement.placeholder || undefined);
  }
}

// ─── NdsCommandList ───────────────────────────────────────────────────────────

/**
 * A lista de resultados — `role="listbox"`, com o id que o `aria-controls` do
 * campo aponta.
 *
 * `tabindex="-1"` vem do primitivo, e é o contrato (C4): numa combobox a lista
 * não é parada de tabulação — o foco fica no campo e a navegação é por
 * `aria-activedescendant`. Um `0` ali criaria uma segunda parada que não faz
 * nada.
 *
 * O `-1` tem um efeito colateral que o `mousedown` abaixo desfaz: elemento com
 * tabindex negativo não entra na tabulação, mas RECEBE foco pelo clique. O
 * item já cancela o próprio `mousedown` no primitivo; o que sobra é o clique
 * que cai na lista — num cabeçalho de grupo, na folga entre itens, ou num
 * comando desabilitado, que com `pointer-events: none` deixa o clique passar
 * para o que está atrás. Sem o cancelamento, esse clique tiraria o foco do
 * campo e a pessoa perderia a busca que estava digitando.
 */
@Directive({
  selector: 'div[ndsCommandList]',
  standalone: true,
  hostDirectives: [RdxAutocompleteList],
  host: {
    class: 'nds-command-list',
    '[attr.data-slot]': '"command-list"',
    '[attr.aria-label]': 'resolvedLabel()',
    '(mousedown)': '$event.preventDefault()',
  },
})
export class NdsCommandList {
  /** Sobrescreve o nome herdado do campo de busca. */
  readonly label = input<string | undefined>(undefined);

  private readonly comando = inject(NdsCommand);

  protected readonly resolvedLabel = computed(() => this.label() ?? this.comando.rotuloDeBusca());
}

// ─── NdsCommandEmpty ──────────────────────────────────────────────────────────

/**
 * "Nenhum resultado" — e o ponto não é desenhar a frase, é ANUNCIÁ-LA.
 *
 * O elemento fica montado o tempo todo, com `role="status"` e `aria-live`: uma
 * região viva só é lida quando o conteúdo muda DENTRO dela, então criá-la no
 * momento em que a busca esvazia não anuncia nada. O que aparece e some é o
 * conteúdo projetado.
 *
 * A classe `.nds-command-empty` é que entra e sai. Ela traz 24px de
 * `padding-block`, e mantê-la com a lista cheia deixaria um vão de 48px
 * embaixo dos resultados. Sem classe o elemento continua no DOM e na árvore de
 * acessibilidade, com altura zero — que é o oposto de `display: none`, e é o
 * que preserva o anúncio.
 *
 * Fica FORA do `<div ndsCommandList>` de propósito: `role="status"` não é
 * filho permitido de `role="listbox"`, e o axe reprova por
 * `aria-required-children`.
 */
@Component({
  selector: 'div[ndsCommandEmpty]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    '[class]': 'hostClass()',
    '[attr.data-slot]': '"command-empty"',
    '[attr.data-empty]': 'vazio() ? "" : null',
  },
  template: `
    @if (vazio()) {
      <ng-content />
    }
  `,
})
export class NdsCommandEmpty {
  private readonly root = inject(RdxAutocompleteRoot);

  protected readonly vazio = computed(() => this.root.visibleCount() === 0);

  protected readonly hostClass = computed(() => (this.vazio() ? 'nds-command-empty' : ''));
}

// ─── NdsCommandGroup ──────────────────────────────────────────────────────────

/**
 * Agrupa itens sob um rótulo — `role="group"` nomeado pelo próprio cabeçalho.
 *
 * Sem cabeçalho, o grupo é só o bloco que dá os 4px de respiro (e o raio
 * aninhado, D10) e NÃO tem papel: um "grupo" sem nome é anunciado como
 * "grupo" e mais nada, ruído na frente de cada lista. O primitivo escreve
 * `role="group"` como atributo ESTÁTICO do host, aplicado na criação do
 * elemento; o binding abaixo corre depois, a cada ciclo, e o tira quando não há
 * cabeçalho. Não é a disputa sem ordem de dois bindings (guideline 13, "data-slot
 * é contrato"): estático contra binding, o binding sempre vence.
 *
 * O primitivo esconde o grupo inteiro quando todos os seus itens saem do
 * filtro; sem isso a paleta mostraria "Utilitários" com nada embaixo.
 * `.nds-command-group` não declara `display`, então o atributo `hidden` que ele
 * liga vale sem ajuda.
 */
@Component({
  selector: 'div[ndsCommandGroup]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RdxAutocompleteGroupLabel],
  hostDirectives: [RdxAutocompleteGroup],
  host: {
    class: 'nds-command-group',
    '[attr.data-slot]': '"command-group"',
    '[attr.role]': 'heading() ? "group" : null',
  },
  template: `
    @if (heading()) {
      <div rdxAutocompleteGroupLabel class="nds-command-group-heading">{{ heading() }}</div>
    }

    <ng-content />
  `,
})
export class NdsCommandGroup {
  /** Cabeçalho do grupo. Vazio, o grupo existe sem rótulo visível. */
  readonly heading = input('');
}

// ─── NdsCommandItem ───────────────────────────────────────────────────────────

/**
 * Comando executável — `role="option"`.
 *
 * É um `<div>`, e não um `<button>`: a folha `.nds-command-item` não zera a
 * aparência nativa de botão, e um botão ali apareceria com fundo e borda do
 * navegador. O que a semântica pede não é a tag e sim papel, estado e teclado —
 * e o primitivo entrega os três sem o item nunca receber foco.
 *
 * `aria-selected` acompanha o destaque, para casar com o CSS compartilhado: é
 * o seletor que `.nds-command-item[aria-selected="true"]` usa para pintar o
 * item ativo, e é também o contrato ARIA de combobox — a opção referenciada
 * pelo `aria-activedescendant` é a selecionada. O primitivo marca só
 * `data-highlighted`, que nenhuma regra da folha alcança.
 *
 * O item filtrado some pelo atributo `hidden`, que o primitivo liga, e nada
 * aqui mexe nisso. Quem garante que ele some de verdade é a folha:
 * `.nds-command-item { display: flex }` é regra de autor e venceria o
 * `display: none` que o navegador dá a `[hidden]`, então a folha traz a regra
 * `.nds-command-item[hidden]` explícita (PRD, D6).
 */
@Component({
  selector: 'div[ndsCommandItem]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxAutocompleteItem,
      // `index` fica de fora: ele só serve ao modo virtualizado, que a paleta
      // não usa — a lista dela é escrita item a item.
      inputs: ['value', 'textValue', 'disabled'],
    },
  ],
  host: {
    class: 'nds-command-item',
    '[attr.data-slot]': '"command-item"',
    '[attr.data-value]': 'valorTexto()',
    '[attr.aria-selected]': 'destacado()',
    '[attr.data-checked]': 'marcaAttr()',
  },
  template: `
    <ng-content />

    @if (marcavel()) {
      <!--
        O check fica sempre no DOM quando o item é marcável: a folha alterna a
        OPACIDADE por [data-checked], e um ícone que entra e sai do DOM faria a
        largura do item pular a cada mudança. Decorativo — quem anuncia o
        estado é o data-checked lido pela aplicação, não o desenho.
      -->
      <svg
        class="nds-command-item-check"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    }
  `,
})
export class NdsCommandItem implements OnDestroy {
  /**
   * Estado de marcação. Indefinido = o item não é marcável e não ganha check.
   * Definido, vira `data-checked` e o check aparece quando verdadeiro.
   */
  readonly checked = input<boolean | undefined>(undefined);

  /** Emitido quando ESTE item é escolhido, por clique ou por Enter. */
  readonly onSelect = output<CommandSelectDetails>();

  private readonly ref = inject(RdxAutocompleteItem, { self: true });
  private readonly comando = inject(NdsCommand);

  protected readonly destacado = computed(() => (this.ref.isHighlighted() ? 'true' : 'false'));

  protected readonly valorTexto = computed(() => {
    const raw = this.ref.value();
    return raw === null || raw === undefined ? null : String(raw);
  });

  protected readonly marcavel = computed(() => this.checked() !== undefined);

  protected readonly marcaAttr = computed(() => {
    const checked = this.checked();
    return checked === undefined ? null : String(checked);
  });

  constructor() {
    this.comando.registrarItem(this.ref, (d) => this.onSelect.emit(d));

    // Registrado no construtor e em captura porque um listener declarado em
    // `host: { '(click)': … }` corre DEPOIS do listener do primitivo, que já
    // teria despachado a seleção (armadilha 10). A marca é solta num
    // microtask: a cadeia clique → seleção → emissão é toda síncrona, então
    // ela já foi consumida quando a limpeza roda, e um clique num item
    // desabilitado (que não chega a selecionar nada) não deixa resíduo.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const onClick = (): void => {
      this.comando.marcarAlvoDoClique(this.ref);
      queueMicrotask(() => this.comando.limparAlvoDoClique(this.ref));
    };
    host.addEventListener('click', onClick, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      host.removeEventListener('click', onClick, { capture: true }),
    );
  }

  ngOnDestroy(): void {
    this.comando.desregistrarItem(this.ref);
  }
}

// ─── NdsCommandShortcut ───────────────────────────────────────────────────────

/**
 * Atalho exibido à direita do comando.
 *
 * Só visual no sentido de que registrar a tecla é do consumidor — mas o texto
 * NÃO recebe `aria-hidden`: ele faz parte do nome da opção ("Buscar, Command
 * K"), que é o que dá serventia ao atalho para quem usa leitor de tela.
 *
 * A folha esconde o check quando há atalho no mesmo item
 * (`.nds-command-item:has([data-slot="command-shortcut"])`), então os dois não
 * disputam a borda direita.
 *
 * O atalho NÃO entra no texto que o filtro compara. Sem `textValue` explícito,
 * o primitivo lê o texto do item de um clone do elemento, e desse clone ele
 * tira os nós marcados com `rdxAutocompleteItemIndicator` — é o mecanismo que
 * ele tem para "isto está no item, mas não é o nome dele". O atributo estático
 * aqui põe o atalho nessa lista: buscar "Ctrl" não traz todo comando que tem
 * atalho, e o `label` que sai na escolha é o rótulo sem a tecla. Atributo, e
 * não a diretiva: a diretiva do primitivo esconderia o nó fora do item
 * marcado e o tiraria da árvore de acessibilidade, e o atalho é parte do nome
 * da opção. A story `WithShortcuts` busca "ctrl" e cobra zero resultados — é
 * ela que avisa se o primitivo mudar o seletor.
 */
@Directive({
  selector: 'span[ndsCommandShortcut]',
  standalone: true,
  host: {
    class: 'nds-command-shortcut',
    rdxAutocompleteItemIndicator: '',
    '[attr.data-slot]': '"command-shortcut"',
  },
})
export class NdsCommandShortcut {}

// ─── NdsCommandSeparator ──────────────────────────────────────────────────────

/**
 * Divisor entre grupos — decorativo.
 *
 * `aria-hidden` de propósito: uma linha de 1px dentro de `role="listbox"` não é
 * filho permitido pela ARIA (só `option` e `group` são), e o que separa os
 * blocos para quem não vê a tela é o rótulo de cada grupo, não o traço.
 *
 * Some quando o filtro esvazia um dos lados (`hidden`, que vale sem ajuda:
 * `.nds-command-separator` não declara `display`). Sem isso, buscar algo que só
 * existe num grupo deixaria o traço solto em cima ou embaixo dele.
 */
@Directive({
  selector: 'div[ndsCommandSeparator]',
  standalone: true,
  host: {
    class: 'nds-command-separator',
    'aria-hidden': 'true',
    '[attr.data-slot]': '"command-separator"',
    '[attr.hidden]': 'visible() ? null : ""',
  },
})
export class NdsCommandSeparator {
  private readonly command = inject(NdsCommand);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly visible = computed(() => this.command.isSeparatorVisible(this.host));
}

// ─── Conveniência ─────────────────────────────────────────────────────────────

/** A família inteira — para o `imports` de quem compõe. */
export const NDS_COMMAND = [
  NdsCommand,
  NdsCommandInput,
  NdsCommandList,
  NdsCommandEmpty,
  NdsCommandGroup,
  NdsCommandItem,
  NdsCommandShortcut,
  NdsCommandSeparator,
] as const;
