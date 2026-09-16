/**
 * Transforms do painel Code do Progress.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A largura das stories (`nds-w-md`) só atravessa para cá nas composições, onde
 * o contêiner é parte do exemplo. A barra sozinha ocupa a largura de quem a
 * contém, e é isso que quem consome precisa saber.
 */
import { attrs, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type ProgressArgs = {
  modelValue: number | null;
  min: number;
  max: number;
  variant: '' | 'success' | 'destructive';
  ariaLabel: string;
};

/** Padrões do componente — o que bate com eles não entra no snippet. */
const MIN_DEFAULT = 0;
const MAX_DEFAULT = 100;

const IMPORT = `import { Progress } from '@/components/ui/progress'`;

/**
 * O valor. OMITIR é o modo indeterminado (a regra compartilhada segue o
 * `<progress>` nativo), então a ausência não escreve nada — e o `0` sai escrito,
 * porque é o que separa "zero por cento" de "não sei quanto falta".
 *
 * `null` tem as DUAS formas, e a diferença é de quem escreve: omitir é a forma
 * curta, e `:model-value="null"` é a de quem tem o número numa variável que
 * ainda não chegou. `nullExplicit` diz qual delas a story é sobre — sem ele o
 * snippet do estado indeterminado ficaria idêntico ao da variante, e a página
 * deixaria de ensinar uma das duas.
 */
function valueAttr(raw: unknown, nullExplicit = false): string {
  if (raw === null) return nullExplicit ? ':model-value="null"' : '';
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return '';
  return `:model-value="${raw}"`;
}

function numberAttr(name: string, raw: unknown, fallback: number): string {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw === fallback) return '';
  return `:${name}="${raw}"`;
}

function variantAttr(raw: unknown): string {
  return raw === 'success' || raw === 'destructive' ? `data-variant="${raw}"` : '';
}

type BarOptions = {
  value?: number | null;
  /** Escreve `:model-value="null"` em vez de omitir o valor — ver `valueAttr`. */
  nullExplicit?: boolean;
  min?: number;
  max?: number;
  variant?: '' | 'success' | 'destructive';
  label: string;
};

/** Uma barra, só com o que difere do padrão. O nome acessível é obrigatório. */
function bar(o: BarOptions): string {
  return `<Progress${attrs(
    valueAttr(o.value, o.nullExplicit),
    numberAttr('min', o.min, MIN_DEFAULT),
    numberAttr('max', o.max, MAX_DEFAULT),
    variantAttr(o.variant),
    `aria-label="${text(o.label)}"`,
  )} />`;
}

/**
 * Rótulo visível e valor acima da barra. O valor vive em `aria-live="polite"`:
 * `assertive` interromperia o leitor de tela a cada avanço. `nds-tabular-nums`
 * impede que o número dance de largura quando os dígitos mudam.
 */
function labeled(o: { title: string; value: string; bar: string; valueClass?: string }): string {
  const valueClass = o.valueClass ?? 'nds-text-muted-foreground nds-tabular-nums';
  return `<div class="nds-stack nds-w-full" data-spacing="xs">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="nds-text-foreground">${o.title}</span>
    <span class="${valueClass}" aria-live="polite">${o.value}</span>
  </div>
  ${o.bar}
</div>`;
}

function indent(block: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return block
    .split('\n')
    .map((line) => (line.trim() ? `${pad}${line}` : line))
    .join('\n');
}

/** Transform do Playground — os controls viram atributos. */
export const progressSource: SourceTransform<ProgressArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const label = typeof args.ariaLabel === 'string' && args.ariaLabel.trim() ? args.ariaLabel : 'Progresso do upload';
  return vueSnippet(
    IMPORT,
    bar({
      value: 'modelValue' in args ? args.modelValue : 42,
      min: args.min,
      max: args.max,
      variant: args.variant,
      label,
    }),
  );
};

/** Barra sozinha com valor e nome fixos — as stories de variante e de estado. */
export function progressBarSnippet(o: BarOptions = { value: 42, label: 'Progresso do upload' }): string {
  return vueSnippet(IMPORT, bar(o));
}

/** Barra com rótulo e valor visíveis. */
export function progressWithLabelSource(): string {
  return vueSnippet(
    IMPORT,
    labeled({
      title: 'Enviando arquivo',
      value: '42%',
      bar: bar({ value: 42, label: 'Enviando arquivo' }),
    }),
  );
}

/** Duas barras: a variante só se lê contra outra. A trilha continua neutra. */
export function progressSemanticColorSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="sm">
  ${bar({ value: 100, variant: 'success', label: 'Sincronização concluída' })}
  ${bar({ value: 92, variant: 'destructive', label: 'Espaço de armazenamento quase esgotado' })}
