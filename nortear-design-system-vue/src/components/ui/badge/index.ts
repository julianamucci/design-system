import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'
export { default as BadgeCounter } from './BadgeCounter.vue'

export const badgeVariants = cva('nds-badge', {
  variants: {
    variant: {
      default: 'nds-badge-default',
      destructive: 'nds-badge-destructive',
      warning: 'nds-badge-warning',
      success: 'nds-badge-success',
      info: 'nds-badge-info',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})
export type BadgeVariants = VariantProps<typeof badgeVariants>
