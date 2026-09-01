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
import { LABELS_CODE_BLOCK_DEFAULT } from '@shared/primitives/code-block-labels';
import {
  codeLineMarks,
  hasLineKinds,
  type CodeLineKind,
} from '@shared/primitives/code-block-lines';

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
    // A folha precisa saber que a calha mudou de conteúdo: sem numeração ela
    // some, mas a marca `+`/`−` não pode sumir com ela.
    '[attr.data-line-kinds]': 'kindMode() ? "true" : null',
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
        <!-- Controles de quem compõe, projetados ANTES do copiar, e a ordem é
             decisão de acessibilidade, não de gosto: a fila é encostada no fim
             do cabeçalho, então acrescentar do lado de dentro deixa o copiar
             ancorado no canto do bloco em toda composição. Quem aprendeu que
             copiar é o último controle do cabeçalho continua com essa verdade
             quando a composição acrescenta executar, alternar ou baixar (WCAG
             3.2.4, identificação consistente). O rótulo "Copiado!" fica colado
             ao botão que ele descreve pelo mesmo motivo, e a ordem de foco
             segue a visual.

             \`ng-content\` sem seletor: a fila do cabeçalho é o único encaixe
             do componente, então tudo que quem consome escrever entre as tags
             do elemento cai aqui. -->
        <ng-content />

        <span
          class="nds-code-block-copy-label"
          aria-hidden="true"
          [hidden]="!copied()"
        >{{ copiedLabel() }}</span>

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

    <!-- aria-live IRMÃ do header, não filha dele: é a posição do Vanilla, a
         referência cross-stack. Dentro de \`nds-code-block-actions\` a região
         entra no flex do header e ganha o \`gap\` entre rótulo e botão, mesmo
         medindo zero pixel. Fora do botão em qualquer caso — é o que permite
         anunciar a confirmação sem trocar o rótulo no meio da interação. -->
    <span class="nds-sr-only" role="status" aria-live="polite">{{ liveText() }}</span>

    <!-- Região rolável alcançável por teclado (WCAG 2.1.1), COM papel e nome —
         a regra 6 da §8 da guideline 17 pede os dois, e \`tabindex\` sozinho
         fazia uma parada de foco que o leitor de tela não sabia nomear.

         \`group\` e não \`region\`: \`region\` com nome vira landmark, e uma
         página de documentação tem dezenas de blocos — seriam dezenas de
         entradas de mesmo papel e mesmo nome na lista de regiões do leitor, que
         é o que o docblock da \`scroll-area\` já avisa que torna a lista
         inútil. \`group\` nomeia sem entrar em lista nenhuma. -->
    <div class="nds-code-block-scroll" role="group" [attr.aria-label]="regionLabel()" tabindex="0">
      <!-- lang="en": o conteúdo é código — identificador e palavra reservada.
           Sem isto a voz do leitor em pt-BR tenta pronunciá-lo como português.
           WCAG 3.1.2. -->
      <pre class="nds-code-block-pre" lang="en"><code class="nds-code-block-code">@for (line of lines(); track $index; let i = $index) {<span class="nds-code-block-line" [attr.data-highlighted]="highlighted().has(i + 1) ? 'true' : null" [attr.data-kind]="marks()[i]?.kind ?? null"><span class="nds-code-block-gutter" [attr.aria-hidden]="marks()[i] ? null : 'true'">{{ marks()[i]?.mark ?? (i + 1) }}@if (marks()[i]?.label) {<span class="nds-sr-only">{{ marks()[i]?.label }}</span>}</span><span class="nds-code-block-text">@if (line.length === 0) {&#10;} @else {@for (span of line; track $index) {@if (span.token === 'plain') {{{ span.text }}} @else {<span [attr.data-token]="span.token">{{ span.text }}</span>}}}</span></span>}</code></pre>
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
   * Espécie de cada linha, indexada a partir da primeira.
   *
   * Ligada, a calha troca o número pela marca `+`/`−` e deixa de ser
   * `aria-hidden`. Indexada por linha, e não por intervalo como
   * `highlightLines`: destaque é decoração esparsa, espécie é classificação
   * completa — ver `@shared/primitives/code-block-lines`.
   */
  readonly lineKinds = input<ReadonlyArray<CodeLineKind> | undefined>(undefined);
  /**
   * Observação abaixo do código. Texto, não markup: o conteúdo do rodapé chega
   * de `translations.json` e um `[innerHTML]` aqui abriria superfície de XSS num
   * componente que hoje não tem nenhuma.
   */
  readonly footer = input<string>('');
  readonly copyLabel = input<string>(LABELS_CODE_BLOCK_DEFAULT.copy);
  readonly copiedLabel = input<string>(LABELS_CODE_BLOCK_DEFAULT.copied);
  /**
   * Palavra que o leitor recebe na calha de uma linha adicionada.
   *
   * Existe pelo mesmo motivo de `copyLabel`: é texto falado, e texto falado que
   * quem consome não possa trocar decide o idioma do produto pelo componente.
   */
  readonly addedLabel = input<string>(LABELS_CODE_BLOCK_DEFAULT.lineAdded);
  /** Palavra que o leitor recebe na calha de uma linha removida. */
  readonly removedLabel = input<string>(LABELS_CODE_BLOCK_DEFAULT.lineRemoved);
  /**
   * Nome acessível da região que rola.
   *
   * A região tem `tabindex="0"` porque quem navega por teclado precisa alcançar
   * o código que passa da altura máxima; com nome ela deixa de ser uma parada
   * anônima. Distinga quando houver mais de um bloco na mesma tela.
   */
  readonly regionLabel = input<string>(LABELS_CODE_BLOCK_DEFAULT.region);

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
  // Uma entrada por linha, ou vazio fora do modo de espécie. A calha só perde o
  // `aria-hidden` quando há entrada, e é a diferença que importa: número de
  // linha é redundante com a posição e sai da leitura; sinal de adição e
  // remoção é o único portador não-cromático da distinção.
  protected readonly marks = computed(() =>
    codeLineMarks(this.lineKinds(), this.lines().length, {
      ...LABELS_CODE_BLOCK_DEFAULT,
      lineAdded: this.addedLabel(),
      lineRemoved: this.removedLabel(),
    }),
  );
  protected readonly kindMode = computed(() => hasLineKinds(this.lineKinds()));
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
