// ─── Slider — Vanilla factory standalone ────────────────────────────────────
// Visual: classes .nds-slider-* (standalone).
// Native <input type="range"> sobreposto à track; CSS controla aparência.
//
// ─── Uma alça ou duas ────────────────────────────────────────────────────────
//
// O que separa os dois modos é a FORMA do valor: um número é uma alça, um par é
// um intervalo. Mesma leitura que as outras quatro stacks fazem, e o mesmo
// motivo — não existe intervalo sem os dois extremos, então o par já é a
// declaração completa e não sobra prop nenhuma para inventar.
//
// Cada alça é um `<input type="range">` de verdade, sobreposto ao trilho
// inteiro. Duas caixas sobrepostas disputam o ponteiro, e quem ganha é sempre a
// última pintada — o que deixaria a alça de baixo inalcançável no meio do
// trilho. A disputa se resolve por proximidade: enquanto o ponteiro passeia, a
// alça mais perto sobe. Para o teclado não há disputa: cada input é uma parada
// de tabulação com o próprio `role="slider"` e o próprio nome.

// ─── Types ────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

type SliderBaseOptions = {
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  /**
   * Nome acessível da alça. É `role="slider"` sem nome que o leitor de tela não
   * sabe ler.
   *
   * No intervalo são DUAS alças e dois nomes: passe um par
   * (`['Preço mínimo', 'Preço máximo']`). Um nome só é repetido nas duas, o que
   * deixa quem ouve sem saber qual extremo está mexendo.
   */
  'aria-label'?: string | string[];
  /** @deprecated Apelido de `aria-label`. */
  ariaLabel?: string | string[];
  class?: string;
};

export type SliderSingleOptions = SliderBaseOptions & {
  /** Valor inicial da alça única. */
  value?: number;
  /** Durante o arrasto e a cada tecla — um evento por movimento. */
  onValueChange?: (value: number) => void;
  /**
   * Ao soltar o arrasto ou largar a tecla — um evento por interação.
   *
   * É o `change` do input nativo, que existe exatamente para isto: o `input`
   * dispara a cada pixel e o `change` só quando o valor assenta. É o callback
   * para analytics e submit; usar o contínuo enche o GA4 de um evento por pixel.
   */
  onValueCommitted?: (value: number) => void;
};

export type SliderRangeOptions = SliderBaseOptions & {
  /** Extremos do intervalo, em ordem. O par é o que pede as duas alças. */
  value: number[];
  /** Durante o arrasto e a cada tecla — um evento por movimento. */
  onValueChange?: (value: number[]) => void;
  /** Ao soltar o arrasto ou largar a tecla — um evento por interação. */
  onValueCommitted?: (value: number[]) => void;
};

export type SliderOptions = SliderSingleOptions | SliderRangeOptions;

// ─── createSlider ─────────────────────────────────────────────────────────────

