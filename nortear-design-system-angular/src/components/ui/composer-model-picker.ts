import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isModelSelectable, type ModelOption } from '@shared/primitives/chat-protocol';
import { NdsBadge } from './badge';
import { NdsButton } from './button';

// ─── ComposerModelPicker ─────────────────────────────────────────────────────
//
// O controle do trilho que diz QUEM responde.
//
// Desenho em `nds/composer.css`, no bloco do seletor de modelo, que também
// guarda as quatro decisões de acessibilidade. O vocabulário — `ModelOption`,
// `isModelSelectable` — vem de `@shared/primitives/chat-protocol`.
//
// A PEÇA É AUTÔNOMA. Ela não mora dentro do composer: quem consome a monta e a
// põe no início do trilho, pelo mesmo espaço que qualquer outro controle usa.
// É o que permite ter o seletor sem ter o campo — numa barra de ferramentas,
// numa página de ajustes — e é o que impede o composer de crescer uma prop por
// controle que alguém invente.
//
// O GATILHO LEVA SÓ O NOME, A LISTA LEVA A DESCRIÇÃO. Um trilho é estreito e o
// nome é o que se confere de relance; a descrição é o que se lê na hora de
// trocar. Pôr as duas no gatilho encolhe o campo, que é o que importa ali.
//
// O FOCO ENTRA NA LISTA, ao contrário do seletor do caractere gatilho. Lá o
// foco não pode sair do campo, porque quem escolhe continua escrevendo; aqui
// não há texto em curso — a escolha é o único assunto enquanto a lista está
// aberta, e a lista é o lugar certo para o teclado estar. O cursor anda por
// `aria-activedescendant`, e fechar devolve o foco ao gatilho.
//
// O QUE O COMPONENTE NÃO FAZ: trocar de modelo. Ele avisa qual foi confirmado
// e devolve o controle — quem sabe o que a troca custa, quem tem direito a
// qual e o que acontece depois é quem monta a conversa. Mesma divisão de
// `approval` no `chat-thread`.
//
// A RAIZ É UM ELEMENTO PRÓPRIO, e por isso o seletor é de elemento. A raiz da
// peça é um `div` comum posicionado — nada se ancora nela por fora —, então o
// host JÁ é essa raiz e nenhuma caixa a mais aparece entre o trilho e o
// gatilho. É a escolha oposta à do `ul[ndsComposerContext]`, cuja raiz é a
// própria lista e não admitiria um elemento entre ela e os itens.
//
// A DIVERGÊNCIA DE API que se REGISTRA em vez de se "alinhar": os retornos são
// `output()`, e não callbacks passados como propriedade. É o caminho desta
// stack, e é o mesmo que `removeContext` e `dismissQuote` já usam.

/** O texto da interface. Sem padrão em inglês escondido. */
export interface ComposerModelPickerLabels {
  /** Nome acessível do gatilho. `{label}` vira o nome do modelo escolhido. */
  trigger: string;
  /** Nome acessível da lista. */
  list: string;
}

/** O primeiro que pode responder, ou o primeiro da lista se nenhum puder. */
function firstSelectable(models: ModelOption[]): number {
  const found = models.findIndex(isModelSelectable);
  return found === -1 ? 0 : found;
}

/** Endereço do painel. Um por instância, para o gatilho apontar o certo. */
let instances = 0;

