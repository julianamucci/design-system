<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

/**
 * A alternativa de várias linhas. Presente, a folha faz o grupo empilhar.
 *
 * Mesma medição do `InputGroupInput.vue`: `Textarea.vue` declara
 * `data-slot="textarea"` estático, e o valor herdado daqui vence. A saída
 * medida é
 *
 *   <textarea data-slot="input-group-control" class="nds-textarea nds-input-group-control">
 *
 * — um `data-slot` só, e o do grupo. É o que faz o atalho de ponteiro do addon
 * alcançar também a área de texto, já que ele procura pela CLASSE do controle.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Textarea
    data-slot="input-group-control"
    :class="cn('nds-input-group-control', props.class)"
  />
</template>
