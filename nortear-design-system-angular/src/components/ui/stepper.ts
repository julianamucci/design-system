import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { Check } from 'lucide';

// ─── Stepper — Angular 22 puro, sem primitivo headless ──────────────────────
//
// Visual: classes .nds-stepper-* de `docs/shared/styles/nds/stepper.css`.
//
// SEM `@radix-ng/primitives`, e não por preferência: o Radix NG não tem
// Stepper. O componente é escrito com o que a plataforma e o Angular já dão —
// `<ol>`/`<li>`/`<button>` nativos, signals para o estado derivado e injeção de
// dependência entre raiz e etapa. Inventar dependência para ter uma não traria
// nada: aqui não há foco a governar nem ARIA a gerar que a marcação nativa já
// não anuncie.
//
// A FOLHA É O CONTRATO, e é dela que esta implementação sai. Ela declara
// `<ol class="nds-stepper">` com `<li class="nds-stepper-item">`, o estado em
// `data-state` (active/completed/inactive) e a indisponibilidade em
// `data-disabled` no item. O `<button class="nds-stepper-trigger">` com
// `cursor: pointer` e anel de `:focus-visible` diz, sem ambiguidade, que a
// etapa é um CONTROLE.
//
// TUDO É SELETOR DE ATRIBUTO em elemento nativo, como no Tabs e no Progress: a
// referência de markup é a fábrica sem lib, que renderiza `<ol>`, `<li>`,
// `<button>` e `<span>`. Um `<nds-stepper>` teria a mesma classe e o mesmo
// `data-slot`, mas outra TAG — e tag é o que a auditoria cross-stack compara.
//
// `data-slot` e `data-state` saem por HOST BINDING, nunca por atributo estático
// no template de quem compõe: com o atributo escrito nos dois lugares, uma
// escrita sobrepõe a outra sem ordem garantida e o elemento perde a identidade
// que teste e ferramenta usam para achá-lo.
//
// ─── Decisões de acessibilidade, escritas porque são a parte difícil ────────
//
// 1. A RAIZ É LISTA ORDENADA. A ordem e a contagem das etapas são o conteúdo,
//    não decoração: `<ol>` as anuncia sozinho ("lista, 4 itens, item 2") e
//    poupa texto inventado. Um `<div role="group">` com rótulo diria menos e
//    custaria mais.
//
// 2. A ETAPA ATUAL LEVA `aria-current="step"`, e não `aria-current="true"`.
//    `step` é o token que a WAI-ARIA define para posição num processo; `true`
//    é o genérico, e diz "este é o atual" sem dizer atual do quê. É a mesma
//    escolha que `pagination` já faz nesta casa com `page`.
//
// 3. ESTADO NÃO DEPENDE SÓ DE COR (WCAG 1.4.1), e por dois caminhos ao mesmo
//    tempo, porque um só não cobre todo mundo:
//      • visual — a etapa concluída troca o NÚMERO por uma marca de
//        verificação. É forma, não matiz, e sobrevive a daltonismo e a tela
//        monocromática.
//      • programático — `labels.completed` e `labels.current` viram uma
//        palavra `.nds-sr-only` dentro do gatilho. Quem não vê a marca ouve
//        "Etapa concluída".
//    Os rótulos moram na RAIZ, e não no gatilho, porque o estado de uma etapa
//    MUDA quando o fluxo avança: uma palavra fixa por gatilho estaria errada
//    no passo seguinte.
//
// 4. INDICADOR E TRAÇO SÃO DESENHO, e levam `aria-hidden="true"`. O número do
//    indicador repete a posição que a lista já anuncia, e ler os dois faz o
//    leitor de tela dizer a mesma coisa duas vezes.
//
// 5. NÃO HÁ REGIÃO VIVA. Um indicador que se reanuncia a cada avanço atropela
//    a leitura do resto da tela. Quem anuncia o avanço é o painel que trocou
//    de conteúdo, e é para ele que a aplicação move o foco.
//
// 6. ETAPA INDISPONÍVEL É `disabled` DE VERDADE, e sai da ordem de tabulação.
//    Um botão focável que não leva a lugar nenhum é uma parada de foco que
//    gasta o tempo de quem navega por teclado sem entregar nada.
//
// 7. SEM ALTURA FIXA EM TEXTO (WCAG 1.4.4). O círculo do indicador tem
//    dimensão fixa de propósito — mas RELATIVA: `--spacing-8` é
//    `calc(var(--spacing-base) * 8)` com `--spacing-base: 0.25rem`, então o
//    círculo cresce com a densidade e com o tamanho de fonte do navegador.
//    Título e descrição vivem FORA dele e nunca são recortados.
//
// ─── Nome acessível do fluxo ────────────────────────────────────────────────
//
// `aria-label` NÃO é input: é atributo nativo escrito no `<ol>` por quem
// compõe. Criar um input homônimo daria dois jeitos de dizer a mesma coisa,
// com um deles vencendo em silêncio — e o atributo já chega ao DOM sem
// intermediário. A tabela de propriedades o documenta como atributo.