@Component({
  selector: 'nds-composer-model-picker',
  standalone: true,
  imports: [NdsBadge, NdsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-composer-model',
    '[attr.data-slot]': '"composer-model"',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
  },
  template: `
    <!-- O gatilho só aponta a lista enquanto ela existe: apontar um endereço
         vazio é prometer um elemento que não está no documento. -->
    <button
      #trigger
      ndsButton
      type="button"
      variant="ghost"
      size="sm"
      data-slot="composer-model-trigger"
      aria-haspopup="listbox"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-controls]="isOpen() ? panelId : null"
      [attr.aria-label]="triggerLabel()"
      (click)="toggle()"
      (keydown)="onTriggerKeydown($event)"
    >{{ triggerName() }}</button>

    <!-- A lista SÓ EXISTE quando está aberta. Não é uma lista escondida: uma
         lista presente e invisível continuaria sendo lida, e prometeria uma
         escolha que não está à mão. -->
    @if (isOpen()) {
      <div
        #panel
        class="nds-composer-model-panel"
        data-slot="composer-model-panel"
        role="listbox"
        tabindex="-1"
        [id]="panelId"
        [attr.aria-label]="labels().list"
        [attr.aria-activedescendant]="activeDescendant()"
        (keydown)="onPanelKeydown($event)"
      >
        @for (row of rows(); track row.id; let i = $index) {
          <!-- \`aria-selected\` e o realce saem juntos: um é o que o leitor de
               tela anuncia, o outro é o que os olhos veem. -->
          <div
            class="nds-composer-model-option"
            data-slot="composer-model-option"
            role="option"
            [id]="row.id"
            [attr.data-model-id]="row.model.id"
            [attr.aria-selected]="i === selectedIndex()"
            [attr.aria-disabled]="row.selectable ? null : 'true'"
            [attr.data-active]="i === activeIndex() ? 'true' : null"
            (click)="choose(i)"
          >
            <span class="nds-composer-model-name">{{ row.model.label }}</span>

            <!-- Decisão 3 da folha: a etiqueta é REFORÇO. O desenho vem do
                 badge do sistema; o lugar na grade vem da classe da folha. -->
            @if (row.model.badge) {
              <span ndsBadge class="nds-composer-model-badge">{{ row.model.badge }}</span>
            }

            @if (row.model.description) {
              <span class="nds-composer-model-description">{{ row.model.description }}</span>
            }

            <!-- O motivo em TEXTO, dentro da opção — é o que o cursor anuncia
                 ao passar por ela. Opção apagada sem explicação é a pergunta
                 "por que não posso?" sem resposta na tela. -->
            @if (row.reason) {
              <span
                class="nds-composer-model-description"
                data-slot="composer-model-reason"
              >{{ row.reason }}</span>
            }
          </div>
        }
      </div>
    }
  `,
})
export class NdsComposerModelPicker {
  /** Os modelos que podem responder, na ordem em que aparecem na lista. */
  readonly models = input.required<ModelOption[]>();
  /** O texto da interface. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ComposerModelPickerLabels>();
  /**
   * O modelo escolhido, pelo endereço dele.
   *
   * Sem ele, o primeiro que PODE responder: abrir com um indisponível no
   * gatilho prometeria uma resposta que não vem.
   */
  readonly value = input<string | undefined>(undefined);
  /**
   * A lista começa aberta.
   *
   * É SEMENTE, e não controle: quem abre e fecha depois é o próprio seletor,
   * porque abrir e fechar é desenho e não estado do mundo (guideline 17, §2).
   * `openChange` existe para quem precisa acompanhar.
   */
  readonly open = input<boolean>(false);

  /** Alguém confirmou um modelo. Aplicar a troca é de quem monta a conversa. */
  readonly valueChange = output<ModelOption>();
  /** A lista abriu ou fechou. */
  readonly openChange = output<boolean>();

  /** Endereço do painel, que o gatilho aponta por `aria-controls`. */
  protected readonly panelId = `nds-composer-model-${++instances}-panel`;

  protected readonly isOpen = signal(false);
  protected readonly selectedIndex = signal(0);
  protected readonly activeIndex = signal(0);

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  // `read: ElementRef` é obrigatório: numa tag com componente — e o gatilho é um
  // `NdsButton` —, o `#ref` do template resolve para a INSTÂNCIA do componente,
  // não para o elemento. Sem ele `nativeElement` não existiria, e nem o
  // compilador de template acusaria: o tipo do sinal é declarado, não inferido.
  private readonly triggerRef = viewChild.required('trigger', {
    read: ElementRef<HTMLButtonElement>,
  });
  private readonly panelRef = viewChild('panel', { read: ElementRef<HTMLDivElement> });

  /**
   * A abertura que ainda deve levar o foco junto.
   *
   * Campo comum, e não sinal: ele é um recado de uma abertura para a renderização
   * seguinte, e lê-lo dentro de um efeito não pode reagendá-lo.
   */
  private moveFocusOnOpen = false;

  /**
   * Cada opção já resolvida: o endereço, quem pode ser escolhido e o motivo.
   *
   * Resolver aqui, e não em chamada de método no template, é o que impede a
   * pergunta ao protocolo de rodar a cada detecção de mudanças.
   */
  protected readonly rows = computed(() =>
    this.models().map((model, index) => ({
      id: `${this.panelId}-option-${index}`,
      model,
      // A decisão de quem pode ser escolhido sai do vocabulário compartilhado,
      // e não de um `if (model.unavailable)` escrito aqui: cinco stacks
      // escreveriam cinco versões da mesma regra, e uma delas discordaria.
      selectable: isModelSelectable(model),
      reason:
        model.unavailable && model.unavailableReason ? model.unavailableReason : null,
    })),
  );

  /** O nome do modelo escolhido — e só ele, porque o trilho é estreito. */
  protected readonly triggerName = computed(
    () => this.models()[this.selectedIndex()]?.label ?? '',
  );

