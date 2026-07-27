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
  <section
    id="demonstracao"
    data-track="demo"
    data-track-container="true"
    data-track-id="page:demonstracao:demo"
  >
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <ComponentDemo>
      <slot />
    </ComponentDemo>
  </section>
</template>
