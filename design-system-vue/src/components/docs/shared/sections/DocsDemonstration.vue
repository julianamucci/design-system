<script setup lang="ts">
import ComponentDemo from '@/components/ComponentDemo.vue';

/**
 * DocsDemonstration — wrapper da seção "Demonstração".
 *
 * `componentSlug` é informativo: este container não injeta `data-track*` nos
 * elementos interativos porque eles vêm via `<slot />` e são controlados pela
 * docs page. Consumidores devem aplicar manualmente os atributos nos triggers:
 *
 * @example
 *   <DocsDemonstration title="..." component-slug="alert">
 *     <Button data-track="demo" data-track-id="alert:demo:save" data-track-label="Salvar">
 *       Salvar
 *     </Button>
 *   </DocsDemonstration>
 *
 * O observer global do DocsPageLayout captura o click via `.closest('[data-track]')`.
 */
defineProps<{ title: string; componentSlug?: string }>();
</script>

<template>
  <section id="demonstracao">
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <ComponentDemo>
      <slot />
    </ComponentDemo>
  </section>
</template>
