<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import DocsNav from '../DocsNav.vue';
import { mountDocsTracking } from '@/lib/docs-tracking';

interface Section {
  id: string;
  label: string;
}

interface Group {
  label: string;
  sections: Section[];
}

const props = defineProps<{
  navGroups: Group[];
  activeSection?: string;
  /** Slug do componente — habilita tracking automático via data-track*. */
  componentSlug?: string;
}>();

const rootRef = ref<HTMLElement | null>(null);
let cleanup: (() => void) | null = null;

onMounted(() => {
  if (props.componentSlug && rootRef.value) {
    cleanup = mountDocsTracking(rootRef.value, { componentSlug: props.componentSlug });
  }
});

watch(() => props.componentSlug, (slug) => {
  cleanup?.();
  cleanup = null;
  if (slug && rootRef.value) {
    cleanup = mountDocsTracking(rootRef.value, { componentSlug: slug });
  }
});

onUnmounted(() => {
  cleanup?.();
});
</script>

<template>
  <!-- sb-unstyled: escape hatch oficial do Storybook que desliga as regras
       prose do @storybook/blocks na subárvore. Ver storybook-docs.css. -->
  <div ref="rootRef" class="sb-unstyled ds-docs p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
    <slot name="header" />

    <div class="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
      <nav
        aria-label="Navegação das seções do componente"
        class="w-full lg:sticky lg:top-8 lg:w-52 lg:shrink-0 self-start space-y-5"
      >
        <DocsNav :groups="navGroups" :active-section="activeSection" :component-slug="componentSlug" />
      </nav>

      <div class="ds-docs flex-1 min-w-0 w-full space-y-12">
        <slot />
      </div>
    </div>
  </div>
</template>
