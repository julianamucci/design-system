<script setup lang="ts">
/**
 * Destino DENTRO do painel.
 *
 * Classe diferente da do destino da barra porque o desenho é outro: o da barra
 * é uma pílula de uma linha (`inline-flex` + `white-space: nowrap`); este é um
 * bloco com título e, às vezes, uma linha de descrição. É a mesma separação que
 * o Vanilla faz — e sem ela os painéis de mega-menu desta stack empurravam
 * título e descrição para dentro de uma pílula que não quebra linha.
 */
import type { NavigationMenuLinkEmits, NavigationMenuLinkProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuLink, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<NavigationMenuLinkProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<NavigationMenuLinkEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <NavigationMenuLink
    data-slot="navigation-menu-child"
    v-bind="forwarded"
    :class="cn('nds-navigation-menu-child', props.class)"
  >
    <slot />
  </NavigationMenuLink>
</template>
