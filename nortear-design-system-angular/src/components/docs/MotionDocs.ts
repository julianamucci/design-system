import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { NdsFoundationPage } from './shared/FoundationPage';
import { NdsButton } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
// `motion.css` zera os `--duration-*` sob reduced motion, então tudo que é CSS
// obedece sozinho. O laço da mola é o único trecho que não passa por token — e
// por isso é o único que pergunta. Pergunta ao helper compartilhado, que também
// enxerga o override `data-reduced-motion` do toolbar do Storybook.
import { prefersReducedMotion } from '@/lib/motion';
import translations from '@shared/content/foundations/motion/translations.json';

/**
 * Motion e Animação — fundamento COM desenho próprio.
 *
 * Duas amostras: a escada de durações e três demonstrações do que só se resolve
 * fora do CSS (mola física, cascata, saída animada).
 *
 * ─── Nada se move sozinho ───────────────────────────────────────────────────
 *
 * Toda animação desta página começa por INTERAÇÃO. Amostra que roda em laço
 * muda a foto do Chromatic a cada rodada e faz o axe medir contraste de um
 * elemento no meio do fade — o famoso 1.0 que parece paleta ruim e é um
 * elemento em transição. Por isso:
 *   · a escada só desloca quando `reproduzido()` vira true;
 *   · a classe da cascata só é aplicada DEPOIS do primeiro clique em
 *     Reproduzir (na primeira pintura os itens estão parados e opacos);
 *   · o `animate.enter` do presence nasce vazio e só ganha classe depois de o
 *     leitor alternar pela primeira vez.
 *
 * ─── Mecanismo nativo da stack ──────────────────────────────────────────────
 *
 * Cada stack demonstra o recurso com o que ela tem em casa. Aqui não entra
 * biblioteca: `animate.enter` / `animate.leave` são do próprio Angular (o
 * framework aplica a classe e SEGURA a remoção do nó até a animação acabar), a
 * cascata é `animation-delay` por item, e a mola é um integrador de ~15 linhas
 * em `requestAnimationFrame`.
 *
 * `prefers-reduced-motion` sai de graça no CSS — `motion.css` zera os
 * `--duration-*` — e é conferido à mão no único trecho que não passa por
 * token: o laço da mola, que devolve o elemento ao repouso num quadro só.
 */
const { t } = useTranslation(translations as Record<string, unknown>);

/** Um degrau da escada de durações. `token` alimenta o `data-duration` do CSS. */
interface DurationDegrau {
  token: string;
  rotulo: string;
}

const ESCADA: DurationDegrau[] = [
  { token: 'instant', rotulo: 'instant — 0ms' },
  { token: 'fast', rotulo: 'fast — 120ms' },
  { token: 'base', rotulo: 'base — 200ms' },
  { token: 'moderate', rotulo: 'moderate — 320ms' },
  { token: 'slow', rotulo: 'slow — 500ms' },
  { token: 'stately', rotulo: 'stately — 800ms' },
];

/** Item da cascata, com o atraso já pronto como valor CSS. */
interface ItemDaCascata {
  rotulo: string;
  delay: string;
}

const CASCATA_ITEMS: ItemDaCascata[] = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'].map(
  (rotulo, i) => ({ rotulo, delay: `${i * 60}ms` }),
);

// ─── Parâmetros da mola ──────────────────────────────────────────────────────
// damping 40 é o amortecimento crítico para stiffness 400 (2·√400) com massa 1:
// o elemento volta ao centro sem passar do ponto. Mesmos números das outras
// stacks — trocar um sem o outro descaracteriza o movimento.
const RIGIDEZ = 400;
const AMORTECIMENTO = 40;
/** Abaixo disto (px e px/s) o olho não vê diferença — o laço para. */
const REST_POSITION = 0.5;
const REST_SPEED = 5;
/** Teto do passo de integração: uma aba em segundo plano devolve dt gigante. */
const STEP_MAXIMO = 1 / 30;

