import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

// ─── InputOTP ─────────────────────────────────────────────────────────────────
//
// Campo de código de verificação (OTP/PIN). Um `<input>` real por dígito, como
// no Vanilla — que é a referência cross-stack de markup e de classes `.nds-*`.
//
// Por que NÃO há primitivo do @radix-ng/primitives aqui: o pacote 1.1.x não
// publica `pin-input` nem `otp` (os subpacotes são accordion, alert-dialog,
// arrow, aspect-ratio, avatar, calendar, checkbox, collapsible, composite,
// context-menu, cropper, date-field, dialog, dismissable-layer, editable,
// focus-scope, label, menu, menubar, meter, navigation-menu, number-field,
// pagination, popover, popper, portal, preview-card, progress, radio,
// select, separator, slider, stepper, switch, time-field, toggle,
// toggle-group, toolbar, tooltip, types, visually-hidden). O `composite`
// existe, mas resolve roving tabindex de toolbar — um por vez na sequência de
// foco —, e aqui CADA slot precisa continuar alcançável por seta e por clique.
// Compor com ele trocaria o comportamento esperado por um que atrapalha.
//
// Decisões de acessibilidade que o conteúdo compartilhado exige:
//   · o conjunto tem UM nome (role="group" + aria-label no host), e cada slot
//     tem o seu ("Dígito 3"), para o leitor situar quem digita;
//   · `autocomplete="one-time-code"` vai SÓ no primeiro slot — é ele que o
//     iOS/Android preenchem, e repetir o atributo nos seis faz o navegador
//     oferecer o mesmo código seis vezes;
//   · colar distribui os caracteres a partir do slot focado;
//   · Backspace num slot vazio volta ao anterior e o esvazia.

/** Conjunto de caracteres aceitos. Decide também o teclado do dispositivo. */
export type InputOtpMode = 'numeric' | 'alphanumeric';

interface CellOtp {
  /** Chave estável para o `track` do @for — separador e slot nunca colidem. */
  key: string;
  separator: boolean;
  /** Índice do slot no código; -1 num separador. */
  index: number;
  caractere: string;
}

