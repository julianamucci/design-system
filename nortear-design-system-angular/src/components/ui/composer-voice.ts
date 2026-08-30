import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { Mic } from 'lucide';
import { isVoiceBusy, type VoiceState } from '@shared/primitives/chat-protocol';
import { NdsButton } from './button';

// ─── ComposerVoice ────────────────────────────────────────────────────────────
//
// O controle do trilho que escreve por quem fala.
//
// Desenho em docs/shared/styles/nds/composer.css, no bloco de ditado por voz,
// que também guarda as quatro decisões de acessibilidade. O vocabulário —
// `VoiceState`, `isVoiceBusy` — vem de `@shared/primitives/chat-protocol`.
//
// A DECISÃO QUE GOVERNA A PEÇA: o componente NÃO capta áudio. Permissão de
// microfone, captura, transcrição e o destino do texto são de quem consome. Ele
// desenha o estado que recebe e avisa que alguém pediu para começar ou parar —
// a mesma divisão de `approval` no `chat-thread` e de `removeAttachment` nos
// anexos. Um ditado que pedisse permissão sozinho traria política de produto
// junto, e política envelhece por produto, não por sistema.
//
// O MEDIDOR É DECORATIVO E O ESTADO É TEXTO. O nível é um número de 0 a 1 que
// desenha e não se anuncia; o tempo decorrido é texto na tela e fica fora do que
// é lido em voz. É a mesma decisão do contador de caracteres e do relógio do
// reprodutor de mídia: número que muda a cada quadro, anunciado, torna a tela
// impossível de ouvir. Quem ouve recebe a PALAVRA do estado.
//
// O CONTROLE É AUTÔNOMO: o campo não sabe que ele existe. Quem consome o põe no
// início do trilho, que é um espaço — e é por isso que o seletor é de ELEMENTO,
// e não de atributo como o da lista de contexto. Ali a raiz precisava ser a
// própria `<ul>` para não somar uma caixa dentro da moldura do campo; aqui a
// raiz é um agrupamento com desenho próprio (`display: flex` e `gap`), e a
// caixa É a peça.
//
// AS DIVERGÊNCIAS DE API que se REGISTRAM em vez de se "alinhar":
//   - o retorno é um `output()` chamado `toggle`, e não um callback `onToggle`
//     passado como propriedade. É o caminho desta stack, o mesmo de
//     `removeAttachment` e `dismissQuote`.
//   - não há entrada `class`: `class` é nativo do host, e quem consome o
//     escreve direto no elemento `<nds-composer-voice>`.
//     (Sem exemplo de marcação aqui, de propósito: a regra `dead_class_in_component`
//     lê atributo de classe mesmo dentro de comentário, e o valor de exemplo
//     vira uma classe que não existe na folha.)

/** Nós do lucide, na forma `[tag, atributos]` do pacote agnóstico. */
type LucideIconNode = [string, Record<string, string>];

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Quantas barras o medidor desenha.
 *
 * É DESENHO, e por isso constante e não entrada: a folha declara `gap` entre as
 * barras, e o número delas é o que faz o conjunto ler como medidor em vez de
 * como um traço solto. Quem consome escolhe o nível, não a forma.
 */
const LEVEL_BAR_COUNT = 5;

/** Cada instância precisa do seu próprio id: a descrição do botão aponta para ele. */
let instances = 0;

/**
 * O pedido que sai do alternador.
 *
 * É INTENÇÃO, e não o estado seguinte. Entre pedir para começar e estar captando
 * existe uma permissão que pode demorar ou ser negada, e um componente que
 * anunciasse `recording` estaria adivinhando o que ainda não aconteceu.
 */
export type ComposerVoiceIntent = 'start' | 'stop';

export interface ComposerVoiceLabels {
  /** Nome do alternador em repouso — o que a pessoa vai fazer ao acioná-lo. */
  start: string;
  /** Nome do MESMO botão enquanto o ditado ocupa. Troca de nome, não só de desenho. */
  stop: string;
  /**
   * A palavra de cada estado. É ela que chega a quem não vê o medidor, e é nela
   * que vai o motivo de o alternador não responder na transcrição.
   */
  status: Record<VoiceState, string>;
}

