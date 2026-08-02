<script setup lang="ts">
import { computed } from 'vue';
import { deriveSlugFromUrl } from '@/lib/docs-tracking';

interface Section {
  id: string;
  label: string;
}

interface Group {
  label: string;
  sections: Section[];
}

const props = defineProps<{
  groups: Group[];
  activeSection?: string;
  /** Slug do componente — usado no data-track-id (ex: "alert" → `alert:nav:anatomia`). */
  componentSlug?: string;
}>();

// `componentSlug` é opcional por contrato e a maioria das docs pages não o
// passa. Sem fallback o `data-track-id` some e o `docs_nav_click` sai sem
// destino — usa-se a MESMA derivação do `mountDocsTracking` (`?id=` do iframe)
// para que as duas pontas do evento concordem sem tocar nas docs pages.
const trackSlug = computed(() => props.componentSlug ?? deriveSlugFromUrl());

function scrollTo(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  // Sem mover o foco o leitor de tela não continua a leitura a partir da seção
  // e o Tab seguinte volta para o próximo item do menu. tabindex="-1" aplicado
  // no clique deixa o HTML das seções intacto; preventScroll deixa a rolagem
  // suave acontecer enquanto o foco já se move.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}
</script>

<template>
  <div class="nds-docs-nav">
    <div
      v-for="group in groups"
      :key="group.label"
      class="nds-docs-nav-group"
    >
      <p class="nds-docs-nav-label">
        {{ group.label }}
      </p>
      <ul class="nds-docs-nav-list">
        <li
          v-for="section in group.sections"
          :key="section.id"
        >
          <button
            type="button"
            class="nds-docs-nav-button"
            :aria-current="activeSection === section.id ? 'location' : undefined"
            data-track="nav"
            :data-track-id="`${trackSlug}:nav:${section.id}`"
            :data-track-label="section.label"
            @click="scrollTo(section.id)"
          >
            {{ section.label }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