@Component({
  selector: 'nds-input-otp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-input-otp',
    role: 'group',
    '[attr.data-slot]': '"input-otp"',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    @for (celula of celulas(); track celula.key) {
      @if (celula.separator) {
        <!-- role="separator" e não aria-hidden: o conteúdo compartilhado cobra
             o papel (testes.accessibility.item4) porque é ele que informa ao
             leitor que o código vem em dois blocos — 3+3 dito de uma vez é
             mais difícil de conferir do que "três, separador, três". -->
        <div
          class="nds-input-otp-separator"
          data-slot="input-otp-separator"
          role="separator"
        >{{ separatorChar() }}</div>
      } @else {
        <input
          class="nds-input-otp-slot"
          data-slot="input-otp-slot"
          type="text"
          maxlength="1"
          [value]="celula.caractere"
          [disabled]="disabled()"
          [attr.inputmode]="inputMode()"
          [attr.autocomplete]="celula.index === 0 ? autocomplete() : 'off'"
          [attr.aria-label]="rotuloDoDigito(celula.index)"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [attr.aria-describedby]="describedBy() || null"
          (focus)="aoFocar($event)"
          (input)="aoDigitar(celula.index, $event)"
          (keydown)="onKeyDown(celula.index, $event)"
          (paste)="aoColar(celula.index, $event)"
        />
      }
    }
  `,
})
export class NdsInputOtp implements AfterViewInit {
  /** Quantidade de caracteres do código. */
  readonly maxLength = input<number>(6);

  /** Valor do código, de mão dupla: `[(value)]="codigo"`. */
  readonly value = model<string>('');

  /** Conjunto aceito; `alphanumeric` também troca o teclado para texto. */
  readonly mode = input<InputOtpMode>('numeric');

  readonly disabled = input<boolean>(false);

  /** Marca todos os slots com `aria-invalid` — pinta a borda de erro. */
  readonly invalid = input<boolean>(false);

  /** Id do texto de ajuda ou de erro, aplicado a cada slot. */
  readonly describedBy = input<string>('');

  /** Foca o primeiro slot ao montar. */
  readonly autoFocus = input<boolean>(false);

  /**
   * Vai no PRIMEIRO slot; os demais recebem `off`. `one-time-code` é o que
   * aciona o autofill de SMS no iOS e no Android. Troque para `off` quando o
   * código não chega por mensagem — num app autenticador (TOTP) o navegador
   * não tem o que oferecer, e a sugestão vazia atrapalha.
   */
  readonly autocomplete = input<string>('one-time-code');

  /**
   * Índices ANTES dos quais entra um separador — `[3]` num código de 6 dá o
   * formato 3+3. Mesma semântica do Vanilla, para o markup sair igual.
   */
  readonly separatorAt = input<number[]>([]);

  /** Texto do separador. Travessão por padrão, como no Vanilla. */
  readonly separatorChar = input<string>('—');

  /** Nome acessível do CONJUNTO. Um `aria-labelledby` no host tem precedência. */
  readonly ariaLabel = input<string>('Código de verificação');

  /** Prefixo do nome de cada slot: "Dígito 1", "Dígito 2"… */
  readonly digitLabel = input<string>('Dígito');

  /** Dispara quando todos os slots estão preenchidos. */
  readonly complete = output<string>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Estado interno por posição. É ele — e não o `value` concatenado — a fonte
   * da verdade: com o valor concatenado, um slot vazio no meio deslocaria
   * todos os seguintes na volta, e o código digitado mudaria sozinho.
   */
  private readonly chars = signal<string[]>([]);

  protected readonly inputMode = computed(() =>
    this.mode() === 'alphanumeric' ? 'text' : 'numeric',
  );

  private readonly aceito = computed(() =>
    this.mode() === 'alphanumeric' ? /^[a-zA-Z0-9]$/ : /^[0-9]$/,
  );

  protected readonly celulas = computed<CellOtp[]>(() => {
    const total = this.maxLength();
    const antes = new Set(this.separatorAt());
    const atuais = this.chars();
    const out: CellOtp[] = [];
    for (let i = 0; i < total; i++) {
      if (antes.has(i)) {
        out.push({ key: `sep-${i}`, separator: true, index: -1, caractere: '' });
      }
      out.push({ key: `slot-${i}`, separator: false, index: i, caractere: atuais[i] ?? '' });
    }
    return out;
  });

  constructor() {
    // Valor vindo de fora → posições. `untracked` no estado interno: sem ele o
    // efeito reagiria à própria escrita e voltaria numa segunda passada só para
    // confirmar o que acabou de gravar.
    effect(() => {
      const externo = this.value();
      const total = this.maxLength();
      if (untracked(() => this.chars().join('')) === externo && untracked(() => this.chars().length) === total) {
        return;
      }
      this.chars.set(Array.from({ length: total }, (_, i) => externo[i] ?? ''));
    });
  }

  ngAfterViewInit(): void {
    // `input()` no construtor devolveria o default, não o binding de quem usa.
    if (this.autoFocus()) this.focar(0);
  }

  protected rotuloDoDigito(index: number): string {
    return `${this.digitLabel()} ${index + 1}`;
  }

  // ─── Interação ─────────────────────────────────────────────────────────────

  protected aoFocar(evento: Event): void {
    // Selecionar o conteúdo faz a digitação SUBSTITUIR o dígito existente em
    // vez de ser recusada pelo maxlength — é o que deixa corrigir um slot já
    // preenchido sem apagar antes.
    (evento.target as HTMLInputElement).select();
  }

  protected aoDigitar(index: number, evento: Event): void {
    const el = evento.target as HTMLInputElement;
    const aceitos = [...el.value].filter((c) => this.aceito().test(c));
    const caractere = aceitos.at(-1) ?? '';

    // Normaliza o DOM na mão: quando o caractere digitado é igual ao que já
    // estava, o modelo não muda e o binding `[value]` não reescreve nada — o
    // campo ficaria com os dois caracteres que o navegador aceitou.
    el.value = caractere;

    const proximas = [...this.chars()];
    proximas[index] = caractere;
    this.aplicar(proximas);

    if (caractere) this.focar(index + 1);
  }

  protected onKeyDown(index: number, evento: KeyboardEvent): void {
    const proximas = [...this.chars()];

    switch (evento.key) {
      case 'Backspace': {
        evento.preventDefault();
        // Apagar e voltar num toque só. Ficar parado no slot recém-esvaziado
        // obriga a pressionar Backspace duas vezes por dígito para corrigir um
        // código inteiro — e é sempre o código inteiro que se corrige.
        if (proximas[index]) {
          proximas[index] = '';
        } else if (index > 0) {
          proximas[index - 1] = '';
        }
        this.aplicar(proximas);
        this.focar(index - 1);
        break;
      }
      case 'Delete': {
        evento.preventDefault();
        proximas[index] = '';
        this.aplicar(proximas);
        break;
      }
      case 'ArrowLeft': {
        evento.preventDefault();
        this.focar(index - 1);
        break;
      }
      case 'ArrowRight': {
        evento.preventDefault();
        this.focar(index + 1);
        break;
      }
      case 'Home': {
        evento.preventDefault();
        this.focar(0);
        break;
      }
      case 'End': {
        evento.preventDefault();
        this.focar(this.maxLength() - 1);
        break;
      }
      default:
        break;
    }
  }

  protected aoColar(index: number, evento: ClipboardEvent): void {
    evento.preventDefault();
    const text = evento.clipboardData?.getData('text') ?? '';
    const aceitos = [...text].filter((c) => this.aceito().test(c));
    if (aceitos.length === 0) return;

    const total = this.maxLength();
    const proximas = [...this.chars()];
    for (let k = 0; k < aceitos.length && index + k < total; k++) {
      proximas[index + k] = aceitos[k];
    }
    this.aplicar(proximas);

    const emptyFirst = proximas.findIndex((c) => !c);
    this.focar(emptyFirst === -1 ? total - 1 : emptyFirst);
  }

  // ─── Estado ────────────────────────────────────────────────────────────────

  private aplicar(proximas: string[]): void {
    this.chars.set(proximas);
    this.value.set(proximas.join(''));
    this.escreverNoDom(proximas);

    if (proximas.length === this.maxLength() && proximas.every((c) => c !== '')) {
      this.complete.emit(proximas.join(''));
    }
  }

  /**
   * O binding `[value]` só chega na próxima detecção de mudanças. Quem lê o
   * campo logo depois da interação — teste, leitor de tela, o próprio
   * `aoDigitar` do slot seguinte — veria o valor anterior.
   */
  private escreverNoDom(proximas: string[]): void {
    const slots = this.slots();
    proximas.forEach((c, k) => {
      const el = slots[k];
      if (el && el.value !== c) el.value = c;
    });
  }

  private slots(): HTMLInputElement[] {
    return [
      ...this.hostRef.nativeElement.querySelectorAll<HTMLInputElement>('input.nds-input-otp-slot'),
    ];
  }

  private focar(index: number): void {
    const slots = this.slots();
    const target = slots[Math.min(Math.max(index, 0), slots.length - 1)];
    target?.focus();
    target?.select();
  }
}