/** Estado derivado de uma etapa, comparada ao valor atual do fluxo. */
export type StepperState = 'inactive' | 'active' | 'completed';

/**
 * Palavras de estado lidas só por leitor de tela.
 *
 * Ausentes, nada é anunciado — e aí a diferença entre concluída e futura fica
 * só na marca de verificação, que é visual. A documentação cobra as duas.
 */
export interface StepperLabels {
  completed?: string;
  current?: string;
}

/**
 * Raiz do Stepper.
 *
 * Guarda o valor atual do fluxo e as palavras de estado. Cada etapa injeta esta
 * diretiva e DERIVA o próprio estado — não há escrita de fora para dentro, e
 * por isso não existe o desenho de duas fases que uma fábrica sem reatividade
 * precisa ter.
 */
@Directive({
  selector: 'ol[ndsStepper]',
  standalone: true,
  host: {
    class: 'nds-stepper',
    '[attr.data-slot]': '"stepper"',
    '[attr.data-value]': 'value()',
  },
})
export class NdsStepper {
  /** Número da etapa atual, contando de 1. */
  readonly value = input(1, { transform: numberAttribute });

  /** Palavras de estado do fluxo, lidas só por leitor de tela. */
  readonly labels = input<StepperLabels>({});

  /** Emitido com o número da etapa quando um gatilho disponível é acionado. */
  readonly stepSelect = output<number>();

  /**
   * Chamado pelo gatilho da etapa.
   *
   * A emissão mora aqui, e não no gatilho, porque `stepSelect` é contrato da
   * RAIZ: quem compõe liga `(stepSelect)` uma vez no `<ol>`, e não uma vez por
   * etapa. É a mesma superfície que a fábrica sem lib expõe com o ouvinte
   * delegado na raiz.
   */
  emitStepSelect(step: number): void {
    this.stepSelect.emit(step);
  }
}

/**
 * Uma etapa.
 *
 * `data-completed` reflete o INPUT, não o estado derivado: ele marca a etapa
 * que conta como concluída mesmo estando depois da atual, e é isso que a folha
 * e a auditoria leem ali. O estado resolvido vive em `data-state`.
 */
@Directive({
  selector: 'li[ndsStepperItem]',
  standalone: true,
  host: {
    class: 'nds-stepper-item',
    '[attr.data-slot]': '"stepper-item"',
    '[attr.data-step]': 'step()',
    '[attr.data-state]': 'state()',
    '[attr.data-completed]': 'completed() ? "" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
  },
})
export class NdsStepperItem {
  /** Número desta etapa, contando de 1. */
  readonly step = input.required<number, unknown>({ transform: numberAttribute });

  /** Conta como concluída mesmo estando depois da atual. */
  readonly completed = input(false, { transform: booleanAttribute });

  /** Indisponível: o gatilho sai da ordem de tabulação. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly root = inject(NdsStepper);

  /** Palavras de estado do fluxo — o gatilho as lê daqui, não de si mesmo. */
  readonly labels = this.root.labels;

  readonly state = computed<StepperState>(() => {
    const value = this.root.value();
    const step = this.step();
    if (this.completed() || step < value) return 'completed';
    return step === value ? 'active' : 'inactive';
  });

  /** Encaminha a seleção à raiz, que é quem expõe a saída. */
  select(): void {
    if (this.disabled()) return;
    this.root.emitStepSelect(this.step());
  }
}

/**
 * Controle da etapa.
 *
 * `type="button"` no host: dentro de um `<form>` — que é o caso de todo wizard
 * — um botão sem `type` é `submit`, e clicar numa etapa enviaria o formulário.
 *
 * O `<span class="nds-sr-only">` é o PRIMEIRO nó do template, antes da
 * projeção, para que a palavra de estado seja lida antes do rótulo da etapa.
 * Ele existe sempre; vazio quando a etapa ainda não foi alcançada.
 */