/**
 * O ícone do alternador, decorativo.
 *
 * `@Directive`, e não template: cada ícone do lucide é uma lista `[tag, attrs]`
 * com tag variável (`path`/`rect`/`line`), e template Angular exige tag
 * estática — então os filhos nascem de `createElementNS` num `effect`. Mesma
 * escolha do `NdsButtonIcon` e do `NdsComposerContextIcon`, e imune a XSS: não
 * há `innerHTML` no caminho.
 *
 * É o MESMO ícone nos três estados, de propósito: estado nunca é só desenho, e
 * quem carrega a diferença é o nome do botão e a palavra escrita ao lado. O
 * `<svg>` não leva classe — `.nds-button > svg` já o dimensiona, e é assim que
 * a stack de referência o emite.
 */
@Directive({
  selector: 'svg[ndsComposerVoiceIcon]',
  standalone: true,
  host: {
    xmlns: SVG_NS,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  },
})
export class NdsComposerVoiceIcon {
  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of Mic as unknown as LucideIconNode[]) {
        const child = document.createElementNS(SVG_NS, tag);
        for (const [key, value] of Object.entries(attrs)) child.setAttribute(key, value);
        svg.appendChild(child);
      }
    });
  }
}

@Component({
  selector: 'nds-composer-voice',
  standalone: true,
  imports: [NdsButton, NdsComposerVoiceIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'nds-composer-voice',
    '[attr.data-slot]': '"composer-voice"',
    '[attr.data-state]': 'state()',
  },
  template: `
    <!-- UM botão que muda de estado, e não dois que se trocam (decisão 1 da
         folha): botão que some leva o foco junto, e quem estava nele é despejado
         no meio da tela. \`aria-pressed\` é o que carrega a diferença, e
         \`isVoiceBusy\` é quem a decide — a mesma máquina nas cinco stacks, em
         vez de cinco \`if\`.

         O nome acompanha o estado: nome acessível é o NOME, e não o ícone
         (regra 7 da guideline 17).

         \`transcribing\` DESABILITA (decisão 2 da folha): já parou de captar, e
         apertar ali não devolve o áudio. O motivo vai no texto de estado, nunca
         só no cinza do botão — e a descrição aponta justamente para ele, senão
         quem chega pelo teclado encontra um botão apagado e nenhuma explicação
         na tela. -->
    <button
      ndsButton
      type="button"
      variant="ghost"
      size="icon-sm"
      data-slot="composer-voice-toggle"
      [attr.aria-pressed]="busy()"
      [attr.aria-label]="toggleLabel()"
      [attr.aria-describedby]="statusId"
      [disabled]="locked()"
      (click)="toggle.emit(busy() ? 'stop' : 'start')"
    ><svg ndsComposerVoiceIcon></svg></button>

    <!-- O medidor só existe enquanto há som entrando: medidor parado ao lado de
         um ditado desligado é medidor mentindo. Ele é \`aria-hidden\` inteiro — o
         que muda a cada quadro, anunciado, cobre tudo o mais que houvesse para
         ouvir.

         O nível é valor de RUNTIME, e entra por propriedade personalizada —
         nunca por um estilo embutido de desenho, que sairia do tema junto com a
         densidade e a escala tipográfica. Mesma mecânica de
         \`--nds-attachment-progress\` na fila de anexos: declarado UMA vez, no
         container, e as barras herdam. -->
    @if (state() === 'recording') {
      <span
        class="nds-composer-voice-level"
        data-slot="composer-voice-level"
        aria-hidden="true"
        [style.--nds-voice-level]="levelCss()"
      >
        @for (bar of bars; track bar) {
          <span class="nds-composer-voice-bar"></span>
        }
      </span>
    }

    <!-- O estado, em PALAVRA. Ele NÃO é região viva: o estado muda por ação de
         quem usa ou por decisão de quem consome, e o alternador — que tem o foco
         quando isso acontece — já anuncia a troca por \`aria-pressed\` e pelo
         nome. Uma região viva aqui reanunciaria o texto inteiro a cada mudança
         de nível.

         O TEMPO DECORRIDO É O ÚNICO PEDAÇO ESCONDIDO DA VOZ. Ele fica dentro do
         texto de estado para ser lido junto na tela, e sai do que é anunciado
         por \`aria-hidden\`: cronômetro ao vivo não se anuncia (regra 9 da
         guideline 17), e é o defeito que o reprodutor de mídia já pagou nesta
         base. Como a descrição do alternador aponta para este mesmo elemento, o
         relógio ficaria colado no nome do botão a cada foco se não estivesse
         fora.

         O \`<span>\` sem classe é ESTRUTURA, e não desenho: ele herda tudo do pai
         e não pede nada da folha. -->
    <span
      class="nds-composer-voice-status"
      data-slot="composer-voice-status"
      [id]="statusId"
    >{{ statusWord() }}@if (elapsedText(); as clock) {<span
        data-slot="composer-voice-elapsed"
        aria-hidden="true"
      >{{ clock }}</span>}</span>
  `,
})
export class NdsComposerVoice {
  /** O texto do controle. Obrigatório, porque tudo aqui é texto de tela. */
  readonly labels = input.required<ComposerVoiceLabels>();

