import { Slider as SliderPrimitive } from "@base-ui/react/slider"

// Estilo via .nds-slider-* (docs/shared/styles/nds/slider.css). O base-ui
// posiciona range e thumbs via inline styles; o CSS cobre visual + estados
// (focus por thumb, data-disabled, orientação vertical).
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props & {
  "aria-label"?: string
  "aria-labelledby"?: string
}) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

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
      thumbAlignment="edge"
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
