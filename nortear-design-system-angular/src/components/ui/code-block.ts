import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { NdsButton, NdsButtonIcon } from './button';
import { copyText } from '@shared/primitives/clipboard';
import {
  highlightCode,
  parseLineRanges,
  resolveLanguage,
  type LineRangeInput,
} from '@shared/primitives/code-highlight';

// ─── CodeBlock ────────────────────────────────────────────────────────────────
//
// Bloco de código com header (título + copiar), scroll, numeração e destaque de
// linha. Estrutura e cores em docs/shared/styles/nds/code-block.css.
//
// A tokenização vem de @shared/primitives/code-highlight (TS puro, agnóstico de
// framework) e devolve DADOS, não HTML: cada span é um nó do template, então não
// há `innerHTML` e nenhuma superfície de XSS a sanitizar.

/** Reseta o feedback de "copiado" depois deste intervalo. */
const COPIED_RESET_MS = 2000;

@Component({
  selector: 'nds-code-block',
  standalone: true,
  imports: [NdsButton, NdsButtonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.data-slot]': '"code-block"',
    // `numbered` e não `String(showLineNumbers())`: o contexto de expressão do
    // template Angular não expõe globais como String.
    '[attr.data-numbered]': 'numbered()',
    '[attr.data-language]': 'resolvedLanguage()',
    class: 'nds-code-block-root',
  },
  template: `
    <!-- Header sempre presente: o botão copiar precisa aparecer mesmo sem título. -->
    <div class="nds-code-block-header">
      @if (title()) {
        <span class="nds-code-block-title">{{ title() }}</span>
      }
      <span class="nds-code-block-actions">
        <span
          class="nds-code-block-copy-label"
          aria-hidden="true"
          [hidden]="!copied()"
        >{{ copiedLabel() }}</span>

        <!-- aria-live fora do botão: o leitor de tela anuncia a confirmação sem
             que o rótulo do botão mude no meio da interação. -->
        <span class="nds-sr-only" role="status" aria-live="polite">{{ liveText() }}</span>

        <button
          #copyButton
          ndsButton
          variant="ghost"
          size="icon-sm"
          [attr.aria-label]="copied() ? copiedLabel() : copyLabel()"
          (click)="onCopy()"
        >
          <!-- Troca o ícone em vez de esconder um dos dois: [hidden] não esconde
               SVG (a regra da folha do navegador é namespaced para XHTML). -->
          <svg ndsButtonIcon [kind]="copied() ? 'check' : 'copy'" class="nds-icon"></svg>
        </button>
      </span>
    </div>

    <div class="nds-code-block-scroll" tabindex="0">
      <!-- lang="en": o conteúdo é código — identificador e palavra reservada.
           Sem isto a voz do leitor em pt-BR tenta pronunciá-lo como português.
           WCAG 3.1.2. -->
      <pre class="nds-code-block-pre" lang="en"><code class="nds-code-block-code">@for (line of lines(); track $index; let i = $index) {<span class="nds-code-block-line" [attr.data-highlighted]="highlighted().has(i + 1) ? 'true' : null"><span class="nds-code-block-gutter" aria-hidden="true">{{ i + 1 }}</span><span class="nds-code-block-text">@if (line.length === 0) {&#10;} @else {@for (span of line; track $index) {@if (span.token === 'plain') {{{ span.text }}} @else {<span [attr.data-token]="span.token">{{ span.text }}</span>}}}</span></span>}</code></pre>
    </div>

    <!-- Faixa inferior opcional. Fora do scroll de propósito: a observação
         precisa continuar visível enquanto a pessoa rola o trecho. -->
    @if (footer()) {
      <div class="nds-code-block-footer">{{ footer() }}</div>
    }
  `,
})
export class NdsCodeBlock implements OnDestroy {
  /** Código a exibir. É exatamente o que o botão copiar coloca no clipboard. */
  readonly code = input.required<string>();
  /** Linguagem ou extensão (`ts`, `html`, `.css`, `bash`). Desconhecida → sem cor. */
  readonly language = input<string | undefined>(undefined);
  /** Rótulo do header, normalmente o nome do arquivo. */
  readonly title = input<string>('');
  readonly showLineNumbers = input<boolean>(true);
  /** Linhas destacadas: `[3, '5-7']` ou `'3, 5-7'`. */
  readonly highlightLines = input<LineRangeInput | undefined>(undefined);
  /**
   * Observação abaixo do código. Texto, não markup: o conteúdo do rodapé chega
   * de `translations.json` e um `[innerHTML]` aqui abriria superfície de XSS num
   * componente que hoje não tem nenhuma.
   */
  readonly footer = input<string>('');
  readonly copyLabel = input<string>('Copiar código');
  readonly copiedLabel = input<string>('Copiado!');

  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  // `read: ElementRef` é obrigatório: numa tag com componente, o `#ref` do
  // template resolve para a INSTÂNCIA do componente, não para o elemento.
  private readonly copyButton = viewChild.required('copyButton', {
    read: ElementRef<HTMLButtonElement>,
  });

  constructor() {
    // `data-slot="code-block-copy"` é o contrato cross-stack para achar a ação
    // de copiar sem depender de classe. Escrever o atributo no template NÃO
    // funciona: o `NdsButton` declara `[attr.data-slot]="button"` como host
    // binding, e host binding roda DEPOIS do binding do template — o valor do
    // template era sobrescrito em silêncio, e a ação ficava indistinguível de
    // qualquer outro botão. Como o host binding é constante, o Ivy só escreve
    // na primeira detecção; escrever uma vez depois dela é definitivo.
    afterNextRender(() => {
      this.copyButton().nativeElement.setAttribute('data-slot', 'code-block-copy');
    });
  }

  protected readonly numbered = computed(() => (this.showLineNumbers() ? 'true' : 'false'));
  protected readonly resolvedLanguage = computed(() => resolveLanguage(this.language()));
  protected readonly lines = computed(() => highlightCode(this.code(), this.resolvedLanguage()));
  protected readonly highlighted = computed(() => parseLineRanges(this.highlightLines()));
  protected readonly liveText = computed(() => (this.copied() ? this.copiedLabel() : ''));

  protected onCopy(): void {
    // copyText já cobre o fallback fora de contexto seguro; false = não copiou,
    // e nesse caso não confirmamos nada.
    void copyText(this.code()).then((ok) => {
      if (!ok) return;
      this.copied.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), COPIED_RESET_MS);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
