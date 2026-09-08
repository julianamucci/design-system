<script setup lang="ts">
/**
 * Rodapé do diálogo — a faixa de ações, e a ordem delas.
 *
 * A ordem VISUAL sai de `.nds-dialog-footer`: empilhado é
 * `flex-direction: column-reverse`, e a partir de 40rem vira `row` com
 * `justify-content: flex-end`. As duas leituras saem da MESMA ordem de DOM —
 * secundários primeiro, ação primária POR ÚLTIMO —, e é isso que põe o primário
 * em cima no empilhamento e à direita quando lado a lado. Ordem de DOM é também
 * a ordem de leitura e a de foco, então não há o que inverter no CSS.
 *
 * Por isso o botão de fechar do `showCloseButton` é renderizado ANTES do slot:
 * fechar é ação SECUNDÁRIA, e emiti-lo depois o punha na posição do primário —
 * exatamente a leitura que o conteúdo compartilhado descreve como "na posição
 * de ação secundária".
 */
import type { HTMLAttributes } from 'vue'
import { DialogClose } from 'reka-ui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  showCloseButton?: boolean
  /**
   * Rótulo visível do botão de fechar do rodapé.
   *
   * Existe porque o texto estava CRAVADO em pt-BR dentro do primitivo, e um
   * design system trilíngue não pode ter rótulo que só uma língua alcança. O
   * padrão mantém o call site existente intacto.
   */
  closeLabel?: string
}>(), {
  showCloseButton: false,
  closeLabel: 'Fechar',
})
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="cn('nds-dialog-footer', props.class)"
  >
    <DialogClose
      v-if="showCloseButton"
      as-child
    >
      <Button variant="outline">
        {{ closeLabel }}
      </Button>
    </DialogClose>
    <slot />
  </div>
</template>
