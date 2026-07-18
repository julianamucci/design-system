import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as ButtonGroup } from './ButtonGroup.vue'
export { default as ButtonGroupSeparator } from './ButtonGroupSeparator.vue'
export { default as ButtonGroupText } from './ButtonGroupText.vue'

export const buttonGroupVariants = cva(
  'nds-button-group',
  {
    variants: {
      orientation: {
        horizontal:
          '',
        vertical:
          '',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  },
)

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>
