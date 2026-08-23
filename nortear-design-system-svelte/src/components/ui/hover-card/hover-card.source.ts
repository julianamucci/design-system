/**
 * Transforms do painel Code do HoverCard.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O gatilho aparece SEMPRE dentro de uma frase. É o uso real do componente — o
 * cartão enriquece um texto que já existe — e é o que mantém o alvo em linha
 * dispensado do mínimo de 24px. Um snippet com o gatilho solto no vazio
 * ensinaria a colar um "passe o mouse aqui" no meio da página.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type HoverCardVariant =
  | 'default'
  | 'withDelay'
  | 'userProfile'
  | 'linkPreview'
  | 'definition'
  | 'metric'
  | 'extraClass';

export type HoverCardArgs = {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  openDelay: number;
  closeDelay: number;
  defaultOpen: boolean;
  /** Abertura vinda de fora — a prop ligável da raiz. */
  open: boolean;
  triggerLabel: string;
  href: string;
  /** Nome acessível explícito do painel. Sem ele, sai do texto do gatilho. */
  label: string;
  variant: HoverCardVariant;
};

const IMPORT = `import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";`;

/** Empurra o miolo para dentro do `Content`. */
function indentar(markup: string, level: number): string {
  const espacos = ' '.repeat(level);
  return markup
    .split('\n')
    .map((line) => (line.trim() ? `${espacos}${line}` : line))
    .join('\n');
}

/**
 * Os gatilhos que não navegam são BOTÃO: não há para onde ir, e o glossário
 * continua sendo o caminho alternativo obrigatório.
 */
const TRIGGERS_BUTTON: HoverCardVariant[] = ['definition', 'metric'];

const MIOLOS: Record<HoverCardVariant, string> = {
  default: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Espera padrão: 600ms para abrir e 300ms para fechar.
  </p>
</div>`,

  withDelay: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Espera de 150ms para abrir e 100ms para fechar.
  </p>
</div>`,

  userProfile: `<div class="nds-cluster" data-spacing="sm" data-align="start">
  <div
    class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
    data-align="center"
    data-justify="center"
    aria-hidden="true"
  >
    JS
  </div>
  <div class="nds-stack" data-spacing="xs">
    <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
    <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
  </div>
</div>`,

  linkPreview: `<div class="nds-stack" data-spacing="sm">
  <div
    class="nds-cluster nds-text-caption nds-text-muted-foreground"
    data-align="center"
    data-spacing="xs"
  >
    <span class="nds-rounded-sm nds-bg-muted nds-px-1" aria-hidden="true">D</span>
    <span class="nds-truncate">design-system.dev/overlays</span>
  </div>
  <p class="nds-text-body nds-font-medium nds-leading-none">Guia de overlays acessíveis</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Quando usar tooltip, popover e cartão de hover — e o que cada um exige de teclado.
  </p>
</div>`,

  definition: `<div class="nds-stack" data-spacing="xs">
  <p class="nds-text-body nds-font-medium nds-leading-none">WCAG 2.2 nível AA</p>
  <p class="nds-text-caption nds-text-muted-foreground">
    Diretrizes de acessibilidade para conteúdo web — contraste mínimo de 4.5:1,
    operação por teclado e alvo de toque de 24px.
  </p>
</div>`,

  metric: `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster" data-justify="between" data-align="baseline" data-spacing="sm">
    <p class="nds-text-body nds-font-medium">Largest Contentful Paint</p>
    <span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>
  </div>
  <p class="nds-text-caption nds-text-muted-foreground">
    Tempo até o maior elemento visível aparecer. Bom até 2,5s; ruim acima de 4s.
  </p>
</div>`,

  // A classe extra troca a largura de UMA instância; o miolo é o mesmo do perfil.
  extraClass: `<div class="nds-cluster" data-spacing="sm" data-align="start">
  <div
    class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium"
    data-align="center"
    data-justify="center"
    aria-hidden="true"
  >
    JS
  </div>
  <div class="nds-stack" data-spacing="xs">
    <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
    <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
  </div>
</div>`,
};