const CODE_MOLA = `// zero dependência: integrador de mola em requestAnimationFrame.
// damping 40 = amortecimento crítico para stiffness 400 (2·raiz(400)) com
// massa 1 — o elemento volta ao centro sem passar do ponto.
const aceleracao = -400 * x - 40 * v;
v += aceleracao * dt;
x += v * dt;

// O deslocamento chega ao CSS por custom property, nunca por style inline:
// <div class="nds-motion-drag" [style.--nds-drag-x]="deslocamentoXcss()">
// e o CSS faz transform: translate(var(--nds-drag-x, 0px), ...).`;

const CODIGO_CASCATA = `<!-- A chave de track muda a cada clique: o @for recria os <li> e o
     navegador reinicia a animação CSS do zero. O atraso é um valor por
     item, então vai por custom property. -->
@for (item of itens; track execucao() + item.rotulo) {
  <li class="nds-motion-stagger-item" [style.--nds-stagger-delay]="item.atraso">
    {{ item.rotulo }}
  </li>
}

/* docs-specimens.css */
.nds-motion-stagger-item {
  animation: nds-motion-stagger-in var(--duration-base) var(--ease-entrance) both;
  animation-delay: var(--nds-stagger-delay, 0ms);
}`;

const CODIGO_PRESENCE = `<!-- animate.enter / animate.leave são do próprio Angular: ele aplica a
     classe e SEGURA a remoção do nó até a animação terminar. Sem biblioteca,
     sem timer manual, e o visual inteiro fica no CSS compartilhado. -->
@if (visivel()) {
  <div
    animate.enter="nds-motion-presence-enter"
    animate.leave="nds-motion-presence-leave"
  >…</div>
}`;

@Component({
  selector: 'nds-motion-docs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NdsFoundationPage, NdsButton],
  template: `
    <nds-foundation-page slug="motion" [translations]="translations">
      <!-- ── Escada de durações ─────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('specimens.title') }}</h2>
          <p class="nds-text-body">{{ t('specimens.subtitle') }}</p>
        </div>

        <div
          class="nds-stack nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft"
          data-spacing="sm"
        >
          <div>
            <button ndsButton variant="outline" size="sm" (click)="alternarEscada()">
              {{ t('specimens.advanced.labels.replay') }}
            </button>
          </div>
          @for (degrau of escada; track degrau.token) {
            <div class="nds-bg-muted-30 nds-rounded-lg nds-p-1 nds-overflow-hidden">
              <div
                class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-sm nds-px-4 nds-py-1 nds-text-caption nds-whitespace-nowrap nds-motion-ladder-chip"
                [attr.data-duration]="degrau.token"
                [attr.data-played]="reproduzido()"
              >
                {{ degrau.rotulo }}
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ── Recursos avançados ─────────────────────────────────────────── -->
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('specimens.advanced.title') }}</h2>
          <p class="nds-text-body">{{ t('specimens.advanced.subtitle') }}</p>
        </div>

        <!-- Mola física com gesto de arrastar -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.advanced.spring.title') }}</h3>
          <p class="nds-text-body">{{ t('specimens.advanced.spring.desc') }}</p>
          <div
            class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-cluster nds-motion-demo"
            data-align="center"
            data-justify="center"
            data-clip="true"
          >
            <div
              class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption nds-font-medium nds-cursor-pointer nds-motion-drag"
              [style.--nds-drag-x]="deslocamentoXcss()"
              [style.--nds-drag-y]="deslocamentoYcss()"
              [style.--nds-drag-scale]="escalaCss()"
              (pointerdown)="aoPressionar($event)"
              (pointermove)="aoMover($event)"
              (pointerup)="aoSoltar()"
              (pointercancel)="aoSoltar()"
            >
              {{ t('specimens.advanced.labels.drag') }}
            </div>
          </div>
          <pre class="nds-code-block"><code>{{ codigoDaMola }}</code></pre>
        </div>

        <!-- Entrada em cascata -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.advanced.stagger.title') }}</h3>
          <p class="nds-text-body">{{ t('specimens.advanced.stagger.desc') }}</p>
          <div
            class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack nds-motion-demo"
            data-spacing="sm"
          >
            <div>
              <button ndsButton variant="outline" size="sm" (click)="reproduzirCascata()">
                {{ t('specimens.advanced.labels.replay') }}
              </button>
            </div>
            <ul class="nds-cluster nds-list-none" data-spacing="sm">
              <!-- A chave de track carrega a execução: mudá-la recria os <li>,
                   e é a recriação que reinicia a animação CSS. -->
              @for (item of itensDaCascata; track execucaoDaCascata() + item.rotulo) {
                <li
                  [class]="classeDoItemDaCascata()"
                  [style.--nds-stagger-delay]="item.delay"
                >
                  {{ item.rotulo }}
                </li>
              }
            </ul>
          </div>
          <pre class="nds-code-block"><code>{{ codigoDaCascata }}</code></pre>
        </div>

        <!-- Animação de saída -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">
            {{ t('specimens.advanced.presence.title') }}
          </h3>
          <p class="nds-text-body">{{ t('specimens.advanced.presence.desc') }}</p>
          <div
            class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack nds-motion-demo"
            data-spacing="sm"
            data-align="center"
          >
            <button ndsButton variant="outline" size="sm" (click)="alternarPresenca()">
              {{ rotuloDaPresenca() }}
            </button>
            @if (presencaVisivel()) {
              <div
                class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption"
                [animate.enter]="classeDeEntradaDaPresenca()"
                animate.leave="nds-motion-presence-leave"
              >
                Presence
              </div>
            }
          </div>
          <pre class="nds-code-block"><code>{{ codigoDaPresenca }}</code></pre>
        </div>

        <p class="nds-text-body nds-accent-start">{{ t('specimens.advanced.note') }}</p>

        <!-- Toque e mobile -->
        <div class="nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-medium">{{ t('specimens.advanced.touch.title') }}</h3>
          <ul class="nds-stack nds-list-none" data-spacing="md">
            <li class="nds-accent-start nds-text-body">{{ t('specimens.advanced.touch.tap') }}</li>
            <li class="nds-accent-start nds-text-body">
              {{ t('specimens.advanced.touch.hover') }}
            </li>
            <li class="nds-accent-start nds-text-body">{{ t('specimens.advanced.touch.drag') }}</li>
          </ul>
        </div>
      </section>
    </nds-foundation-page>
  `,
})
export class NdsMotionDocs implements OnDestroy {
  protected readonly translations = translations as Record<string, unknown>;
  protected readonly t = t;
  protected readonly escada = ESCADA;
  protected readonly itensDaCascata = CASCATA_ITEMS;
  protected readonly codigoDaMola = CODE_MOLA;
  protected readonly codigoDaCascata = CODIGO_CASCATA;
  protected readonly codigoDaPresenca = CODIGO_PRESENCE;

