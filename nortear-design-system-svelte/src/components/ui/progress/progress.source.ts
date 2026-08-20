/**
 * Transforms do painel Code do Progress.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Todas as stories do componente declaram os seus
 * valores em `args`, então a transform do meta cascateia e monta a composição
 * certa a partir deles — não há override por story aqui.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type ProgressArgs = {
  /** `null` é o modo indeterminado — sem estimativa de conclusão. */
  value: number | null;
  max: number;
  variant?: 'success' | 'destructive';
  class?: string;
  'aria-label': string;
  /** Demonstra o valor subindo sozinho: no snippet vira `$state` + `$effect`. */
  animated: boolean;
  intervalMs: number;
  step: number;
  showLabel: boolean;
  label: string;
  showValue: boolean;
};

const IMPORT = `import { Progress } from "@/components/ui/progress";`;

/** O relógio que faz a barra andar na composição de upload. */
function estadoAnimado(intervalMs: number, passo: number, max: number): string {
  return `let valor = $state(0);

$effect(() => {
  const id = setInterval(() => {
    valor = valor >= ${max} ? 0 : valor + ${passo};
  }, ${intervalMs});
  return () => clearInterval(id);
});`;
}

/**
 * Forma canônica: uma barra nomeada pela operação que ela mede. Serve o meta
 * dos quatro arquivos de story do componente.
 */
export function progressSource(_gerado?: string, ctx?: { args?: Partial<ProgressArgs> }): string {
  const a: ProgressArgs = {
    value: 42,
    max: 100,
    variant: undefined,
    class: '',
    'aria-label': 'Progresso do upload',
    animated: false,
    intervalMs: 500,
    step: 5,
    showLabel: false,
    label: '',
    showValue: false,
    ...ctx?.args,
  };

  const valor = a.animated ? '{valor}' : `{${a.value === null ? 'null' : a.value}}`;
  const props = attrs(
    `value=${valor}`,
    a.max === 100 ? '' : `max={${a.max}}`,
    a.variant ? `data-variant="${a.variant}"` : '',
    a.class ? `class="${a.class}"` : '',
    // Não há slot de rótulo: o nome acessível da barra vem sempre daqui.
    `aria-label="${a['aria-label']}"`,
  );
  const barra = `<Progress${props} />`;

  const script = a.animated
    ? `${IMPORT}\n\n${estadoAnimado(a.intervalMs, a.step, a.max)}`
    : IMPORT;

  // Sem rótulo nem porcentagem a barra é o exemplo inteiro; a linha de cima só
  // existe quando há texto para acomodar.
  if (!a.showLabel && !a.showValue) return svelteSnippet(script, barra);

  const percentual = a.animated
    ? '{valor}%'
    : `${a.value === null ? '' : Math.round((100 * a.value) / (a.max || 1))}%`;

  const linhaDeTexto = [
    a.showLabel ? `    <span class="nds-font-medium nds-text-foreground">${a.label}</span>` : '',
    // `polite` e não `assertive`: a cada passo do upload o leitor seria
    // interrompido no meio da frase anterior.
    a.showValue && a.value !== null
      ? `    <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">${percentual}</span>`
      : '',
  ].filter(Boolean);

  return svelteSnippet(
    script,
    `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
${linhaDeTexto.join('\n')}
  </div>
  ${barra}
</div>`,
  );
}