/** Forma canônica: o gatilho no meio de uma frase e o cartão preso a ele. */
export function hoverCardSource(_gerado?: string, ctx?: { args?: Partial<HoverCardArgs> }): string {
  const {
    side = 'bottom',
    align = 'center',
    sideOffset = 4,
    openDelay = 600,
    closeDelay = 300,
    defaultOpen = false,
    open,
    triggerLabel = '@joana',
    href = '/users/joana',
    label = '',
    variant = 'default',
  } = ctx?.args ?? {};

  const controlled = open !== undefined;

  // Estado de fora e abertura inicial não convivem: com `bind:open`, quem manda
  // é o estado, e escrever `defaultOpen` ao lado duplicaria a fonte da verdade.
  let abertura = '';
  if (controlled) abertura = 'bind:open={aberto}';
  else if (defaultOpen) abertura = 'defaultOpen';

  const rootProps = attrs(
    openDelay === 600 ? '' : `openDelay={${openDelay}}`,
    closeDelay === 300 ? '' : `closeDelay={${closeDelay}}`,
    abertura,
  );

  const contentProps = attrs(
    side === 'bottom' ? '' : `side="${side}"`,
    align === 'center' ? '' : `align="${align}"`,
    sideOffset === 4 ? '' : `sideOffset={${sideOffset}}`,
    variant === 'extraClass' ? 'class="nds-w-md nds-text-center"' : '',
    label ? `aria-label="${label}"` : '',
  );

  const trigger = TRIGGERS_BUTTON.includes(variant)
    ? `<button type="button" {...props}>${triggerLabel}</button>`
    : `<a href="${href}" {...props}>${triggerLabel}</a>`;

  return svelteSnippet(
    controlled ? `${IMPORT}\n\nlet aberto = $state(${open ?? false});` : IMPORT,
    `<p class="nds-text-body nds-max-w-sm">
  Comentário de
  <HoverCard${rootProps}>
    <HoverCardTrigger>
      {#snippet child({ props })}
        ${trigger}
      {/snippet}
    </HoverCardTrigger>
    <HoverCardContent${contentProps}>
${indentar(MIOLOS[variant] ?? MIOLOS.default, 6)}
    </HoverCardContent>
  </HoverCard>
  há 2 horas.
</p>`,
  );
}

// ─── Overrides por story ──────────────────────────────────────────────────────
//
// As stories de composição nascem abertas para a captura do Chromatic. Isso é
// andaime da foto, não lição: um cartão de hover que já nasce aberto é o oposto
// do que o componente promete. Os overrides abaixo reaproveitam a mesma
// transform sem o estado de abertura.

/** Variants/Default — a espera padrão, que não se escreve no markup. */
export function hoverCardWaitDefaultSource(): string {
  return hoverCardSource('', { args: { variant: 'default' } });
}

/** Compositions/UserProfile — a menção que revela avatar, nome e uma métrica curta. */
export function hoverCardPerfilSource(): string {
  return hoverCardSource('', { args: { variant: 'userProfile' } });
}

/** Compositions/LinkPreview — origem, título e descrição do destino. */
export function hoverCardPreviaDeLinkSource(): string {
  return hoverCardSource('', {
    args: {
      variant: 'linkPreview',
      triggerLabel: 'design-system.dev',
      href: 'https://design-system.dev',
    },
  });
}

/** Compositions/TermDefinition — a sigla explicada, com gatilho que não navega. */
export function hoverCardDefinicaoSource(): string {
  return hoverCardSource('', {
    args: {
      variant: 'definition',
      triggerLabel: 'WCAG 2.2 AA',
      label: 'Definição de WCAG 2.2 AA',
    },
  });
}

/** Compositions/ExplainedMetric — o valor de painel com o nome inteiro e os limiares. */
export function hoverCardMetricaSource(): string {
  return hoverCardSource('', {
    args: {
      variant: 'metric',
      triggerLabel: 'LCP 1.8s',
      label: 'Explicação da métrica LCP',
    },
  });
}

/** Compositions/ExtraPanelClass — a largura de uma instância só, pela classe extra. */
export function hoverCardClassNameExtraSource(): string {
  return hoverCardSource('', { args: { variant: 'extraClass' } });
}

/**
 * Compositions/Sides — os quatro lados de abertura.
 *
 * O lado é uma PREFERÊNCIA: sem espaço, o cartão vira para o oposto do mesmo
 * eixo. O respiro em volta de cada gatilho é o que dá a ele para onde ir, e por
 * isso continua no snippet.
 */
export function hoverCardLadosSource(): string {
  return svelteSnippet(
    `${IMPORT}

const LADOS = [
  { rotulo: "acima", side: "top" },
  { rotulo: "abaixo", side: "bottom" },
  { rotulo: "esquerda", side: "left" },
  { rotulo: "direita", side: "right" },
] as const;`,
    `<div class="nds-grid nds-max-w-lg" data-cols="2" data-spacing="lg">
  {#each LADOS as lado (lado.side)}
    <p class="nds-text-body nds-p-8">
      Abre
      <HoverCard>
        <HoverCardTrigger>
          {#snippet child({ props })}
            <button type="button" {...props}>{lado.rotulo}</button>
          {/snippet}
        </HoverCardTrigger>
        <HoverCardContent side={lado.side} aria-label="Cartão {lado.rotulo} do gatilho">
          <p class="nds-text-caption">Lado preferido: {lado.rotulo}.</p>
        </HoverCardContent>
      </HoverCard>
      do gatilho.
    </p>
  {/each}
</div>`,
  );
}