export function createSlider(options?: SliderSingleOptions): HTMLElement;
export function createSlider(options: SliderRangeOptions): HTMLElement;
export function createSlider(options: SliderOptions = {}): HTMLElement {
  const {
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    orientation = 'horizontal',
  } = options;

  // `ariaLabel` continua aceito como apelido; o canônico vence quando vêm os dois.
  const ariaLabel = options['aria-label'] ?? options.ariaLabel;

  const ehIntervalo = Array.isArray(options.value);
  const values: number[] = ehIntervalo
    ? [...(options.value as number[])]
    : [(options.value as number | undefined) ?? min];
  const vertical = orientation === 'vertical';

  const root = document.createElement('div');
  root.className = cn('nds-slider', options.class);
  root.dataset.slot = 'slider';
  root.dataset.orientation = orientation;

  const track = document.createElement('div');
  track.className = 'nds-slider-track';
  track.dataset.slot = 'slider-track';

  const range = document.createElement('div');
  range.className = 'nds-slider-range';
  range.dataset.slot = 'slider-range';
  track.appendChild(range);

  const names = Array.isArray(ariaLabel) ? ariaLabel : ariaLabel ? [ariaLabel] : [];
  const thumbs: HTMLElement[] = [];
  const inputs: HTMLInputElement[] = [];

  function pct(v: number): number {
    return max === min ? 0 : ((v - min) / (max - min)) * 100;
  }

  /**
   * Posiciona preenchimento e alças a partir dos valores.
   *
   * O `- 0.75rem` é METADE DA ALÇA — ela mede 24px (o alvo de toque da WCAG
   * 2.5.8), e sem descontar a metade o centro dela não cairia sobre a posição
   * do valor. Andou junto com o CSS quando a alça deixou de ser 16px de caixa
   * com área de toque por pseudo-elemento e passou a ter os 24 na caixa real;
   * enquanto era 16, o desconto era 0.5rem. Se a dimensão da alça mudar, este
   * número muda com ela.
   */
  function updateVisuals(): void {
    // Com uma alça o preenchimento nasce no mínimo; com duas, no primeiro
    // extremo — é o trecho ENTRE as alças que fica pintado.
    const start = ehIntervalo ? pct(values[0]) : 0;
    const end = ehIntervalo ? pct(values[1]) : pct(values[0]);

    if (vertical) {
      // Em pé o preenchimento cresce de baixo para cima, e a alça anda no
      // mesmo eixo — `left`/`width` posicionariam no eixo errado e deixariam a
      // alça parada no topo com o valor mudando.
      range.style.bottom = `${start}%`;
      range.style.height = `${end - start}%`;
    } else {
      range.style.left = `${start}%`;
      range.style.width = `${end - start}%`;
    }

    values.forEach((v, i) => {
      const thumb = thumbs[i];
      if (!thumb) return;
      if (vertical) thumb.style.bottom = `calc(${pct(v)}% - 0.75rem)`;
      else thumb.style.left = `calc(${pct(v)}% - 0.75rem)`;
    });
  }

  function emitirChange(): void {
    if (ehIntervalo) (options as SliderRangeOptions).onValueChange?.([...values]);
    else (options as SliderSingleOptions).onValueChange?.(values[0]);
  }

  function emitirCommit(): void {
    if (ehIntervalo) (options as SliderRangeOptions).onValueCommitted?.([...values]);
    else (options as SliderSingleOptions).onValueCommitted?.(values[0]);
  }

  values.forEach((valueInitial, indice) => {
    const thumb = document.createElement('span');
    thumb.className = 'nds-slider-thumb';
    thumb.dataset.slot = 'slider-thumb';
    thumbs.push(thumb);
    track.appendChild(thumb);

    // Real range input — handles all interaction natively (sobreposto à track via CSS).
    const nativeInput = document.createElement('input');
    nativeInput.type = 'range';
    nativeInput.min = String(min);
    nativeInput.max = String(max);
    nativeInput.step = String(step);
    nativeInput.value = String(valueInitial);
    nativeInput.disabled = disabled;
    const nome = names[indice] ?? names[0];
    if (nome) nativeInput.setAttribute('aria-label', nome);
    // `<input type="range">` é horizontal por definição na árvore de
    // acessibilidade; em pé, a orientação precisa ser dita.
    if (vertical) nativeInput.setAttribute('aria-orientation', 'vertical');
    inputs.push(nativeInput);
    track.appendChild(nativeInput);

    nativeInput.addEventListener('input', () => {
      const raw = Number(nativeInput.value);
      // Os extremos não se cruzam: o mínimo para no máximo e vice-versa. Sem
      // isto o arrasto passa por cima do irmão e o intervalo sai invertido —
      // e ninguém que lê `[80, 20]` sabe o que fazer com ele.
      const preso = ehIntervalo
        ? indice === 0
          ? Math.min(raw, values[1])
          : Math.max(raw, values[0])
        : raw;
      if (preso !== raw) nativeInput.value = String(preso);
      values[indice] = preso;
      updateVisuals();
      emitirChange();
    });

    nativeInput.addEventListener('change', () => {
      emitirCommit();
    });
  });

  if (ehIntervalo) {
    /**
     * Quem recebe o ponteiro é a alça mais próxima dele.
     *
     * Os dois inputs cobrem o trilho inteiro e um está por cima do outro: sem
     * esta escolha, a alça de baixo só seria arrastável quando a de cima
     * estivesse longe. A decisão acontece no MOVIMENTO, antes do aperto — no
     * `pointerdown` já é tarde, porque o evento foi despachado para o alvo que
     * estava por cima naquele instante.
     */
    const chooseHandle = (e: PointerEvent): void => {
      const caixa = track.getBoundingClientRect();
      const ratio = vertical
        ? caixa.height === 0 ? 0 : (caixa.bottom - e.clientY) / caixa.height
        : caixa.width === 0 ? 0 : (e.clientX - caixa.left) / caixa.width;
      const alvo = min + ratio * (max - min);
      const perto = Math.abs(alvo - values[0]) <= Math.abs(alvo - values[1]) ? 0 : 1;
      inputs[perto].style.zIndex = '2';
      inputs[perto === 0 ? 1 : 0].style.zIndex = '1';
    };
    track.addEventListener('pointermove', chooseHandle);
  }

  updateVisuals();

  root.appendChild(track);

  return root;
}
