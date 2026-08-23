import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';

// ─── Resizable ────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-resizable / .nds-resizable-panel / .nds-resizable-handle
// / .nds-resizable-grip (docs/shared/styles/nds/resizable.css). É o mesmo DOM
// que o Vanilla monta — `<div class="nds-resizable" data-direction="…">` com
// painéis e punhos como filhos diretos —, e o CSS depende dessa vizinhança
// direta (`.nds-resizable[data-direction="horizontal"] > .nds-resizable-handle`).
//
// SEM primitivo do @radix-ng/primitives: o pacote não publica nada de painel
// redimensionável (conferido em node_modules/@radix-ng/primitives — accordion,
// slider, toolbar, separator… e nada de resizable/split). O `separator` do
// Radix NG é o divisor ESTÁTICO, sem arrasto e sem valor; usá-lo aqui daria o
// papel ARIA e nenhuma das duas coisas que este componente existe para
// resolver. `angular-split`, que o snippet compartilhado anuncia, não está nas
// dependências desta stack — registrado no relatório como divergência de
// conteúdo. Daí a implementação à mão.
//
// A RAZÃO DE SER DO COMPONENTE É O TECLADO. Um divisor que só responde ao
// ponteiro é inoperável para quem navega por teclado (WCAG 2.1.1) e transforma
// o ajuste num gesto de arrasto sem alternativa (WCAG 2.5.7). Por isso o punho
// é `role="separator"` focável, com `aria-valuenow/min/max` vivos, e as setas,
// Home, End e Enter fazem exatamente o que o arrasto faz.

export type ResizableDirection = 'horizontal' | 'vertical';

/** Passo de cada seta, em pontos percentuais. Mesmo valor do Vanilla. */
const STEP_KEYBOARD = 2;

/** Ordem de documento — a de registro depende da ordem de construção das views. */
function documentOrdenar<T extends { readonly el: HTMLElement }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  );
}