</div>`,
  );
}

/**
 * Barra que avança: o valor é reativo, e o número ao lado lê o MESMO valor.
 * O relógio é desligado no desmonte — um `setInterval` sobrevivente continua
 * escrevendo num componente que já saiu da tela.
 */
export function progressAnimatedSource(): string {
  return vueSnippet(
    `${IMPORT}
import { onMounted, onUnmounted, ref } from 'vue'

const value = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    value.value = value.value >= 100 ? 0 : value.value + 5
  }, 400)
})

onUnmounted(() => clearInterval(timer))`,
    `<div class="nds-stack nds-w-md" data-spacing="xs">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="nds-text-foreground">Enviando arquivo</span>
    <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{{ value }}%</span>
  </div>
  <Progress :model-value="value" aria-label="Progresso do upload" />
</div>`,
  );
}

/** Upload num cartão: o nome acessível nomeia o ARQUIVO, não o componente. */
export function progressFileUploadSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground" data-spacing="sm">
  <div class="nds-text-body nds-font-medium">documento-final.pdf</div>
  <div class="nds-text-caption nds-text-muted-foreground">2.4 MB de 5.0 MB</div>
${indent(
  labeled({
    title: 'Enviando arquivo',
    value: '48%',
    bar: bar({ value: 48, label: 'Progresso do upload de documento-final.pdf' }),
  }),
  2,
)}
</div>`,
  );
}

/** Assistente de etapas: a região `polite` anuncia o nome da etapa. */
export function progressWizardStepsSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-w-md" data-spacing="sm">
  <div class="nds-cluster nds-text-body" data-justify="between">
    <span class="nds-text-foreground nds-font-medium">Etapa 3 de 5</span>
    <span class="nds-text-muted-foreground" aria-live="polite">Endereço</span>
  </div>
  ${bar({ value: 60, label: 'Progresso do cadastro: etapa 3 de 5' })}
</div>`,
  );
}

const UPLOADS = [
  { value: 100, file: 'foto-1.jpg', label: 'Upload de foto-1.jpg concluído' },
  { value: 74, file: 'foto-2.jpg', label: 'Progresso do upload de foto-2.jpg' },
  { value: 32, file: 'foto-3.jpg', label: 'Progresso do upload de foto-3.jpg' },
  { value: 0, file: 'foto-4.jpg', label: 'Upload de foto-4.jpg aguardando' },
] as const;

/** Várias barras: cada uma com nome acessível PRÓPRIO. */
export function progressMultipleUploadsSource(): string {
  const rows = UPLOADS.map((u) =>
    indent(labeled({ title: u.file, value: `${u.value}%`, bar: bar({ value: u.value, label: u.label }) }), 2),
  );
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-w-md" data-spacing="md">
${rows.join('\n')}
</div>`,
  );
}

const COLORS = [
  { value: 100, title: 'Sincronização', variant: 'success', label: 'Sincronização concluída' },
  { value: 72, title: 'Backup', variant: '', label: 'Progresso do backup' },
  { value: 92, title: 'Espaço usado', variant: 'destructive', label: 'Espaço de armazenamento quase esgotado' },
] as const;

/** Três medidas, e a do meio sem variante: "em andamento" não é semântico. */
export function progressCustomColorSource(): string {
  const rows = COLORS.map((c) =>
    indent(
      labeled({
        title: c.title,
        value: `${c.value}%`,
        bar: bar({ value: c.value, variant: c.variant, label: c.label }),
      }),
      2,
    ),
  );
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack nds-w-md" data-spacing="md">
${rows.join('\n')}
</div>`,
  );
}

/** Contêiner que se declara ocupado enquanto a operação corre. */
export function progressAriaBusyContainerSource(): string {
  return vueSnippet(
    IMPORT,
    `<!-- Quem termina a operação troca aria-busy para "false". -->
<div role="status" aria-busy="true" class="nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground" data-spacing="sm">
  <div class="nds-text-body nds-font-medium">Processando relatório</div>
  <div class="nds-text-caption nds-text-muted-foreground">Isso pode levar alguns minutos.</div>
${indent(
  labeled({
    title: 'Analisando dados',
    value: '35%',
    bar: bar({ value: 35, label: 'Progresso da análise de dados' }),
  }),
  2,
)}
</div>`,
  );
}

/**
 * Texto anunciado no lugar do percentual. A função recebe o valor JÁ limitado
 * à faixa e o máximo; sem valor, recebe `null`.
 */
export function progressCustomValueTextSource(): string {
  return vueSnippet(
    `${IMPORT}

const filesText = (value: number | null | undefined, max: number) =>
  value == null ? 'Contando arquivos' : \`\${value} de \${max} arquivos\``,
    `<div class="nds-w-md">
  <Progress
    :model-value="42"
    aria-label="Processamento de arquivos"
    :get-value-text="filesText"
  />
</div>`,
  );
}
