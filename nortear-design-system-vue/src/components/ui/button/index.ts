import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva('nds-button', {
  variants: {
    variant: {
      default: 'nds-button-default',
      outline: 'nds-button-outline',
      secondary: 'nds-button-secondary',
      ghost: 'nds-button-ghost',
      destructive: 'nds-button-destructive',
      link: 'nds-button-link',
    },
    size: {
      'default': '',
      'xs': 'nds-button-xs',
      'sm': 'nds-button-sm',
      'lg': 'nds-button-lg',
      'icon': 'nds-button-icon',
      'icon-xs': 'nds-button-icon-xs',
      'icon-sm': 'nds-button-icon-sm',
      'icon-lg': 'nds-button-icon-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})
export type ButtonVariants = VariantProps<typeof buttonVariants>