  /** Em que ponto o ditado está. Quem capta é quem sabe, e é quem passa. */
  readonly state = input<VoiceState>('idle');

  /** O som que entra, de 0 a 1. É desenho, e não se anuncia. */
  readonly level = input<number | undefined>(undefined);

  /**
   * Há quanto tempo a captura corre, JÁ ESCRITO.
   *
   * String, e não segundos: formato de duração é decisão de idioma, e um
   * componente que o formatasse decidiria idioma em cinco lugares diferentes.
   */
  readonly elapsed = input<string | undefined>(undefined);

  /** Ditar não está disponível agora. Na transcrição já se desabilita sozinho. */
  readonly disabled = input<boolean>(false);

  /**
   * Alguém pediu para começar ou parar. Começar de verdade é de quem capta.
   *
   * É `output()`, e não callback em propriedade: é o caminho desta stack.
   *
   * O NOME é `toggle`, e a regra do lint que o proíbe está desligada AQUI e com
   * motivo. Ela existe porque uma saída com nome de evento nativo dispara duas
   * vezes quando o host TEM esse evento — `<details>` e o popover emitem
   * `toggle` de verdade. O host aqui é `<nds-composer-voice>`, um elemento que
   * não emite nada por conta própria, então não há segundo disparo a temer. E o
   * nome não é escolha livre: o conteúdo compartilhado já documenta
   * `(toggle)="…"` como o uso desta stack, e trocá-lo aqui faria a página
   * ensinar um nome que o componente não tem.
   */
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly toggle = output<ComposerVoiceIntent>();

  /** As barras do medidor. Lista de desenho, e por isso fixa. */
  protected readonly bars = Array.from({ length: LEVEL_BAR_COUNT }, (_, i) => i);

  protected readonly statusId = `nds-composer-voice-${++instances}-status`;

  /**
   * Se o ditado ocupa. A decisão sai do vocabulário compartilhado, e não de um
   * `if` local: cinco stacks escreveriam cinco versões da mesma regra, e uma
   * delas discordaria.
   */
  protected readonly busy = computed(() => isVoiceBusy(this.state()));

  protected readonly toggleLabel = computed(() =>
    this.busy() ? this.labels().stop : this.labels().start,
  );

  protected readonly statusWord = computed(() => this.labels().status[this.state()]);

  protected readonly locked = computed(() => this.disabled() || this.state() === 'transcribing');

  /**
   * O nível aparado na faixa que o desenho aceita, já como texto.
   *
   * String, e não número: `[style.--custom]` com valor numérico faz o Angular
   * anexar "px" à propriedade personalizada — a mesma nota do
   * `NdsComposerAttachments` e do `NdsProgressIndicator`. E `NaN` é ausência, não
   * zero: um medidor no chão desenharia "sem som" onde o que houve foi um número
   * inválido.
   */
  protected readonly levelCss = computed<string | null>(() => {
    const value = this.level();
    if (value === undefined || Number.isNaN(value)) return null;
    return String(Math.min(1, Math.max(0, value)));
  });

  /**
   * O tempo decorrido com o separador já junto.
   *
   * Montado aqui, e não no template: o separador é texto, e texto colado a uma
   * interpolação atravessa a remoção de espaços em branco do compilador sem
   * garantia nenhuma de sair do outro lado igual.
   */
  protected readonly elapsedText = computed<string | null>(() => {
    const value = this.elapsed();
    return value ? ` · ${value}` : null;
  });
}