function limitar(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Estado compartilhado por um grupo de painéis.
 *
 * Fornecido pelo `NdsResizable`, nunca em `root`: a docs page mostra vários
 * grupos na mesma tela — e um grupo aninhado é outro grupo. Como o provider
 * mora no elemento, o painel aninhado injeta o store MAIS PRÓXIMO e não
 * atropela o de fora.
 */
@Injectable()
export class NdsResizableStore {
  readonly direction = signal<ResizableDirection>('horizontal');
  readonly horizontal = computed(() => this.direction() === 'horizontal');

  /** Tamanhos em porcentagem, um por painel, na ordem do documento. */
  private readonly _sizes = signal<number[]>([]);
  readonly sizes = this._sizes.asReadonly();

  private panels: NdsResizablePanel[] = [];
  private punhos: NdsResizableHandle[] = [];
  private group: HTMLElement | undefined;
  /** Tamanhos no instante do pointerdown — o arrasto é sempre relativo a eles. */
  private base: number[] = [];

  /** O grupo assina para emitir o output e persistir o layout. */
  aoFinalizar: ((sizes: number[]) => void) | undefined;

  registrarGrupo(el: HTMLElement): void {
    this.group = el;
  }

  registrarPainel(p: NdsResizablePanel): void {
    this.panels.push(p);
  }

  registrarPunho(h: NdsResizableHandle): void {
    this.punhos.push(h);
  }

  /**
   * Índice lido a cada leitura, e não guardado no painel: guardado, ele
   * envelhece em silêncio no dia em que um painel nascer dentro de um `@if`.
   */
  private indiceDoPainel(p: NdsResizablePanel): number {
    return this.panels.indexOf(p);
  }

  private indiceDoPunho(h: NdsResizableHandle): number {
    return this.punhos.indexOf(h);
  }

  sizeOf(p: NdsResizablePanel): number | undefined {
    const i = this.indiceDoPainel(p);
    return i < 0 ? undefined : this._sizes()[i];
  }

  /** Painéis à esquerda e à direita de um punho — o punho i separa i de i+1. */
  private neighbours(h: NdsResizableHandle): [NdsResizablePanel, NdsResizablePanel] | undefined {
    const i = this.indiceDoPunho(h);
    if (i < 0 || i + 1 >= this.panels.length) return undefined;
    return [this.panels[i], this.panels[i + 1]];
  }

  /** Tamanho do painel ANTERIOR ao punho — é o que o `aria-valuenow` anuncia. */
  valorDe(h: NdsResizableHandle): number | undefined {
    const i = this.indiceDoPunho(h);
    const s = this._sizes();
    return i < 0 || i >= s.length ? undefined : s[i];
  }

  /** Mínimo alcançável pelo painel anterior: o próprio `minSize`. */
  minimumOf(h: NdsResizableHandle): number | undefined {
    return this.neighbours(h)?.[0].minSize();
  }

  /**
   * Máximo alcançável pelo painel anterior. Não é o `maxSize` dele: o vizinho
   * também tem um mínimo, e é o menor dos dois tetos que o arrasto respeita.
   */
  maximoDe(h: NdsResizableHandle): number | undefined {
    const v = this.neighbours(h);
    if (!v) return undefined;
    const [a, b] = v;
    const i = this.indiceDoPunho(h);
    const s = this._sizes();
    const sum = (s[i] ?? 0) + (s[i + 1] ?? 0);
    return Math.min(a.maxSize(), sum - b.minSize());
  }

  /**
   * Ordena e distribui o tamanho inicial.
   *
   * Chamado do `ngAfterContentInit` do grupo, que é onde os painéis já existem
   * e os inputs deles já foram aplicados — no construtor, `input()` ainda
   * devolveria o default declarado.
   */
  start(restaurado?: number[]): void {
    this.panels = documentOrdenar(this.panels);
    this.punhos = documentOrdenar(this.punhos);
    const n = this.panels.length;
    if (!n) return;

    const raw =
      restaurado && restaurado.length === n ? restaurado : this.distribuir();
    this._sizes.set(this.normalizar(raw));
  }

  /** `defaultSize` declarado manda; quem não declarou divide a sobra por igual. */
  private distribuir(): number[] {
    const declarados = this.panels.map((p) => p.defaultSize());
    const noDeclaration = declarados.filter((d) => d === undefined).length;
    const sumDeclarada = declarados.reduce<number>((acc, d) => acc + (d ?? 0), 0);
    const leftover = Math.max(0, 100 - sumDeclarada);
    const fatia = noDeclaration > 0 ? leftover / noDeclaration : 0;
    return declarados.map((d) => d ?? fatia);
  }

  /** Respeita min/max de cada painel e devolve uma soma de 100. */
  private normalizar(values: number[]): number[] {
    const limitados = values.map((s, i) =>
      limitar(s, this.panels[i].minSize(), this.panels[i].maxSize()),
    );
    const sum = limitados.reduce((a, b) => a + b, 0);
    return sum > 0 ? limitados.map((s) => (s / sum) * 100) : limitados;
  }

  // ─── Arrasto ──────────────────────────────────────────────────────────────

  iniciarArrasto(): void {
    this.base = [...this._sizes()];
  }

  /**
   * Converte o deslocamento do ponteiro em pontos percentuais.
   *
   * A conta parte SEMPRE do `base` do pointerdown, e não do tamanho corrente:
   * somar incrementos a cada pointermove acumularia o erro de arredondamento e
   * o divisor descolaria do cursor ao longo do arrasto.
   */
  arrastar(h: NdsResizableHandle, deslocamentoPx: number): void {
    const total = this.horizontal() ? this.group?.offsetWidth : this.group?.offsetHeight;
    if (!total) return;
    this.aplicar(h, (deslocamentoPx / total) * 100, this.base);
  }

  /** Ajuste por teclado — relativo ao tamanho corrente, um passo por tecla. */
  ajustar(h: NdsResizableHandle, deltaPct: number): void {
    this.aplicar(h, deltaPct, this._sizes());
  }

  /** Home / End / Enter: leva o painel anterior direto a um extremo. */
  levarPara(h: NdsResizableHandle, target: 'min' | 'max' | 'default'): void {
    const v = this.neighbours(h);
    if (!v) return;
    const [a] = v;
    const i = this.indiceDoPunho(h);
    const current = this._sizes()[i] ?? 0;
    const destination =
      target === 'min'
        ? (this.minimumOf(h) ?? current)
        : target === 'max'
          ? (this.maximoDe(h) ?? current)
          : (a.defaultSize() ?? current);
    this.aplicar(h, destination - current, this._sizes());
  }

  /**
   * Move o divisor: o que um painel ganha, o vizinho perde. Só os dois se
   * mexem — um grupo de cinco painéis não pode ter o arrasto de um punho
   * empurrando o layout inteiro.
   */
  private aplicar(h: NdsResizableHandle, deltaPct: number, base: number[]): void {
    const v = this.neighbours(h);
    if (!v) return;
    const [a, b] = v;
    const i = this.indiceDoPunho(h);
    const sum = (base[i] ?? 0) + (base[i + 1] ?? 0);

    const tetoA = Math.min(a.maxSize(), sum - b.minSize());
    const pisoA = Math.max(a.minSize(), sum - b.maxSize());
    if (pisoA > tetoA) return;

    const newA = limitar(base[i] + deltaPct, pisoA, tetoA);
    const atualizados = [...this._sizes()];
    atualizados[i] = newA;
    atualizados[i + 1] = sum - newA;
    this._sizes.set(atualizados);
  }

  /** Fim de interação: uma emissão por gesto, não uma por pixel. */
  finalizar(): void {
    this.aoFinalizar?.(this._sizes().map((s) => Math.round(s * 10) / 10));
  }
}

// ─── Grupo ────────────────────────────────────────────────────────────────────

@Directive({
  selector: 'div[ndsResizable]',
  standalone: true,
  providers: [NdsResizableStore],
  host: {
    class: 'nds-resizable',
    '[attr.data-slot]': '"resizable"',
    '[attr.data-direction]': 'direction()',
  },
})
export class NdsResizable implements AfterContentInit {
  /** Split lateral (`horizontal`) ou empilhado (`vertical`). */
  readonly direction = input<ResizableDirection>('horizontal');

  /**
   * Persiste o layout no `localStorage` sob esta chave. Vazio desliga —
   * gravar sem o consumidor pedir deixaria a próxima visita com o tamanho de
   * uma sessão anterior sem que ninguém tivesse escolhido isso.
   */
  readonly autoSaveId = input<string>('');

  /** Tamanhos finais, em porcentagem, ao fim de cada gesto. */
  readonly layout = output<number[]>();

  private readonly store = inject(NdsResizableStore);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    this.store.registrarGrupo(this.el);
    // `effect` e não leitura direta: no construtor `direction()` devolveria o
    // default declarado, nunca o que o consumidor ligou (armadilha 9).
    effect(() => this.store.direction.set(this.direction()));
    this.store.aoFinalizar = (sizes) => {
      this.layout.emit(sizes);
      this.persistir(sizes);
    };
  }

  ngAfterContentInit(): void {
    this.store.start(this.restaurar());
  }

  private key(): string {
    const id = this.autoSaveId();
    return id ? `nds-resizable:${id}` : '';
  }

  private restaurar(): number[] | undefined {
    const k = this.key();
    if (!k) return undefined;
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return undefined;
      const v: unknown = JSON.parse(raw);
      return Array.isArray(v) && v.every((n) => typeof n === 'number' && Number.isFinite(n))
        ? (v as number[])
        : undefined;
    } catch {
      // JSON corrompido ou storage bloqueado: cai no layout declarado.
      return undefined;
    }
  }

  private persistir(sizes: number[]): void {
    const k = this.key();
    if (!k) return;
    try {
      localStorage.setItem(k, JSON.stringify(sizes));
    } catch {
      // Modo privado / cota estourada: persistir é conveniência, não contrato.
    }
  }
}

