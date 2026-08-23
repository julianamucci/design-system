import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  RdxSliderRoot,
  RdxSliderControl,
  RdxSliderTrack,
  RdxSliderIndicator,
  RdxSliderThumb,
  RdxSliderThumbInput,
} from '@radix-ng/primitives/slider';
import { RdxControlValueAccessor } from '@radix-ng/primitives/core';

// ─── Slider ───────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-slider-* (docs/shared/styles/nds/slider.css).
//
// COM os primitivos do Radix NG, e aqui o que eles trazem é muito: teclado
// completo (setas, Home/End, PageUp/PageDown), arraste, RTL, passo mínimo entre
// valores e MÚLTIPLOS thumbs que não se atropelam. O Vanilla resolve com um
// `<input type="range">` nativo sobreposto — elegante, mas só faz valor único.
//
// O consumidor escreve UM elemento, como no React: as cinco partes internas
// nascem do template e a quantidade de alças vem do tamanho de `value`. Quem usa
// um intervalo passa `[20, 80]` e ganha dois thumbs sem escrever nenhum.
//
// A classe `.nds-slider` vai no CONTROL, não na raiz — é onde o React a põe, e o
// CSS depende disso (`.nds-slider` é o flex container do trilho).
//
// O indicador e as alças recebem `style` do primitivo em runtime, a partir do
// valor. Não é CSS de autoria: é o mesmo dado virando pixel que o Vanilla faz
// por JS.

@Component({
  selector: 'div[ndsSlider]',
  standalone: true,
  imports: [
    RdxSliderControl,
    RdxSliderTrack,
    RdxSliderIndicator,
    RdxSliderThumb,
    RdxSliderThumbInput,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: RdxSliderRoot,
      // `value` fica de fora porque este componente tem o seu, em array — que é
      // o contrato das cinco stacks. Não adianta bloquear a ligação por aqui: o
      // acessor interno do primitivo recebe `[value]` de qualquer jeito (ver o
      // primeiro `effect`). O que esta lista muda é quem responde por `value` no
      // template de quem consome.
      inputs: ['min', 'max', 'step', 'disabled', 'orientation', 'minStepsBetweenValues'],
      // `onValueCommitted` é o callback de commit que as cinco stacks
      // documentam — dispara ao soltar o arrasto ou largar a tecla, e é o que
      // se liga ao analytics. Output de host directive não é exposto sozinho:
      // sem esta lista, `(onValueCommitted)` no elemento não liga em nada e
      // falha em silêncio. `valueChange` fica de fora de propósito: este
      // componente já tem o seu, vindo do `model` de `value`.
      outputs: ['onValueCommitted'],
    },
  ],
  host: {
    '[attr.data-slot]': '"slider"',
    // O nome acessível pertence ao `<input type="range">` de cada alça, que é
    // quem tem `role="slider"`. Deixá-lo na raiz seria `aria-label` num
    // elemento sem papel — o que o axe reprova (aria-prohibited-attr) e o
    // leitor de tela ignora.
    '[attr.aria-label]': 'null',
  },
  template: `
    <div rdxSliderControl class="nds-slider" data-slot="slider-control">
      <div rdxSliderTrack class="nds-slider-track" data-slot="slider-track">
        <div rdxSliderIndicator class="nds-slider-range" data-slot="slider-range"></div>
      </div>

      <!-- Alças irmãs do trilho, e não filhas: é onde o primitivo as coloca, e
           é a mesma anatomia das outras stacks que rodam lib headless. O CSS
           compartilhado atende às duas — posiciona a alça contra \`.nds-slider\`,
           que é o ancestral posicionado nos dois arranjos.

           NÃO é por recorte: o trilho não tem \`overflow: hidden\`. Ele foi
           removido de propósito, e o motivo está no próprio slider.css — com
           6px de trilho contra uma alça de 24, recortar deixaria visível só uma
           tira dela. -->
      @for (label of rotulosDasAlcas(); track $index) {
        <div
          rdxSliderThumb
          [index]="$index"
          class="nds-slider-thumb"
          data-slot="slider-thumb"
        >
          <!-- Ligação de INPUT, não de atributo: o próprio RdxSliderThumbInput
               liga attr.aria-label ao seu input de mesmo nome, então escrever o
               atributo direto é apagado na primeira detecção de mudanças e a
               alça fica sem nome acessível — em silêncio, com o slider ainda na
               tela. Mesma regra do id no Switch e do invalid no Checkbox: quem
               compõe não é dono do atributo que o primitivo liga. -->
          <input rdxSliderThumbInput [aria-label]="label" />
        </div>
      }
    </div>
  `,
})
export class NdsSlider {
  /**
   * Valor(es). Sempre array — um item para valor único, dois para intervalo —
   * porque é o contrato que as cinco stacks compartilham. É um `model`, então
   * `[(value)]` funciona.
   */
  readonly value = model<number[]>([]);

