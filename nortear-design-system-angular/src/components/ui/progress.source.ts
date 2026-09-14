/**
 * Transforms do painel Code do Progress.
 *
 * Módulo à parte porque a guarda `source-snippets.test.ts` só CHAMA o que um
 * `*.source.ts` exporta. Enquanto o construtor era função local da story, o
 * texto que o leitor copia não passava por portão algum.
 *
 * Um construtor por story (ou por grupo com o MESMO markup). O que todo snippet
 * ensina:
 *
 * - as três camadas da barra — raiz, trilha e indicador;
 * - o nome acessível, que aqui não é enfeite: sem ele o leitor anuncia um
 *   progresso sem dizer de quê. Vem de `aria-label`, ou do `ndsProgressLabel`
 *   quando a peça está presente;
 * - valor desconhecido é valor OMITIDO (ou `null`), nunca zero;
 * - quem mostra o valor ao lado da barra o põe em região `polite`, nunca
 *   `assertive`.
 */
export type ProgressArgs = {
  value: number | null;
  min: number;
  max: number;
  variant: '' | 'success' | 'destructive';
  ariaLabel: string;
};

type BarOptions = {
  /** `undefined` omite o valor; `null` o escreve explicitamente. */
  value?: number | null;
  min?: number;
  max?: number;
  variant?: '' | 'success' | 'destructive';
  ariaLabel?: string;
  /** Liga o formatador do texto anunciado a um membro da classe. */
  valueTextMember?: string;
  /** Rótulo pela PEÇA — dispensa o `aria-label`. */
  label?: string;
};

type LabeledOptions = {
  value: number;
  label: string;
  ariaLabel: string;
  variant?: 'success' | 'destructive';
  /** O que a região `polite` mostra; ausente, o percentual. */
  announced?: string;
  labelClass?: string;
};

const IMPORT = "import { NDS_PROGRESS } from '@/components/ui/progress';";

function indent(block: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line ? `${pad}${line}` : line))
    .join('\n');
}

/** Uma barra. Só o que difere do padrão entra: snippet que repete padrão ensina ruído. */
function bar(o: BarOptions): string {
  const attrs = [
    'ndsProgress',
    o.value === undefined ? '' : `[value]="${o.value === null ? 'null' : o.value}"`,
    o.min !== undefined && o.min !== 0 ? `[min]="${o.min}"` : '',
    o.max !== undefined && o.max !== 100 ? `[max]="${o.max}"` : '',
    o.variant ? `data-variant="${o.variant}"` : '',
    o.label ? '' : `aria-label="${o.ariaLabel ?? 'Progresso do upload'}"`,
    o.valueTextMember ? `[getAriaValueText]="${o.valueTextMember}"` : '',
  ].filter(Boolean);
  const parts = o.label
    ? `  <span ndsProgressLabel>${o.label}</span>\n  <span ndsProgressValue></span>\n`
    : '';
  return `<div ${attrs.join(' ')}>
${parts}  <div ndsProgressTrack>
    <div ndsProgressIndicator></div>
  </div>
</div>`;
}

/**
 * Rótulo e valor acima da barra, com o valor em região `polite`: `assertive`
 * interromperia quem escuta a cada avanço.
 */
function labeled(o: LabeledOptions): string {
  const shown = o.announced ?? `${o.value}%`;
  return `<div class="nds-stack nds-w-full" data-spacing="xs">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="${o.labelClass ?? 'nds-text-foreground'}">${o.label}</span>
    <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">${shown}</span>
  </div>
${indent(
    bar({
      value: o.value,
      variant: o.variant,
      ariaLabel: o.ariaLabel,
    }),
    2,
  )}
</div>`;
}

function component(template: string, body: string[] = [], core: string[] = ['Component']): string {
  const head = [`import { ${core.join(', ')} } from '@angular/core';`, IMPORT].join('\n');
  const classBody = body.length ? ` {\n${body.map((line) => (line ? `  ${line}` : '')).join('\n')}\n}` : ' {}';
  return `${head}

@Component({
  imports: [...NDS_PROGRESS],
  template: \`
${indent(template, 4)}
  \`,
})
export class Example${classBody}`;
}

// ─── Raiz ────────────────────────────────────────────────────────────────────

/** Playground: acompanha os controls. */
export function progressPlaygroundSource(
  _generated?: string,
  ctx: { args?: Partial<ProgressArgs> } = {},
): string {
  const { value = 42, min = 0, max = 100, variant = '', ariaLabel = 'Progresso do upload' } =
    ctx.args ?? {};
  // O control numérico vazio manda `null` ou `NaN`: os dois são o modo
  // indeterminado, e o snippet ensina a forma idiomática dele — omitir.
  const known = typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  return component(
    `<div class="nds-w-md">\n${indent(bar({ value: known, min, max, variant, ariaLabel }), 2)}\n</div>`,
  );
}

// ─── Variants ────────────────────────────────────────────────────────────────

export function progressDeterminateSource(): string {
  return component(bar({ value: 42, ariaLabel: 'Progresso do upload' }));
}

/** Valor OMITIDO: é assim que se pede o modo indeterminado. */
export function progressIndeterminateSource(): string {
  return component(bar({ ariaLabel: 'Processando…' }));
}

export function progressWithLabelSource(): string {
  return component(bar({ value: 42, label: 'Enviando arquivo' }));
}

export function progressSemanticColorSource(): string {
  return component(
    `<div class="nds-stack nds-w-md" data-spacing="sm">
${indent(bar({ value: 100, variant: 'success', ariaLabel: 'Sincronização concluída' }), 2)}
${indent(bar({ value: 92, variant: 'destructive', ariaLabel: 'Espaço de armazenamento quase esgotado' }), 2)}
</div>`,
  );
}

