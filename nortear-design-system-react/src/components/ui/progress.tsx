import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import {
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from "@shared/primitives/progress-value"

import { cn } from "@/lib/utils"

/**
 * Props da raiz. `value` é OPCIONAL, ao contrário da lib: omitir o valor é o
 * modo indeterminado nas cinco stacks (igual ao `<progress>` nativo), e a lib
 * exigia escrever `null` para dizer a mesma coisa.
 *
 * `getAriaValueText(formatado, valor)` mantém a assinatura da lib, mas `valor`
 * chega LIMITADO à faixa (o mesmo de `aria-valuenow`) — a lib entregaria o cru,
 * e 140 de 100 viraria "140 de 100 arquivos". Indeterminado continua `null`.
 */
type ProgressProps = Omit<ProgressPrimitive.Root.Props, "value"> & {
  value?: number | null
}

function Progress({
  className,
  children,
  value,
  min,
  max,
  getAriaValueText,
  ...props
}: ProgressProps) {
  // A faixa sai da regra compartilhada, e é ELA que chega à lib. A lib limita o
  // valor e decide o indeterminado sozinha, e isso bate com a regra — menos num
  // ponto: máximo menor ou igual ao mínimo. Ali a lib divide por zero e a regra
  // corrige para mínimo + 100. Entregando a faixa já resolvida, as duas contas
  // são a mesma.
  const range = resolveProgressRange(min, max)

  return (
    <ProgressPrimitive.Root
      value={value ?? null}
      min={range.min}
      max={range.max}
      // Sem função do consumidor, a lib anunciaria a frase de indeterminado em
      // inglês. O texto padrão é o da regra: "42%", ou "Em andamento". A lib
      // passa o valor CRU no segundo argumento (não o limitado), por isso ele
      // é resolvido antes nos DOIS caminhos — 140 de 100 anuncia "100%", nunca
      // "140%", e a função de quem compõe recebe o mesmo valor limitado que
      // `aria-valuenow` mostra. A assinatura dela não muda.
      getAriaValueText={
        getAriaValueText
          ? (formattedValue, raw) =>
              getAriaValueText(formattedValue, resolveProgressValue(raw, range))
          : (_formattedValue, raw) =>
              progressValueText(resolveProgressValue(raw, range), range)
      }
      data-slot="progress"
      className={cn("nds-progress-root", className)}
      {...props}
    >
      {/* Trilha e indicador só nascem sozinhos quando NINGUÉM os compôs.
       * Antes eram sempre acrescentados depois de `children`, e toda composição
       * com rótulo — que declara o próprio `ProgressTrack` — renderizava DUAS
       * trilhas empilhadas: a do autor e esta. Nenhum teste via, porque
       * `getByRole('progressbar')` acha a raiz e as duas trilhas são divs. */}
      {children ?? (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn("nds-progress", className)}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("nds-progress-bar", className)}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("nds-progress-label", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn("nds-progress-value", className)}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
export type { ProgressProps }
