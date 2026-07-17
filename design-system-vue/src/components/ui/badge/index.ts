import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva('nds-badge', {
  variants: {
    variant: {
      default: 'nds-badge-default',
      secondary: 'nds-badge-secondary',
      destructive: 'nds-badge-destructive',
      outline: 'nds-badge-outline',
      ghost: 'nds-badge-ghost',
      link: 'nds-badge-link',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})
export type BadgeVariants = VariantProps<typeof badgeVariants>
