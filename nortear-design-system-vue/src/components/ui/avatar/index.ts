import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Avatar } from './Avatar.vue'
export { default as AvatarBadge } from './AvatarBadge.vue'
export { default as AvatarFallback } from './AvatarFallback.vue'
export { default as AvatarGroup } from './AvatarGroup.vue'
export { default as AvatarGroupCount } from './AvatarGroupCount.vue'
export { default as AvatarImage } from './AvatarImage.vue'

export const avatarVariants = cva(
  'nds-avatar',
  {
    variants: {
      // Os presets moram no CSS, via [data-size]; a cva só declara o eixo para
      // o tipo. Antes faltavam md, xl e 2xl, e o default era 'default', que não
      // casa com seletor nenhum.
      size: {
        sm: '',
        md: '',
        lg: '',
        xl: '',
        '2xl': '',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export type AvatarVariants = VariantProps<typeof avatarVariants>