// ─── Painel ───────────────────────────────────────────────────────────────────

@Directive({
  selector: 'div[ndsResizablePanel]',
  standalone: true,
  host: {
    class: 'nds-resizable-panel',
    // O painel rola (`overflow: auto` no CSS compartilhado). Região rolável
    // precisa ser alcançável por teclado, senão o conteúdo escondido fica
    // inacessível a quem não usa mouse — é o que o Vanilla também faz.
    tabindex: '0',
    '[attr.data-slot]': '"resizable-panel"',
    '[style.--panel-size]': 'tamanhoCss()',
  },
})
export class NdsResizablePanel {
  /** Tamanho inicial em porcentagem. Sem valor, divide a sobra com os iguais. */
  readonly defaultSize = input<number | undefined>(undefined);
  /** Mínimo em porcentagem — é o que impede o painel de sumir. */
  readonly minSize = input(10, { transform: numberAttribute });
  /** Máximo em porcentagem. */
  readonly maxSize = input(100, { transform: numberAttribute });

  readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly store = inject(NdsResizableStore);

  constructor() {
    this.store.registrarPainel(this);
  }

  /**
   * String, e não número: `[style.--panel-size]` com valor numérico faz o
   * Angular anexar "px" à custom property. Vazio remove a propriedade e o CSS
   * cai no fallback.
   *
   * A porcentagem viaja como FATOR DE CRESCIMENTO (`flex-grow`), não como
   * largura: com `flex-basis: 0` o espaço livre é dividido na mesma proporção
   * sem a folha depender de o container ter altura definida — e os punhos, que
   * ocupam 1px cada, saem da conta em vez de estourarem os 100%.
   */
  protected readonly tamanhoCss = computed(() => {
    const s = this.store.sizeOf(this);
    return s === undefined ? '' : String(Math.round(s * 1e4) / 1e4);
  });
}

// ─── Punho ────────────────────────────────────────────────────────────────────

