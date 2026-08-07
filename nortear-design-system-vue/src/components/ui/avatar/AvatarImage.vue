<script setup lang="ts">
import type { AvatarImageProps } from 'reka-ui'
import { AvatarImage } from 'reka-ui'
import { computed } from 'vue'

const props = defineProps<AvatarImageProps & { alt?: string }>()

/**
 * A lib fixa `role="img"` no `<img>`. Com `alt` vazio — a imagem decorativa de
 * um grupo, em que quem nomeia é o rótulo do grupo — a combinação é inválida
 * (`aria-allowed-role`) e o axe reprova. Nesse caso devolvemos o papel nativo
 * do elemento, que para imagem sem texto alternativo é `presentation`.
 */
const papel = computed(() => (props.alt ? undefined : 'presentation'))
</script>

<template>
  <AvatarImage
    data-slot="avatar-image"
    v-bind="props"
    :role="papel"
    class="nds-avatar-image"
  />
</template>