  // ─── Escada de durações ───────────────────────────────────────────────────

  protected readonly reproduzido = signal(false);

  protected alternarEscada(): void {
    this.reproduzido.update((v) => !v);
  }

  // ─── Cascata ──────────────────────────────────────────────────────────────

  protected readonly execucaoDaCascata = signal(0);

  /**
   * A classe da animação só entra a partir da primeira execução. Enquanto ela
   * é 0 os itens nascem parados e opacos — é essa a imagem que o Chromatic
   * fotografa e que o axe mede.
   */
  protected readonly classeDoItemDaCascata = computed(() => {
    const base = 'nds-bg-muted-50 nds-rounded-md nds-px-4 nds-py-2 nds-text-caption';
    return this.execucaoDaCascata() > 0 ? `${base} nds-motion-stagger-item` : base;
  });

  protected reproduzirCascata(): void {
    this.execucaoDaCascata.update((n) => n + 1);
  }

  // ─── Presence ─────────────────────────────────────────────────────────────

  protected readonly presencaVisivel = signal(true);
  private readonly presencaAlternada = signal(false);

  protected readonly rotuloDaPresenca = computed(() =>
    this.presencaVisivel()
      ? t('specimens.advanced.labels.hide')
      : t('specimens.advanced.labels.show'),
  );

  /** Vazio até o primeiro clique: sem isso a entrada tocaria já na montagem. */
  protected readonly classeDeEntradaDaPresenca = computed(() =>
    this.presencaAlternada() ? 'nds-motion-presence-enter' : '',
  );

  protected alternarPresenca(): void {
    this.presencaAlternada.set(true);
    this.presencaVisivel.update((v) => !v);
  }