// ─── States ──────────────────────────────────────────────────────────────────

export function progressDefaultSource(): string {
  return component(bar({ value: 0, ariaLabel: 'Progresso do upload' }));
}

export function progressLoadingSource(): string {
  return component(bar({ value: 50, ariaLabel: 'Carregando dados' }));
}

/** Valor fora da faixa é limitado — mas o exemplo ensina o valor de fim. */
export function progressCompleteSource(): string {
  return component(bar({ value: 100, ariaLabel: 'Concluído' }));
}

/** `null` explícito — a mesma coisa que omitir, na forma de quem liga um estado. */
export function progressIndeterminateStateSource(): string {
  return component(bar({ value: null, ariaLabel: 'Processando…' }));
}

/** A barra avança por um sinal; o texto ao lado anuncia em região `polite`. */
export function progressAnimatedSource(): string {
  return component(
    `<div class="nds-stack nds-w-md" data-spacing="xs">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="nds-text-foreground">Enviando arquivo</span>
    <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{{ progress() }}%</span>
  </div>
${indent(
      `<div ndsProgress [value]="progress()" aria-label="Progresso do upload">
  <div ndsProgressTrack>
    <div ndsProgressIndicator></div>
  </div>
</div>`,
      2,
    )}
</div>`,
    [
      'readonly progress = signal(0);',
      '',
      'constructor() {',
      '  const timer = setInterval(() => this.progress.update((pct) => (pct >= 100 ? 0 : pct + 5)), 400);',
      '  inject(DestroyRef).onDestroy(() => clearInterval(timer));',
      '}',
    ],
    ['Component', 'DestroyRef', 'inject', 'signal'],
  );
}

/** O traço indeterminado; o movimento reduzido é preferência do sistema, não opção. */
export function progressReducedMotionSource(): string {
  return component(bar({ ariaLabel: 'Processando dados' }));
}

// ─── Compositions ────────────────────────────────────────────────────────────

const CARD = 'nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground';

export function progressFileUploadSource(): string {
  return component(
    `<div class="${CARD}" data-spacing="sm">
  <div class="nds-text-body nds-font-medium">documento-final.pdf</div>
  <div class="nds-text-caption nds-text-muted-foreground">2.4 MB de 5.0 MB</div>
${indent(
      labeled({
        value: 48,
        label: 'Enviando arquivo',
        ariaLabel: 'Progresso do upload de documento-final.pdf',
      }),
      2,
    )}
</div>`,
  );
}

/** A região `polite` anuncia o nome da etapa, e não a porcentagem. */
export function progressWizardStepsSource(): string {
  return component(
    `<div class="nds-stack nds-w-md" data-spacing="sm">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="nds-text-foreground nds-font-medium">Etapa 3 de 5</span>
    <span class="nds-text-muted-foreground" aria-live="polite">Endereço</span>
  </div>
${indent(bar({ value: 60, ariaLabel: 'Progresso do cadastro: etapa 3 de 5' }), 2)}
</div>`,
  );
}

/** Um nome acessível DISTINTO por barra: quatro nomes iguais são quatro barras indistinguíveis. */
export function progressMultipleUploadsSource(): string {
  const rows: LabeledOptions[] = [
    { value: 100, label: 'foto-1.jpg', ariaLabel: 'Upload de foto-1.jpg concluído' },
    { value: 74, label: 'foto-2.jpg', ariaLabel: 'Progresso do upload de foto-2.jpg' },
    { value: 32, label: 'foto-3.jpg', ariaLabel: 'Progresso do upload de foto-3.jpg' },
    { value: 0, label: 'foto-4.jpg', ariaLabel: 'Upload de foto-4.jpg aguardando' },
  ];
  return component(
    `<div class="nds-stack nds-w-md" data-spacing="md">\n${rows
      .map((row) => indent(labeled(row), 2))
      .join('\n')}\n</div>`,
  );
}

export function progressCustomColorSource(): string {
  const rows: LabeledOptions[] = [
    { value: 100, label: 'Sincronização', ariaLabel: 'Sincronização concluída', variant: 'success' },
    { value: 72, label: 'Backup', ariaLabel: 'Progresso do backup' },
    {
      value: 92,
      label: 'Espaço usado',
      ariaLabel: 'Espaço de armazenamento quase esgotado',
      variant: 'destructive',
    },
  ];
  return component(
    `<div class="nds-stack nds-w-md" data-spacing="md">\n${rows
      .map((row) => indent(labeled(row), 2))
      .join('\n')}\n</div>`,
  );
}

/**
 * `aria-busy` diz que a região está sendo montada; a barra diz quanto falta.
 * Quem termina a operação apaga o atributo.
 */
export function progressAriaBusySource(): string {
  return component(
    `<div role="status" aria-busy="true" class="${CARD}" data-spacing="sm">
  <div class="nds-text-body nds-font-medium">Processando relatório</div>
  <div class="nds-text-caption nds-text-muted-foreground">Isso pode levar alguns minutos.</div>
${indent(
      labeled({
        value: 35,
        label: 'Analisando dados',
        ariaLabel: 'Progresso da análise de dados',
      }),
      2,
    )}
</div>`,
  );
}

/** O texto anunciado no lugar do percentual, pela entrada de formatador. */
export function progressCustomValueTextSource(): string {
  return component(
    bar({ value: 42, ariaLabel: 'Processamento de arquivos', valueTextMember: 'filesText' }),
    [
      '// `null` é o modo indeterminado: o formatador também responde por ele.',
      'readonly filesText = (value: number | null, min: number, max: number) =>',
      "  value === null ? 'Contando arquivos' : `${value} de ${max} arquivos`;",
    ],
  );
}
