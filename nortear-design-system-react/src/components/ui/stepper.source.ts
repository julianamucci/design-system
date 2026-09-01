/**
 * Transforms do painel Code do Stepper.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que o Stepper tem de arg é o valor do fluxo e o nome dele; a composição das
 * etapas não cabe num control, então cada forma diferente traz a sua transform.
 *
 * Os textos vêm do mesmo módulo de andaime que as stories usam: snippet e story
 * mostrando fluxos diferentes é o defeito que ninguém vê, porque cada metade
 * está certa sozinha.
 */
import { jsxSnippet, text, type SourceTransform } from '@/lib/story-source'
import {
  BACK_LABEL,
  FLOW_LABEL,
  NEXT_LABEL,
  STATE_LABELS,
  STEP_HINTS,
  STEP_TITLES,
} from './stepper.fixtures'

export interface StepperArgs {
  value?: number
  'aria-label'?: string
  labels?: { completed?: string; current?: string }
}

/** Etapa em que a trilha canônica abre. */
const DEFAULT_VALUE = 2

/** Import montado sob medida: só as peças que o snippet realmente usa. */
function importOf(...parts: string[]): string {
  return `import {\n${parts.map((part) => `  ${part},`).join('\n')}\n} from "@/components/ui/stepper";`
}

const ALL_PARTS = [
  'Stepper',
  'StepperDescription',
  'StepperIndicator',
  'StepperItem',
  'StepperSeparator',
  'StepperTitle',
  'StepperTrigger',
]

const PARTS_WITHOUT_DESCRIPTION = ALL_PARTS.filter(
  (part) => part !== 'StepperDescription',
)

interface StepOptions {
  /** Texto de apoio da etapa, quando ela tem um. */
  hint?: string
  /** Prop afirmada no item — `completed` ou `disabled`. */
  flag?: string
}

/**
 * Uma etapa da trilha, com o traço só onde há próxima etapa.
 *
 * O traço mora DENTRO do item, depois do gatilho: é isso que o faz herdar o
 * estado da etapa que o precede, e é a parte que quem copia mais erra.
 */
function stepMarkup(
  position: number,
  title: string,
  last: boolean,
  options: StepOptions = {},
): string {
  const flag = options.flag ? ` ${options.flag}` : ''
  const hint = options.hint
    ? `\n      <StepperDescription>${options.hint}</StepperDescription>`
    : ''
  const separator = last ? '' : '\n    <StepperSeparator />'
  return `  <StepperItem step={${position}}${flag}>
    <StepperTrigger>
      <StepperIndicator />
      <StepperTitle>${title}</StepperTitle>${hint}
    </StepperTrigger>${separator}
  </StepperItem>`
}

/** Corpo da trilha de quatro etapas, com apoio e prop opcionais por etapa. */
function trackMarkup(
  perStep: (index: number) => StepOptions = () => ({}),
): string {
  return STEP_TITLES.map((title, i) =>
    stepMarkup(i + 1, title, i === STEP_TITLES.length - 1, perStep(i)),
  ).join('\n\n')
}

interface RootOptions {
  flow: string
  /** Valor do fluxo como EXPRESSÃO — número cravado ou nome de variável. */
  valueExpr: string
  extras?: string[]
  labels?: boolean
}

/**
 * A raiz, com o valor do fluxo escrito como expressão.
 *
 * É o que permite ao fluxo completo mostrar `value={position}` — o estado real
 * vive fora do componente, e um snippet que cravasse um número esconderia
 * justamente isso.
 */
function rootMarkup(options: RootOptions, body: string): string {
  const attributes = [
    `value={${options.valueExpr}}`,
    `aria-label="${options.flow}"`,
    options.labels === false
      ? undefined
      : `labels={{ completed: "${STATE_LABELS.completed}", current: "${STATE_LABELS.current}" }}`,
    ...(options.extras ?? []),
  ].filter((part): part is string => Boolean(part))

  return `<Stepper
${attributes.map((part) => `  ${part}`).join('\n')}
>
${body}
</Stepper>`
}

/**
 * Trilha canônica de quatro etapas — a transform do `meta` da Playground.
 *
 * Reage aos controls: o valor do fluxo e o nome dele saem dos args, e é isso que
 * mantém a caixa de código honesta quando alguém mexe no painel.
 */