  // ─── Mola física com gesto de arrastar ────────────────────────────────────

  private readonly offsetX = signal(0);
  private readonly offsetY = signal(0);
  private readonly escala = signal(1);

  // O CSS lê custom properties, não `transform` inline: o valor é escolha de
  // quem arrasta (como `--ratio` no AspectRatio), a forma é do CSS compartilhado.
  protected readonly deslocamentoXcss = computed(() => `${this.offsetX()}px`);
  protected readonly deslocamentoYcss = computed(() => `${this.offsetY()}px`);
  protected readonly escalaCss = computed(() => String(this.escala()));

  private arrastando = false;
  private velocidadeX = 0;
  private velocidadeY = 0;
  private instanteAnterior = 0;
  private nextFrame: number | undefined;

  protected aoPressionar(evento: PointerEvent): void {
    const alvo = evento.target as HTMLElement;
    alvo.setPointerCapture(evento.pointerId);
    this.pararMola();
    this.arrastando = true;
    this.escala.set(1.05);
    this.velocidadeX = 0;
    this.velocidadeY = 0;
    this.instanteAnterior = performance.now();
  }

  protected aoMover(evento: PointerEvent): void {
    if (!this.arrastando) return;
    this.offsetX.update((x) => x + evento.movementX);
    this.offsetY.update((y) => y + evento.movementY);

    const agora = performance.now();
    const dt = Math.max(agora - this.instanteAnterior, 1);
    // Média móvel simples — o `pointermove` cru é ruidoso demais para virar
    // velocidade inicial da mola.
    this.velocidadeX = 0.6 * this.velocidadeX + 0.4 * (evento.movementX / dt) * 1000;
    this.velocidadeY = 0.6 * this.velocidadeY + 0.4 * (evento.movementY / dt) * 1000;
    this.instanteAnterior = agora;
  }

  protected aoSoltar(): void {
    if (!this.arrastando) return;
    this.arrastando = false;
    this.escala.set(1);

    // Gesto parado antes de soltar → sem velocidade residual.
    if (performance.now() - this.instanteAnterior > 100) {
      this.velocidadeX = 0;
      this.velocidadeY = 0;
    }

    if (prefersReducedMotion()) {
      this.repousar();
      return;
    }
    this.instanteAnterior = performance.now();
    this.nextFrame = requestAnimationFrame(this.passoDaMola);
  }

  /**
   * Um passo do integrador (Euler semi-implícito).
   *
   * Arrow function porque o `requestAnimationFrame` chama sem `this`.
   */
  private readonly passoDaMola = (agora: number): void => {
    const dt = Math.min((agora - this.instanteAnterior) / 1000, STEP_MAXIMO);
    this.instanteAnterior = agora;

    const x = this.offsetX();
    const y = this.offsetY();
    // Massa 1: a aceleração é a própria força.
    this.velocidadeX += (-RIGIDEZ * x - AMORTECIMENTO * this.velocidadeX) * dt;
    this.velocidadeY += (-RIGIDEZ * y - AMORTECIMENTO * this.velocidadeY) * dt;
    const nextX = x + this.velocidadeX * dt;
    const nextY = y + this.velocidadeY * dt;

    const parado =
      Math.abs(nextX) < REST_POSITION &&
      Math.abs(nextY) < REST_POSITION &&
      Math.abs(this.velocidadeX) < REST_SPEED &&
      Math.abs(this.velocidadeY) < REST_SPEED;

    if (parado) {
      this.repousar();
      return;
    }

    this.offsetX.set(nextX);
    this.offsetY.set(nextY);
    this.nextFrame = requestAnimationFrame(this.passoDaMola);
  };

  /** Zera posição e velocidade — o elemento volta exatamente ao centro. */
  private repousar(): void {
    this.offsetX.set(0);
    this.offsetY.set(0);
    this.velocidadeX = 0;
    this.velocidadeY = 0;
    this.nextFrame = undefined;
  }

  private pararMola(): void {
    if (this.nextFrame !== undefined) {
      cancelAnimationFrame(this.nextFrame);
      this.nextFrame = undefined;
    }
  }

  ngOnDestroy(): void {
    this.pararMola();
  }
}
