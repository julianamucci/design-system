import { Directive, computed } from '@angular/core';
import {
  RdxProgressRootDirective,
  RdxProgressTrackDirective,
  RdxProgressIndicatorDirective,
  RdxProgressLabelDirective,
  RdxProgressValueDirective,
  injectProgressRootContext,
} from '@radix-ng/primitives/progress';

// ─── Progress ─────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-progress-root, .nds-progress, .nds-progress-indicator,
// .nds-progress-label e .nds-progress-value (docs/shared/styles/nds/progress.css).
//
// COM os primitivos do Radix NG. Aqui eles contribuem de verdade: `role`,
// `aria-valuemin/max/now`, `aria-valuetext`, `aria-labelledby` amarrado à
// presença de um rótulo, o clamp do valor entre min e max, a derivação do
// estado (progressing/complete/indeterminate) e o texto formatado do valor.
// Reimplementar isso à mão seria refazer pior o que a lib já entrega.
//
// TUDO É DIRETIVA DE ATRIBUTO em elemento nativo, como no Card e no Slider: o
// Vanilla — referência de markup — renderiza `<div>`, e markup é o que a
// auditoria cross-stack compara. Um `<nds-progress>` teria a mesma classe e o
// mesmo data-slot, mas outra TAG.
//
// ─── A largura da barra ──────────────────────────────────────────────────────
//
// O `RdxProgressIndicator` NÃO escreve largura nem transform: ele publica o
// progresso em `data-percent` e deixa o desenho para o CSS. O CSS compartilhado,
// por sua vez, lê a custom property `--value` (0–100):
//
//   .nds-progress-indicator { transform: translateX(calc((var(--value,0) - 100) * 1%)); }
//
// Então a única coisa que este componente faz é alimentar `--value` com o
// percentual que o primitivo calculou. Não é CSS de autoria — é dado virando
// pixel, o mesmo mecanismo (e a mesma custom property) que o Vanilla usa via
// `style.setProperty('--value', …)` e que o `NdsAspectRatio` usa com `--ratio`.
// Escrever `width` ou `transform` inline aqui sobrescreveria a regra do design
// system em vez de alimentá-la.
//
// ─── Indeterminate ───────────────────────────────────────────────────────────
//
// `value` ausente (ou `null`) é o modo indeterminate: o primitivo remove
// `aria-valuenow`, anuncia `aria-valuetext` próprio e marca `data-indeterminate`
// na raiz, na trilha e no indicador. Aqui `--value` deixa de ser escrita, e o
// CSS cai no fallback `0`. O CSS compartilhado ainda NÃO tem regra de animação
// para `[data-indeterminate]` — a barra fica vazia em vez de correr. Nenhuma das
// cinco stacks tem essa regra; criá-la só aqui faria esta divergir. Está
// registrado em `notes` da docs page.

/**
 * Raiz do progresso — recebe o valor e carrega `role="progressbar"`.
 *
 * `getAriaValueText` é o formatador do valor: o primitivo o usa tanto no
 * `aria-valuetext` quanto no texto visível de `ndsProgressValue`.
 */
@Directive({
  selector: 'div[ndsProgress]',
  standalone: true,
  hostDirectives: [
    {
      directive: RdxProgressRootDirective,
      // `valueLabel` exposto como `getAriaValueText`: é o nome que o conteúdo
      // compartilhado documenta para as cinco stacks.
      inputs: ['value', 'min', 'max', 'valueLabel: getAriaValueText'],
    },
  ],
  host: {
    class: 'nds-progress-root',
    '[attr.data-slot]': '"progress"',
  },
})
export class NdsProgress {}

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
  private readonly progresso = injectProgressRootContext();

  // String e não número: `[style.--value]` com valor numérico faz o Angular
  // anexar "px" a custom property em algumas versões (mesma nota do
  // NdsAspectRatio). `null` remove a propriedade e o CSS usa o fallback 0.
  protected readonly valueCss = computed(() => {
    const pct = this.progresso.percentageState();
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
 * Valor formatado, escrito pelo primitivo (`42%` por padrão).
 *
 * Nasce `aria-hidden`: o mesmo número já é anunciado pela raiz em
 * `aria-valuenow`/`aria-valuetext`, e repeti-lo faria o leitor ler duas vezes.
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
export class NdsProgressValue {}

/** As cinco partes — conveniência para o `imports` de quem compõe. */
export const NDS_PROGRESS = [
  NdsProgress, NdsProgressTrack, NdsProgressIndicator,
  NdsProgressLabel, NdsProgressValue,
] as const;