@Component({
  selector: 'div[ndsResizableHandle]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (withHandle()) {
      <div class="nds-resizable-grip">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>
    }
  `,
  host: {
    class: 'nds-resizable-handle',
    role: 'separator',
    tabindex: '0',
    '[attr.data-slot]': '"resizable-handle"',
    '[attr.aria-orientation]': 'orientacao()',
    '[attr.aria-valuenow]': 'valorAgora()',
    '[attr.aria-valuemin]': 'valorMinimo()',
    '[attr.aria-valuemax]': 'valorMaximo()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-dragging]': 'arrastando() ? "" : null',
    '(keydown)': 'onKeyDown($event)',
    '(pointerdown)': 'aoPressionar($event)',
    '(pointermove)': 'aoMover($event)',
    '(pointerup)': 'aoSoltar($event)',
    '(pointercancel)': 'aoSoltar($event)',
  },
})
export class NdsResizableHandle {
  /** Mostra o pegador visual centralizado — descoberta em desktop. */
  readonly withHandle = input(false, { transform: booleanAttribute });
  /** Divisor travado: continua focável e anunciado, mas não move nada. */
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly store = inject(NdsResizableStore);

  protected readonly arrastando = signal(false);
  private origem = 0;

  constructor() {
    this.store.registrarPunho(this);
  }

  /**
   * O punho de um grupo horizontal é uma LINHA VERTICAL — daí a inversão. É
   * também o que o CSS compartilhado lê para decidir espessura e cursor.
   */
  protected readonly orientacao = computed(() =>
    this.store.horizontal() ? 'vertical' : 'horizontal',
  );

  // Arredondados: `aria-valuenow` é lido em voz alta, e "37.428571" não informa
  // nada além do que "37" já informa.
  protected readonly valorAgora = computed(() => arredondar(this.store.valorDe(this)));
  protected readonly valorMinimo = computed(() => arredondar(this.store.minimumOf(this)));
  protected readonly valorMaximo = computed(() => arredondar(this.store.maximoDe(this)));

  protected aoPressionar(e: PointerEvent): void {
    if (this.disabled() || e.button !== 0) return;
    e.preventDefault();
    // Captura: sem ela o pointermove para de chegar assim que o cursor sai da
    // linha de 1px — o que acontece no primeiro pixel de qualquer arrasto.
    // Em try: o navegador recusa capturar um pointerId que já se encerrou, e
    // uma exceção aqui abortaria o gesto antes mesmo de ele começar.
    try {
      this.el.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro já encerrado — o arrasto segue pelos eventos no próprio punho */
    }
    // `preventDefault` acima cancela o foco que o mousedown daria; devolvido à
    // mão para que o divisor recém-arrastado continue operável pelas setas.
    this.el.focus();
    this.origem = this.store.horizontal() ? e.clientX : e.clientY;
    this.store.iniciarArrasto();
    this.arrastando.set(true);
  }

  protected aoMover(e: PointerEvent): void {
    if (!this.arrastando()) return;
    const pos = this.store.horizontal() ? e.clientX : e.clientY;
    this.store.arrastar(this, pos - this.origem);
  }

  protected aoSoltar(e: PointerEvent): void {
    if (!this.arrastando()) return;
    this.arrastando.set(false);
    if (this.el.hasPointerCapture(e.pointerId)) this.el.releasePointerCapture(e.pointerId);
    this.store.finalizar();
  }

  /**
   * O equivalente por teclado do arrasto (WCAG 2.1.1 e 2.5.7).
   *
   * As setas do eixo do grupo movem um passo; as do outro eixo são ignoradas
   * de propósito, para não roubar a navegação de quem só está passando.
   */
  protected onKeyDown(e: KeyboardEvent): void {
    if (this.disabled()) return;
    const horizontal = this.store.horizontal();
    let delta = 0;
    let extremo: 'min' | 'max' | 'default' | undefined;

    switch (e.key) {
      case 'ArrowRight': if (horizontal) delta = STEP_KEYBOARD; break;
      case 'ArrowLeft':  if (horizontal) delta = -STEP_KEYBOARD; break;
      case 'ArrowDown':  if (!horizontal) delta = STEP_KEYBOARD; break;
      case 'ArrowUp':    if (!horizontal) delta = -STEP_KEYBOARD; break;
      case 'Home':  extremo = 'min'; break;
      case 'End':   extremo = 'max'; break;
      case 'Enter': extremo = 'default'; break;
      default: return;
    }
    if (delta === 0 && extremo === undefined) return;

    e.preventDefault();
    if (extremo) this.store.levarPara(this, extremo);
    else this.store.ajustar(this, delta);
    this.store.finalizar();
  }
}

function arredondar(v: number | undefined): number | null {
  return v === undefined ? null : Math.round(v);
}