@Component({
  selector: 'button[ndsStepperTrigger]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<span class="nds-sr-only" data-slot="stepper-state-label">{{ stateLabel() }}</span
    ><ng-content />`,
  host: {
    class: 'nds-stepper-trigger',
    type: 'button',
    '[attr.data-slot]': '"stepper-trigger"',
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.disabled]': 'disabledAttr()',
    '(click)': 'onClick()',
  },
})
export class NdsStepperTrigger {
  protected readonly item = inject(NdsStepperItem);

  /**
   * Só a etapa atual carrega `aria-current`. Deixar o atributo para trás ao
   * avançar daria DOIS "atual" na mesma lista, que é pior do que nenhum.
   */
  protected readonly ariaCurrent = computed(() =>
    this.item.state() === 'active' ? 'step' : null,
  );

  /** `disabled` de verdade — o botão sai da ordem de tabulação (decisão 6). */
  protected readonly disabledAttr = computed(() => (this.item.disabled() ? '' : null));

  protected readonly stateLabel = computed(() => {
    const labels = this.item.labels();
    const state = this.item.state();
    if (state === 'completed') return labels.completed ?? '';
    if (state === 'active') return labels.current ?? '';
    return '';
  });

  protected onClick(): void {
    this.item.select();
  }
}

/**
 * Marca de verificação da etapa concluída.
 *
 * Os filhos nascem de `createElementNS` num `effect` porque cada ícone do
 * lucide é uma lista `[tag, attrs]` com tag variável, e template Angular exige
 * tag estática. Vir do pacote agnóstico, e não de um `d` copiado à mão, é o que
 * impede o desenho de congelar na versão do dia. Construir nós é imune a XSS:
 * não há `innerHTML` no caminho.
 *
 * `.nds-icon` fixa a marca em 1rem. Sem ela o `<svg>` sem `width`/`height`
 * cai no default de 100% e ocupa o círculo inteiro do indicador — e a folha
 * compartilhada não tem regra para o SVG de dentro dele. A classe é a mesma
 * que a referência de markup escreve, e é relativa: cresce com a fonte do
 * navegador junto com o resto.
 */
type LucideIconNode = [string, Record<string, string>];

const SVG_NS = 'http://www.w3.org/2000/svg';

@Component({
  selector: 'svg[ndsStepperCheck]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: SVG_NS,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    // `[attr.class]`, e não `class`: em SVG o `className` é `SVGAnimatedString`
    // e não aceita binding de classe — é a mesma saída do `NdsButtonIcon`.
    // Nenhuma outra diretiva escreve neste host, então não há disputa.
    '[attr.class]': '"nds-icon"',
    // Redundante com o `aria-hidden` do indicador que o contém, e de propósito:
    // a marca é desenho onde quer que esteja.
    'aria-hidden': 'true',
  },
})
export class NdsStepperCheck {
  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of Check as unknown as LucideIconNode[]) {
        const child = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

/**
 * Círculo numerado.
 *
 * `aria-hidden` porque o número repete a posição que a `<ol>` já anuncia
 * (decisão 4).
 *
 * `custom` troca o número por conteúdo de quem compõe. É input explícito, e não
 * detecção de conteúdo projetado: a projeção é resolvida em tempo de
 * compilação, então "tem filho?" não é pergunta que o componente possa fazer
 * antes de decidir o que renderizar.
 *
 * A `<ng-content>` fica FORA de qualquer `@if`, e é a única do componente. É a
 * forma que não tem como falhar em silêncio: projeção dentro de ramo condicional
 * é justamente onde o conteúdo já sumiu nesta casa, sem erro nenhum. Sem
 * `custom`, quem compõe não projeta nada e só o número (ou a marca) aparece.
 */
@Component({
  selector: 'span[ndsStepperIndicator]',
  standalone: true,
  imports: [NdsStepperCheck],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content />@if (!custom()) {
      @if (item.state() === 'completed') {
        <svg ndsStepperCheck></svg>
      } @else {
        {{ item.step() }}
      }
    }`,
  host: {
    class: 'nds-stepper-indicator',
    'aria-hidden': 'true',
    '[attr.data-slot]': '"stepper-indicator"',
    '[attr.data-custom]': 'custom() ? "" : null',
  },
})
export class NdsStepperIndicator {
  /** Conteúdo próprio no lugar do número e da marca de verificação. */
  readonly custom = input(false, { transform: booleanAttribute });

  protected readonly item = inject(NdsStepperItem);
}

/** Nome curto da etapa. */
@Directive({
  selector: 'span[ndsStepperTitle]',
  standalone: true,
  host: {
    class: 'nds-stepper-title',
    '[attr.data-slot]': '"stepper-title"',
  },
})
export class NdsStepperTitle {}

/** Texto de apoio da etapa. */
@Directive({
  selector: 'span[ndsStepperDescription]',
  standalone: true,
  host: {
    class: 'nds-stepper-description',
    '[attr.data-slot]': '"stepper-description"',
  },
})
export class NdsStepperDescription {}

/**
 * Traço até a próxima etapa.
 *
 * Mora DENTRO do item, depois do gatilho, como a folha documenta — e não entre
 * os itens. É isso que faz `.nds-stepper-item[data-state="completed"]
 * .nds-stepper-separator` alcançá-lo sem regra extra.
 */
@Directive({
  selector: 'div[ndsStepperSeparator]',
  standalone: true,
  host: {
    class: 'nds-stepper-separator',
    'aria-hidden': 'true',
    '[attr.data-slot]': '"stepper-separator"',
  },
})
export class NdsStepperSeparator {}

/** As sete partes — conveniência para o `imports` de quem compõe. */
export const NDS_STEPPER = [
  NdsStepper,
  NdsStepperItem,
  NdsStepperTrigger,
  NdsStepperIndicator,
  NdsStepperTitle,
  NdsStepperDescription,
  NdsStepperSeparator,
] as const;
