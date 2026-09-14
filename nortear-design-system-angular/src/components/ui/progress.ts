import {
  Directive,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  RdxProgressRootDirective,
  RdxProgressTrackDirective,
  RdxProgressIndicatorDirective,
  RdxProgressLabelDirective,
  RdxProgressValueDirective,
  injectProgressRootContext,
} from '@radix-ng/primitives/progress';
import { progressValueText } from '@shared/primitives/progress-value';

// ─── Progress ─────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-progress-root, .nds-progress, .nds-progress-indicator,
// .nds-progress-label e .nds-progress-value (docs/shared/styles/nds/progress.css).
//
// COM os primitivos do Radix NG. Eles contribuem de verdade: `role`,
// `aria-valuemin/max/now`, `aria-labelledby` amarrado à presença de um rótulo,
// o clamp do valor entre min e max, a derivação do estado
// (progressing/complete/indeterminate). Reimplementar isso à mão seria refazer
// pior o que a lib já entrega.
//
// TUDO É DIRETIVA DE ATRIBUTO em elemento nativo, como no Card e no Slider: o
// Vanilla — referência de markup — renderiza `<div>`, e markup é o que a
// auditoria cross-stack compara.
//
// ─── A regra do valor ───────────────────────────────────────────────────────
//
// A regra é a de `@shared/primitives/progress-value`, a mesma nas cinco stacks.
// Conferida contra a lib em 2026-09-14:
//
//   - valor omitido, `null` ou `NaN` → indeterminado: a lib dá o mesmo;
//   - clamp entre mínimo e máximo, e máximo ≤ mínimo → mínimo + 100: igual;
//   - `Infinity` DIVERGE: a lib aceita (só recusa `NaN`) e limita ao máximo, a
//     regra dá indeterminado. O input de valor é da lib, então a divergência
//     fica declarada aqui em vez de escondida.
//
// ─── O texto anunciado ──────────────────────────────────────────────────────
//
// A lib escreve `aria-valuetext` sozinha, e no indeterminado escreve uma frase
// FIXA em inglês ("indeterminate progress"), que o formatador dela nem chega a
// ver: o `valueLabel` do Radix NG só é chamado com número. Por isso o texto não
// passa pelo formatador da lib — esta diretiva tem a própria entrada,
// `getAriaValueText(value, min, max)`, que recebe `null` no indeterminado, e o
// padrão é `progressValueText` da regra compartilhada.
//
// A escrita é depois da renderização (`afterRenderEffect`), e não por host
// binding, porque a lib continua ligando o MESMO atributo. Host binding só
// reescreve quando o PRÓPRIO valor muda: com um formatador que devolve o mesmo
// texto para 42 e 43, a lib escreveria "43%" e o texto de quem compôs perderia.
// O efeito lê valor, mínimo e máximo diretamente, então roda de novo a cada
// mudança que faz a lib reescrever — e roda depois dela.
//
// ─── A largura da barra ──────────────────────────────────────────────────────
//
// O `RdxProgressIndicator` NÃO escreve largura nem transform: publica o
// progresso em `data-percent`. O CSS compartilhado lê `--value` (0–100), e o
// indicador só alimenta essa custom property com o percentual da lib — que é o
// mesmo número que `progressPercent` da regra devolve.

/**
 * Formatador do texto anunciado. `value` é o valor JÁ limitado à faixa, ou
 * `null` no modo indeterminado.
 */
export type ProgressValueTextFormatter = (value: number | null, min: number, max: number) => string;

/** Raiz do progresso — recebe o valor e carrega `role="progressbar"`. */
@Directive({
  selector: 'div[ndsProgress]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxProgressRootDirective,
      inputs: ['value', 'min', 'max'],
    },
  ],
  host: {
    class: 'nds-progress-root',
    '[attr.data-slot]': '"progress"',
  },
})
export class NdsProgress {
  private readonly root = inject(RdxProgressRootDirective);

  /** Texto anunciado no lugar do percentual. Ausente, vale a regra compartilhada. */
  readonly getAriaValueText = input<ProgressValueTextFormatter | undefined>(undefined);

  /** O texto que a raiz anuncia — e que a parte de valor visível mostra. */
  readonly valueText = computed(() => {
    const value = this.root.valueState();
    const min = this.root.minState();
    const max = this.root.maxState();
    const format = this.getAriaValueText();
    return format ? format(value, min, max) : progressValueText(value, { min, max });
  });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterRenderEffect({
      write: () => {
        // Lidos aqui, e não só dentro do `computed`: um texto que não muda não
        // propagaria, e a lib já teria reescrito o atributo com o dela.
        this.root.valueState();
        this.root.minState();
        this.root.maxState();
        el.setAttribute('aria-valuetext', this.valueText());
      },
    });
  }
}

/** Trilha de fundo — a caixa por onde o indicador corre. */
@Directive({
  selector: 'div[ndsProgressTrack]',
  standalone: true,
  hostDirectives: [RdxProgressTrackDirective],
  host: {
    class: 'nds-progress',
    '[attr.data-slot]': '"progress-track"',
  },
})
export class NdsProgressTrack {}

/** Barra preenchida. A posição sai de `--value`, que o CSS compartilhado lê. */
@Directive({
  selector: 'div[ndsProgressIndicator]',
  standalone: true,
  hostDirectives: [RdxProgressIndicatorDirective],
  host: {
    class: 'nds-progress-indicator',
    '[attr.data-slot]': '"progress-indicator"',
    '[style.--value]': 'valueCss()',
  },
})
export class NdsProgressIndicator {
  private readonly progress = injectProgressRootContext();

  // String e não número: `[style.--value]` com valor numérico faz o Angular
  // anexar "px" a custom property em algumas versões (mesma nota do
  // NdsAspectRatio). `null` remove a propriedade e o CSS usa o fallback 0.
  protected readonly valueCss = computed(() => {
    const pct = this.progress.percentageState();
    return pct === null ? null : String(pct);
  });
}

/** Rótulo textual da operação. Presente, vira o nome acessível da raiz. */
@Directive({
  selector: 'span[ndsProgressLabel]',
  standalone: true,
  hostDirectives: [RdxProgressLabelDirective],
  host: {
    class: 'nds-progress-label',
    '[attr.data-slot]': '"progress-label"',
  },
})
export class NdsProgressLabel {}

/**
 * Valor visível — o mesmo texto que a raiz anuncia, vazio no indeterminado.
 *
 * Nasce `aria-hidden` (pela lib): o texto já é anunciado pela raiz em
 * `aria-valuetext`, e repeti-lo faria o leitor ler duas vezes. O texto sai de
 * `NdsProgress.valueText`, e não do formatador da lib, pelo mesmo motivo da
 * raiz — senão um `getAriaValueText` mudaria o anúncio e deixaria o número.
 */
@Directive({
  selector: 'span[ndsProgressValue]',
  standalone: true,
  hostDirectives: [RdxProgressValueDirective],
  host: {
    class: 'nds-progress-value',
    '[attr.data-slot]': '"progress-value"',
  },
})
export class NdsProgressValue {
  private readonly bar = inject(NdsProgress);
  private readonly progress = injectProgressRootContext();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterRenderEffect({
      write: () => {
        const value = this.progress.valueState();
        this.progress.minState();
        this.progress.maxState();
        el.textContent = value === null ? '' : this.bar.valueText();
      },
    });
  }
}

/** As cinco partes — conveniência para o `imports` de quem compõe. */
export const NDS_PROGRESS = [
  NdsProgress, NdsProgressTrack, NdsProgressIndicator,
  NdsProgressLabel, NdsProgressValue,
] as const;