  /**
   * Nome acessível das alças. Um slider simples usa `aria-label`; num intervalo
   * o mesmo texto vale para as duas — "Faixa de preço" dito duas vezes é pior
   * que "Mínimo" e "Máximo", e é para isso que existe `thumbLabels`.
   */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** Um rótulo por alça, na ordem. Vence o `aria-label` onde estiver definido. */
  readonly thumbLabels = input<readonly string[]>([]);

  private readonly root = inject(RdxSliderRoot, { self: true });

  /**
   * Uma entrada por alça. O tamanho sai de `values()` do primitivo — que é o
   * mesmo signal que ele usa para posicionar — então acrescentar um valor cria
   * a alça correspondente sem nenhum passo extra de quem consome.
   */
  protected readonly rotulosDasAlcas = computed<(string | undefined)[]>(() => {
    const proprios = this.thumbLabels();
    const padrao = this.ariaLabel();
    return this.root.values().map((_, i) => proprios[i] ?? padrao);
  });

  /**
   * O acessor por trás do primitivo.
   *
   * Escrever em `raiz.value` não bastaria: o `RdxSliderRoot` nunca LÊ o próprio
   * model `value` — ele é só saída. Tudo que a tela mostra vem de `cva.value()`,
   * e é por isso que a forma do valor precisa chegar aqui.
   */
  private readonly cva = inject<RdxControlValueAccessor<number | number[]>>(
    RdxControlValueAccessor,
    { self: true },
  );

  constructor() {
    // ── Normaliza a FORMA do valor, não o valor ────────────────────────────
    //
    // Um `[value]` escrito neste elemento chega ao acessor interno do primitivo
    // mesmo sem estar em `hostDirectives.inputs` — inputs de host directive
    // aninhada são expostos junto. E o primitivo decide se é intervalo por
    // `Array.isArray(value)`: com `[40]` ele monta uma faixa de 40% a 40%, ou
    // seja, preenchimento de largura zero, sem erro nenhum.
    //
    // Então um array de um item vira número solto. Só a forma muda; o número é
    // o que já estava lá, e por isso isto não disputa o valor com ninguém —
    // durante o arraste o acessor já guarda um número e este effect não escreve.
    effect(() => {
      const current = this.cva.value();
      if (Array.isArray(current) && current.length === 1) this.cva.writeValue(current[0]);
    });

    // ── E de volta ──────────────────────────────────────────────────────────
    //
    // Arraste e teclado escrevem no primitivo; quem consome continua lendo
    // array, que é o contrato das cinco stacks. A leitura de comparação vai em
    // `untracked` de propósito: como dependência, ela acordaria este effect no
    // meio do arraste com o valor antigo em mãos.
    effect(() => {
      const doPrimitivo = this.root.values();
      const meu = untracked(this.value);
      const igual = meu.length === doPrimitivo.length && meu.every((v, i) => v === doPrimitivo[i]);
      if (!igual) this.value.set([...doPrimitivo]);
    });
  }
}
