import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  applyTrigger,
  findTrigger,
  rankByTerm,
  type TriggerApplied,
  type TriggerMatch,
  type TriggerSpec,
} from '@shared/primitives/composer-trigger';

// ─── ComposerTriggerPopover ──────────────────────────────────────────────────
//
// O seletor que abre quando alguém digita um caractere gatilho no composer.
//
// Desenho em `nds/composer.css`, no bloco do seletor do gatilho. A MÁQUINA —
// onde o gatilho vale, o que ele recorta, como o filtro ordena e o que fica
// escrito depois da escolha — vive em `@shared/primitives/composer-trigger`, e
// é compartilhada pelas cinco stacks. Este componente é o DOM em volta dela.
//
// A DECISÃO QUE ATRAVESSA O COMPOSER INTEIRO: com o seletor aberto, a tecla de
// envio ESCOLHE em vez de enviar. As duas coisas disputam a mesma tecla, e
// enviar no meio de uma menção é o defeito que quem escreve encontra na
// primeira vez que usa. Quem resolve a disputa é o composer, perguntando ao
// seletor se ele está aberto antes de decidir o que a tecla faz.
//
// O FOCO NUNCA SAI DO CAMPO. Quem escreve continua escrevendo enquanto escolhe;
// mover o foco para a lista faria a próxima letra não chegar ao texto. O campo
// aponta a opção ativa por `aria-activedescendant`, e a lista nunca é focada.
//
// E O CAMPO NÃO VIRA `combobox`, ainda que o padrão tenha esse nome.
//
// A primeira versão punha esse papel no campo de várias linhas, que é o que a
// literatura descreve — e o axe reprovou por `aria-allowed-role`: a
// especificação de ARIA em HTML não admite esse papel neste elemento, que já é
// uma caixa de texto. Trocar o papel também custaria a semântica de multilinha,
// que é o que o campo de fato é.
//
// O que fica é o que a caixa de texto ADMITE e resolve o problema:
// `aria-controls` liga o campo à lista, e `aria-activedescendant` aponta a
// opção sem mover o foco. O atributo de expansão saiu junto com o papel — ele
// não é permitido numa caixa de texto, e sem o papel não teria o que descrever.
//
// A DIVERGÊNCIA DE API QUE SE REGISTRA, em vez de se "alinhar": no Vanilla o
// seletor é um controlador devolvido por uma função de fábrica, e o campo chega
// nas opções de criação. Aqui ele é um componente, o campo chega por entrada, e
// a escolha aplicada sai por `output` — o composer é quem escreve no campo,
// porque é ele que possui o texto. Chamar `sync`, `move` e `applyActive` na
// instância obtida por `viewChild` é o equivalente desta stack ao controlador:
// são as mesmas cinco operações, com os mesmos nomes.

/** Uma opção do seletor. */
export interface TriggerOption {
  /** Endereço da opção. Vira o `id` do elemento, que o campo aponta. */
  id: string;
  /** O que se lê na lista, e o que o filtro compara. */
  label: string;
  /** Informação de apoio à direita — time, atalho, descrição curta. */
  hint?: string;
  /**
   * O que fica escrito ao escolher. Sem ele, o caractere gatilho mais o rótulo.
   *
   * Existe porque o que se escreve nem sempre é o que se lê: um comando mostra
   * "Resumir a conversa" e escreve `/resumir`.
   */
  value?: string;
}

/** Um gatilho e as opções que ele oferece. */
export interface TriggerSource {
  spec: TriggerSpec;
  options: TriggerOption[];
}

export interface TriggerPopoverLabels {
  /**
   * O que aparece quando o filtro não deixa nada.
   *
   * Texto, e não lista vazia: lista vazia é silêncio para quem não vê a tela, e
   * silêncio parece que a busca não respondeu.
   */
  empty: string;
  /** Nome acessível da lista. */
  list: string;
}

/** Endereço do painel. Um por instância, para o campo apontar o certo. */
let instances = 0;

@Component({
  selector: 'nds-composer-trigger-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-composer-trigger-popover',
    '[attr.data-slot]': '"composer-trigger-popover"',
    '[id]': 'id',
    '[hidden]': '!isOpen()',
    // SEM OPÇÕES, O PAINEL NÃO É UMA LISTA.
    //
    // Uma lista de opções vazia reprova em `aria-required-children`, e com
    // razão: ela promete filhos que não existem, e o leitor de tela anuncia
    // "lista com zero itens" em vez da frase que explica o que houve. Sem o
    // papel, o que resta é o texto — que é justamente o que se quer ler.
    '[attr.role]': 'listRole()',
    '[attr.aria-label]': 'listRole() ? labels().list : null',
  },
  template: `
    @if (isOpen()) {
      @if (visible().length) {
        @for (option of visible(); track option.id; let i = $index) {
          <!-- \`aria-selected\` e a cor de fundo saem juntos: um é o que o
               leitor de tela anuncia, o outro é o que os olhos veem. Só um
               deixaria metade das pessoas sem saber onde está. -->
          <div
            class="nds-composer-trigger-option"
            role="option"
            [id]="optionId(option)"
            [attr.aria-selected]="i === activeIndex()"
            (mousedown)="pick($event, i)"
          >
            <span class="nds-composer-trigger-option-label">{{ option.label }}</span>
            @if (option.hint) {
              <span class="nds-composer-trigger-option-hint">{{ option.hint }}</span>
            }
          </div>
        }
      } @else {
        <p class="nds-composer-trigger-empty">{{ labels().empty }}</p>
      }
    }
  `,
})
export class NdsComposerTriggerPopover {
  /** O campo que o seletor observa. É dele que saem o texto e a posição. */
  readonly field = input.required<HTMLTextAreaElement>();
  /** Os gatilhos e as opções de cada um. */
  readonly sources = input.required<TriggerSource[]>();
  /** O texto do painel. Sem padrão em inglês escondido. */
  readonly labels = input.required<TriggerPopoverLabels>();

