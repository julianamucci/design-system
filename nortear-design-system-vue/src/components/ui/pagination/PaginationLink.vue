<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(defineProps<{
  /**
   * Endereço da página. É ele que decide a TAG do controle.
   *
   * Com `href` o controle é `<a href>`: destino de verdade, abre em nova aba,
   * é indexável, e o clique segue para o roteador de cliente. Sem ele o
   * controle é `<button type="button">`, porque âncora sem destino — ou com
   * `href="#"` — anuncia "link" ao leitor de tela e promete uma ida que não
   * acontece: o que acontece é uma ação na própria página.
   */
  href?: string
  size?: ButtonVariants['size']
  isActive?: boolean
  /**
   * Aparência dos controles NÃO ativos. Padrão `ghost`.
   *
   * A página atual continua `outline` sempre: é ela que o realce existe para
   * marcar, e deixá-la seguir o eixo apagaria a marcação justamente quando a
   * faixa inteira fosse `outline`.
   *
   * Não se resolve por `class`: `buttonVariants` já traz uma variante, e quem
   * chega depois pelo `cn` não desfaz a que veio antes.
   */
  appearance?: 'ghost' | 'outline'
  class?: HTMLAttributes['class']
}>(), {
  size: 'icon',
  isActive: false,
  appearance: 'ghost',
})

/** O que os dois caminhos compartilham — só a tag e o destino divergem. */
const sharedAttrs = computed(() => ({
  'data-slot': 'pagination-link',
  'data-active': props.isActive ? 'true' : undefined,
  'aria-current': props.isActive ? ('page' as const) : undefined,
  class: cn(
    buttonVariants({ variant: props.isActive ? 'outline' : props.appearance, size: props.size }),
    props.class,
  ),
}))
</script>

<template>
  <a
    v-if="href"
    :href="href"
    v-bind="sharedAttrs"
  >
    <slot />
  </a>
  <!--
    Sem `type` explícito o botão é `submit` e envia o formulário que o cercar —
    a faixa costuma viver dentro de um, em filtro de tabela.
  -->
  <button
    v-else
    type="button"
    v-bind="sharedAttrs"
  >
    <slot />
  </button>
</template>
