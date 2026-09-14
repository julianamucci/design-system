/**
 * Transforms do painel Code do Progress.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. As stories declaram os seus valores em `args`, e
 * a transform do meta cascateia e monta a composição a partir deles — barra
 * solta, barra com rótulo, lista de barras ou cartão. A única que pede outra
 * transform é a do texto anunciado, porque uma função não se imprime a partir
 * de `args`.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type ProgressVariant = 'success' | 'destructive';

/** Uma barra, com o texto opcional que a acompanha acima da trilha. */
export type ProgressItem = {
  /** Omitido ou `null` é o modo indeterminado — sem estimativa de conclusão. */
  value?: number | null;
  variant?: ProgressVariant;
  'aria-label': string;
  /** Rótulo visível à esquerda, acima da trilha. */
  label?: string;
  /** Texto à direita no lugar do percentual (a etapa, num assistente). */
  valueText?: string;
  /** Mostra o percentual à direita, numa região `polite`. */
  showValue?: boolean;
  /** Rótulo em peso médio. */
  strongLabel?: boolean;
};

/** Cartão ao redor das barras; `busy` o declara ocupado para o leitor de tela. */
export type ProgressCard = { title: string; meta: string; busy?: boolean };

export type ProgressArgs = ProgressItem & {
  min?: number;
  max?: number;
  getAriaValueText?: (value: number | null, min: number, max: number) => string;
  /** Demonstra o valor subindo sozinho: no snippet vira `$state` + `$effect`. */
  animated?: boolean;
  intervalMs?: number;
  step?: number;
  /** Várias barras; quando existe, as chaves de barra do topo são ignoradas. */
  items?: ProgressItem[];
  spacing?: 'xs' | 'sm' | 'md';
  card?: ProgressCard;
};

const IMPORT = `import { Progress } from "@/components/ui/progress";`;

function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `${prefix}${line}` : line))
    .join('\n');
}

/** O relógio que faz a barra andar na composição de upload. */
function animatedState(intervalMs: number, step: number, max: number): string {
  return `let value = $state(0);

$effect(() => {
  const id = setInterval(() => {
    value = value >= ${max} ? 0 : value + ${step};
  }, ${intervalMs});
  return () => clearInterval(id);
});`;
}

/**
 * A barra. O valor OMITIDO não escreve `value`: é assim que se pede o modo
 * indeterminado, e escrever `value={null}` ali ensinaria que é preciso.
 */
function barMarkup(item: ProgressItem, a: ProgressArgs, animated: boolean): string {
  const value = animated
    ? 'value={value}'
    : item.value === undefined
      ? ''
      : `value={${item.value === null ? 'null' : item.value}}`;
  return `<Progress${attrs(
    value,
    a.min === undefined || a.min === 0 ? '' : `min={${a.min}}`,
    a.max === undefined || a.max === 100 ? '' : `max={${a.max}}`,
    item.variant ? `data-variant="${item.variant}"` : '',
    // Não há slot de rótulo: o nome acessível da barra vem sempre daqui.
    `aria-label="${item['aria-label']}"`,
  )} />`;
}

function entryMarkup(item: ProgressItem, a: ProgressArgs, animated: boolean): string {
  const bar = barMarkup(item, a, animated);
  const shown = item.valueText
    ? item.valueText
    : !item.showValue
      ? undefined
      : animated
        ? '{value}%'
        : typeof item.value === 'number'
          ? `${item.value}%`
          : undefined;
  if (!item.label && !shown) return bar;

  const lines = [
    item.label
      ? `<span class="${item.strongLabel ? 'nds-text-foreground nds-font-medium' : 'nds-text-foreground'}">${item.label}</span>`
      : '',
    // `polite` e não `assertive`: a cada passo o leitor seria interrompido.
    shown
      ? `<span class="${item.valueText ? 'nds-text-muted-foreground' : 'nds-text-muted-foreground nds-tabular-nums'}" aria-live="polite">${shown}</span>`
      : '',
  ].filter(Boolean);

  return `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster nds-text-body" data-justify="between">
${indent(lines.join('\n'), '    ')}
  </div>
  ${bar}
</div>`;
}

/**
 * Forma canônica, montada dos `args`: serve o meta dos quatro arquivos de story.
 * Sem args, a barra nomeada pela operação e sem valor — o indeterminado.
 */
export function progressSource(_generated?: string, ctx?: { args?: Partial<ProgressArgs> }): string {
  const a: ProgressArgs = { 'aria-label': 'Progresso do upload', ...ctx?.args };
  const animated = Boolean(a.animated) && !a.items;
  const list = a.items ?? [a];
  const entries = list.map((item) => entryMarkup(item, a, animated));

  let markup: string;
  if (a.card) {
    const busy = a.card.busy ? ' role="status" aria-busy="true"' : '';
    markup = `<div class="nds-stack nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground"${busy} data-spacing="sm">
  <div class="nds-text-body nds-font-medium">${a.card.title}</div>
  <div class="nds-text-caption nds-text-muted-foreground">${a.card.meta}</div>
${indent(entries.join('\n'), '  ')}
</div>`;
  } else if (entries.length > 1) {
    markup = `<div class="nds-stack" data-spacing="${a.spacing ?? 'sm'}">
${indent(entries.join('\n'), '  ')}
</div>`;
  } else {
    markup = entries[0]!;
  }

  const script = animated
    ? `${IMPORT}\n\n${animatedState(a.intervalMs ?? 400, a.step ?? 5, a.max ?? 100)}`
    : IMPORT;
  return svelteSnippet(script, markup);
}

/**
 * O texto anunciado no lugar do percentual, com a assinatura do wrapper — valor
 * já limitado, mínimo e máximo.
 *
 * A função mora no `<script>` do exemplo, e não inline na marcação: assim todo
 * nome que a marcação liga é declarado dentro do bloco que quem copia leva.
 */
export function progressValueTextSource(): string {
  return svelteSnippet(
    `${IMPORT}

function filesText(value: number | null, min: number, max: number): string {
  return value === null ? 'Contando arquivos' : \`\${value} de \${max} arquivos\`;
}`,
    `<Progress value={42} aria-label="Processamento de arquivos" getAriaValueText={filesText} />`,
  );
}