export const stepperSource: SourceTransform<StepperArgs> = (_generated, ctx) => {
  const arg = ctx?.args?.value
  const value = typeof arg === 'number' && Number.isFinite(arg) ? arg : DEFAULT_VALUE
  const flow = text(ctx?.args?.['aria-label']) ?? FLOW_LABEL

  return jsxSnippet(
    importOf(...PARTS_WITHOUT_DESCRIPTION),
    rootMarkup({ flow, valueExpr: String(value) }, trackMarkup()),
  )
}

/**
 * Etapa marcada como concluída fora de ordem.
 *
 * A trilha do `meta` deriva tudo do valor do fluxo; aqui a última etapa afirma o
 * próprio estado, que é a única forma de mostrar a marca de verificação depois
 * da atual.
 */
export function stepperCompletedSource(): string {
  return jsxSnippet(
    importOf(...PARTS_WITHOUT_DESCRIPTION),
    rootMarkup(
      { flow: FLOW_LABEL, valueExpr: String(DEFAULT_VALUE) },
      trackMarkup((i) =>
        i === STEP_TITLES.length - 1 ? { flag: 'completed' } : {},
      ),
    ),
  )
}

/**
 * Etapa indisponível.
 *
 * `disabled` no ITEM, e não no gatilho: é o item que a folha alcança para apagar
 * o traço e bloquear o ponteiro, e é dele que o gatilho tira o próprio estado.
 */
export function stepperDisabledSource(): string {
  return jsxSnippet(
    importOf(...PARTS_WITHOUT_DESCRIPTION),
    rootMarkup(
      { flow: FLOW_LABEL, valueExpr: String(DEFAULT_VALUE) },
      trackMarkup((i) => (i === 2 ? { flag: 'disabled' } : {})),
    ),
  )
}

/**
 * Etapas com texto de apoio.
 *
 * A descrição é a peça a mais, e ela não aparece em nenhuma outra forma — o
 * snippet do `meta` esconderia justamente o que esta story afirma.
 */
export function stepperWithDescriptionsSource(): string {
  return jsxSnippet(
    importOf(...ALL_PARTS),
    rootMarkup(
      { flow: FLOW_LABEL, valueExpr: String(DEFAULT_VALUE) },
      trackMarkup((i) => ({ hint: STEP_HINTS[i] })),
    ),
  )
}

/**
 * Fluxo completo: o indicador acima do painel, com voltar e avançar embaixo.
 *
 * O estado do fluxo vive FORA do componente, e é por isso que o snippet precisa
 * do `useState`: quem decide a etapa é a aplicação. Quem anuncia o avanço é o
 * painel que trocou de conteúdo — não há região viva em lugar nenhum, e é para o
 * painel que o foco vai.
 */
export function stepperWizardSource(): string {
  const header = `import { useState } from "react";
${importOf(...PARTS_WITHOUT_DESCRIPTION)}
import { Button } from "@/components/ui/button";`

  const indicator = rootMarkup(
    {
      flow: FLOW_LABEL,
      valueExpr: 'position',
      extras: ['onStepSelect={setPosition}'],
    },
    trackMarkup(),
  )
    .split('\n')
    .map((line) => (line.trim() ? `      ${line}` : line))
    .join('\n')

  const markup = `function MultiStepSignUp() {
  const [position, setPosition] = useState(1);

  return (
    <div className="nds-stack" data-spacing="lg">
${indicator}

      <div
        className="nds-stack nds-p-4 nds-rounded-md nds-border-default"
        data-spacing="sm"
      >
        <h3 className="nds-text-h3">Etapa {position} de ${STEP_TITLES.length}</h3>
        <p className="nds-text-body">Os campos desta etapa entram aqui.</p>
      </div>

      <div className="nds-cluster" data-spacing="md">
        <Button
          variant="outline"
          disabled={position === 1}
          onClick={() => setPosition(position - 1)}
        >
          ${BACK_LABEL}
        </Button>
        <Button
          disabled={position === ${STEP_TITLES.length}}
          onClick={() => setPosition(position + 1)}
        >
          ${NEXT_LABEL}
        </Button>
      </div>
    </div>
  );
}`

  return jsxSnippet(header, markup)
}
