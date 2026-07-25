import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Estilo 100% via classes .nds-* (docs/shared/styles/nds/button.css) —
// compartilhadas com as stacks Vue, Svelte e Vanilla.
// Estados (hover/focus/disabled/aria-*) vivem no CSS, não em utilitários.
const buttonVariants = cva("nds-button", {
  variants: {
    variant: {
      default: "nds-button-default",
      outline: "nds-button-outline",
      secondary: "nds-button-secondary",
      ghost: "nds-button-ghost",
      destructive: "nds-button-destructive",
      link: "nds-button-link",
    },
    size: {
      default: "",
      xs: "nds-button-xs",
      sm: "nds-button-sm",
      lg: "nds-button-lg",
      icon: "nds-button-icon",
      "icon-xs": "nds-button-icon-xs",
      "icon-sm": "nds-button-icon-sm",
      "icon-lg": "nds-button-icon-lg",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
