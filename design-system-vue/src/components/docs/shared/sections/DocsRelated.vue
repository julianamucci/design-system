<script setup lang="ts">
interface DocsRelatedItem { name: string; description: string; path: string }

/**
 * DocsRelated — grid de componentes/páginas relacionadas.
 *
 * Quando `componentSlug` é informado, cada card recebe `data-track="related"`
 * + `data-track-id="{slug}:related:{item.name.slug}"` +
 * `data-track-label={item.name}`. Se ausente, omite `data-track-id`.
 */
const props = defineProps<{
  title: string;
  items: DocsRelatedItem[];
  componentSlug?: string;
}>();

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-');
}

function trackId(name: string): string | undefined {
  return props.componentSlug ? `${props.componentSlug}:related:${slugify(name)}` : undefined;
}
</script>

<template>
  <section id="relacionados">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <div
      class="nds-grid"
      data-cols="2"
      data-spacing="md"
    >
      <!-- Card clicável com aparência do button outline (border + bg + hover accent).
           Implementado como classe própria .nds-related-card em vez de usar
           .nds-button-outline porque o layout difere (vertical, multi-linha,
           padding maior, sem white-space:nowrap nem inline-flex centralizado). -->
      <a
        v-for="(item, i) in items"
        :key="i"
        :href="item.path"
        target="_top"
        class="nds-related-card"
        data-track="related"
        :data-track-id="trackId(item.name)"
        :data-track-label="item.name"
      >
        <span class="nds-related-card-title">{{ item.name }}</span>
        <span class="nds-related-card-description">{{ item.description }}</span>
      </a>
    </div>
  </section>
</template>
