import { Slider as SliderPrimitive } from "@base-ui/react/slider"

// Estilo via .nds-slider-* (docs/shared/styles/nds/slider.css). O base-ui
// posiciona range e thumbs via inline styles; o CSS cobre visual + estados
// (focus por thumb, data-disabled, orientação vertical).
/**
 * Quantas alças este valor descreve.
 *
 * O primitivo emite um NÚMERO quando há uma alça só, mesmo tendo recebido um
 * array de um elemento. Quem devolve esse número como novo `value` — que é o
 * que qualquer estado controlado faz — caía no ramo `[min, max]` e ganhava uma
 * SEGUNDA alça no meio da interação, as duas no mesmo valor. Escalar é uma
 * alça; o par só vale quando não há valor nenhum de onde tirar a contagem.
 */
function valueAlcas(
  value: unknown,
  defaultValue: unknown,
  min: number,
  max: number,
): number[] {
  for (const candidato of [value, defaultValue]) {
    if (Array.isArray(candidato)) return candidato as number[]
    if (typeof candidato === "number") return [candidato]
  }
  return [min, max]
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  onValueCommitted,
  ...props
}: SliderPrimitive.Root.Props & {
  "aria-label"?: string
  "aria-labelledby"?: string
}) {
  const _values = valueAlcas(value, defaultValue, min, max)

  // O valor sai SEMPRE como array, seja qual for a forma que o primitivo usa
  // por dentro — é o contrato que a tabela de props documenta e o que as outras
  // stacks entregam. Só o valor é repassado: o `eventDetails` do primitivo
  // carrega o evento nativo, e a aba Actions estoura ao serializar `event.view`.
  const adaptOutward = (
    callback: ((value: number[]) => void) | undefined,
  ) =>
    callback
      ? (value: number | readonly number[]) =>
          callback(Array.isArray(value) ? [...value] : [value as number])
      : undefined

  const ariaLabel = (props as { "aria-label"?: string })["aria-label"]
  const ariaLabelledBy = (props as { "aria-labelledby"?: string })["aria-labelledby"]
  const rootProps = { ...props } as Record<string, unknown>
  delete rootProps["aria-label"]
  delete rootProps["aria-labelledby"]

  return (
    <SliderPrimitive.Root
      className={className}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      onValueChange={adaptOutward(onValueChange as ((v: number[]) => void) | undefined)}
      onValueCommitted={adaptOutward(onValueCommitted as ((v: number[]) => void) | undefined)}
      {...(rootProps as SliderPrimitive.Root.Props)}
    >
      <SliderPrimitive.Control className="nds-slider">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="nds-slider-track"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="nds-slider-range"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={index}
            getAriaLabel={
              ariaLabel
                ? () => ariaLabel
                : ariaLabelledBy
                  ? () => ariaLabelledBy
                  : undefined
            }
            className="nds-slider-thumb"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