  /**
   * O nome acessível do gatilho.
   *
   * Decisão 1 da folha: ele diz O QUE o gatilho escolhe, e não só o valor
   * escolhido — "Rápido, botão" não informa nada.
   */
  protected readonly triggerLabel = computed(() =>
    this.labels().trigger.replace('{label}', this.triggerName()),
  );

  /**
   * O endereço da opção sob o cursor, ou nada.
   *
   * Lista vazia devolve `null`: um `aria-activedescendant` órfão aponta um
   * elemento que não está no documento.
   */
  protected readonly activeDescendant = computed(
    () => this.rows()[this.activeIndex()]?.id ?? null,
  );

  private readonly onDocumentPointerDown = (event: Event): void => {
    // O que acontece DENTRO do seletor é dele — inclusive no gatilho, que
    // fecha pelo próprio clique logo depois.
    if (this.hostRef.nativeElement.contains(event.target as Node)) return;
    this.setOpen(false, false);
  };

  constructor() {
    // O escolhido acompanha a entrada: sozinha ela é semente, e acompanhada do
    // aviso de troca é quem consome que manda. `untracked` porque o que se lê
    // aqui dentro é estado próprio — reagendar por causa dele seria laço.
    effect(() => {
      const id = this.value();
      const models = this.models();
      untracked(() => {
        const found = id === undefined ? -1 : models.findIndex((m) => m.id === id);
        this.selectedIndex.set(found === -1 ? firstSelectable(models) : found);
      });
    });

    // A semente da abertura. Abrir de saída NÃO move o foco: roubar o foco ao
    // montar a página é exatamente o que a story fotografaria.
    effect(() => {
      const seed = this.open();
      untracked(() => this.setOpen(seed, false, false));
    });

    // O foco entra na lista assim que ela chega ao documento — antes disso não
    // há o que focar, e o painel só existe enquanto está aberto.
    effect(() => {
      const panel = this.panelRef();
      if (!panel) return;
      if (!this.moveFocusOnOpen) return;
      this.moveFocusOnOpen = false;
      panel.nativeElement.focus();
    });

    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    });
  }

  protected toggle(): void {
    const next = !this.isOpen();
    this.setOpen(next, next);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    // A seta abre já com a lista sob o cursor — é o atalho de quem troca de
    // modelo sem tirar as mãos do teclado.
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (this.isOpen()) return;
    event.preventDefault();
    this.setOpen(true, true);
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        return;
      case 'Home':
        event.preventDefault();
        this.setActive(0);
        return;
      case 'End':
        event.preventDefault();
        this.setActive(this.models().length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.choose(this.activeIndex());
        return;
      case 'Escape':
      case 'Tab':
        // Tab fecha como Escape: a lista não é uma parada da ordem de foco, e
        // deixar o foco sair dela com o painel aberto deixaria um painel sem
        // dono na tela.
        event.preventDefault();
        this.setOpen(false, true);
        return;
      default:
        return;
    }
  }

  protected choose(index: number): void {
    const model = this.models()[index];
    if (!model) return;
    if (!isModelSelectable(model)) {
      // Nada muda, e a lista CONTINUA ABERTA. Fechar sem trocar pareceria uma
      // troca que não aconteceu, e o motivo — que está na própria opção —
      // sairia da tela junto.
      this.setActive(index);
      return;
    }
    this.selectedIndex.set(index);
    this.setOpen(false, true);
    this.valueChange.emit(model);
  }

  private move(delta: number): void {
    const total = this.models().length;
    if (total === 0) return;
    // Anda por TODAS as opções, inclusive as que não podem ser escolhidas.
    // Pular a indisponível esconderia o motivo justamente de quem navega por
    // teclado — que é quem mais depende de ele estar na leitura.
    this.setActive((this.activeIndex() + delta + total) % total);
  }

  private setActive(index: number): void {
    if (index < 0 || index >= this.models().length) return;
    this.activeIndex.set(index);
  }

  private setOpen(next: boolean, moveFocus: boolean, notify = true): void {
    if (next === this.isOpen()) return;
    this.isOpen.set(next);

    if (next) {
      // O cursor começa no que já estava escolhido: é de lá que quem troca
      // parte, e começar no topo faria a lista perder o lugar a cada abertura.
      this.activeIndex.set(this.selectedIndex());
      this.moveFocusOnOpen = moveFocus;
      document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    } else {
      this.moveFocusOnOpen = false;
      document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
      // Sem isto o foco cairia no começo da página quando a lista some, e
      // quem navega por teclado perderia o lugar.
      if (moveFocus) this.triggerRef().nativeElement.focus();
    }

    if (notify) this.openChange.emit(next);
  }
}
