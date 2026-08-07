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
  // slug omitido → derivado do ?id= do iframe (mountDocsTracking)
  if (rootRef.value) {
    cleanup = mountDocsTracking(rootRef.value, { componentSlug: props.componentSlug });
  }
});

watch(() => props.componentSlug, (slug) => {
  cleanup?.();
  cleanup = null;
  if (rootRef.value) {
    cleanup = mountDocsTracking(rootRef.value, { componentSlug: slug });
  }
});

onUnmounted(() => {
  cleanup?.();
});
</script>

<template>
  <!-- sb-unstyled: escape hatch oficial do Storybook que desliga as regras
       prose do @storybook/blocks na subárvore. Ver storybook-docs.css.
       .nds-page = wrapper top-level: max-width + padding lateral + ritmo vertical. -->
  <div
    ref="rootRef"
    class="sb-unstyled ds-docs nds-page"
    data-width="wide"
  >
    <slot name="header" />

    <div
      class="nds-sidebar-layout"
      data-sidebar-sticky="true"
    >
      <nav
        aria-label="Navegação das seções do componente"
        class="nds-stack"
        data-spacing="md"
      >
        <DocsNav
          :groups="navGroups"
          :active-section="activeSection"
          :component-slug="componentSlug"
        />
      </nav>

      <!-- Landmark de conteúdo: alvo do "Ir para o conteúdo" do Storybook e do
           foco programático. tabindex="-1" mantém fora da ordem de tabulação;
           aria-labelledby aponta para o <h1> do DocsHeader (id fixo) para o
           leitor anunciar "principal, <título da página>". Mesmas classes e
           mesma posição na árvore — sem mudança visual. -->
      <main
        class="ds-docs nds-stack"
        data-spacing="2xl"
        tabindex="-1"
        aria-labelledby="docs-page-title"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