  /**
   * Uma escolha foi aplicada: o texto resultante e onde o cursor vai.
   *
   * O componente NÃO escreve no campo. Quem possui o texto é o composer, e um
   * segundo dono escrevendo por fora desfaria a próxima detecção de mudanças.
   */
  readonly applied = output<TriggerApplied>();

  /** Endereço do painel, que o campo aponta por `aria-controls`. */
  readonly id = `nds-composer-trigger-${++instances}`;

  private readonly match = signal<TriggerMatch | null>(null);

  /** As opções que sobreviveram ao filtro, na ordem em que se leem. */
  readonly visible = signal<TriggerOption[]>([]);

  /** Qual opção está apontada. O foco não se move; o que muda é isto. */
  readonly activeIndex = signal(0);

  /** Está aberto? É o que decide de quem é a tecla de envio. */
  readonly isOpen = computed(() => this.match() !== null);

  protected readonly listRole = computed(() =>
    this.isOpen() && this.visible().length ? 'listbox' : null,
  );

  /**
   * O endereço da opção ativa, ou nada.
   *
   * Fechado — ou aberto sem nenhuma opção — devolve `null`, e o campo deixa de
   * apontar: um `aria-activedescendant` órfão aponta um elemento que já não
   * existe.
   */
  readonly activeOptionId = computed(() => {
    if (!this.isOpen()) return null;
    const active = this.visible()[this.activeIndex()];
    return active ? this.optionId(active) : null;
  });

  protected optionId(option: TriggerOption): string {
    return `${this.id}-${option.id}`;
  }

  /** Relê o campo e decide se o seletor abre, filtra ou fecha. */
  sync(): void {
    const field = this.field();
    const sources = this.sources();
    const found = findTrigger(
      field.value,
      field.selectionStart ?? 0,
      sources.map((s) => s.spec),
    );
    if (!found) {
      this.close();
      return;
    }
    const source = sources.find((s) => s.spec.char === found.spec.char);
    if (!source) {
      this.close();
      return;
    }

    // O termo mudou: a opção ativa volta ao topo. Manter o índice faria a
    // escolha pular para outra pessoa a cada letra digitada.
    const previousTerm = this.match()?.term;
    const ranked = rankByTerm(source.options, found.term, (o) => o.label);
    this.match.set(found);
    this.visible.set(ranked);
    if (previousTerm !== found.term) this.activeIndex.set(0);
    if (this.activeIndex() >= ranked.length) this.activeIndex.set(0);
  }

  /** Anda pela lista. O foco não se move; o que muda é a opção apontada. */
  move(delta: number): void {
    const total = this.visible().length;
    if (!this.isOpen() || !total) return;
    // Circular: quem está no fim e desce volta ao começo. Uma lista que para
    // na última obriga a subir de volta contando.
    this.activeIndex.set((this.activeIndex() + delta + total) % total);
  }

  /**
   * Anuncia a opção ativa escrita no campo.
   *
   * Devolve `false` se não havia o que aplicar — e é esse `false` que devolve a
   * tecla de envio ao composer.
   */
  applyActive(): boolean {
    const match = this.match();
    if (!match || !this.visible().length) return false;
    const option = this.visible()[this.activeIndex()];
    if (!option) return false;

    const field = this.field();
    const replacement = option.value ?? `${match.spec.char}${option.label}`;
    const result = applyTrigger(
      field.value,
      match,
      field.selectionStart ?? 0,
      replacement,
    );

    this.close();
    this.applied.emit(result);
    return true;
  }

  /** Fecha sem escolher. */
  close(): void {
    this.match.set(null);
    this.visible.set([]);
    this.activeIndex.set(0);
  }

  /**
   * A escolha por ponteiro acontece ao APERTAR o botão.
   *
   * `mousedown`, e não `click`: o clique tira o foco do campo antes de disparar,
   * e a escolha passaria a acontecer com o cursor já perdido.
   */
  protected pick(event: MouseEvent, index: number): void {
    event.preventDefault();
    this.activeIndex.set(index);
    this.applyActive();
  }
}
