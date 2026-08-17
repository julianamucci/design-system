import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

export type SeparatorEmphasis = "default" | "strong"

type SeparatorProps = SeparatorPrimitive.Props & {
  decorative?: boolean
  emphasis?: SeparatorEmphasis
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  emphasis = "default",
  ...props
}: SeparatorProps) {
  // `aria-orientation: undefined` NÃO é redundante no ramo decorativo: o
  // primitivo do Base UI declara `role="separator"` E `aria-orientation` na
  // própria lista de props, e o merge dele deixa passar o que vem de fora. Sem
  // apagar explicitamente, o elemento saía com `role="none"` e
  // `aria-orientation` ao mesmo tempo — atributo não permitido nesse papel, e
  // divergente das outras stacks (medido pela sonda do separator).
  const a11yProps = decorative
    ? { role: "none", "aria-hidden": true, "aria-orientation": undefined }
    : { role: "separator", "aria-orientation": orientation }

  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      data-orientation={orientation}
      // A folha compartilhada só conhece `strong`; o valor default não vira
      // atributo para o DOM não carregar um estado que não muda nada.
      data-emphasis={emphasis === "strong" ? "strong" : undefined}
      className={cn("nds-separator", className)}
      {...a11yProps}
      {...props}
    />
  )
}

export { Separator }
