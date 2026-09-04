<script lang="ts">
/**
 * Bloco `<script>` comum, ao lado do `setup`, só para exportar os tipos: em
 * `<script setup>` tudo é escopo de componente e nada sai como export nomeado.
 *
 * Era por isso que a forma do grupo de navegação vivia declarada DUAS vezes
 * nesta stack, byte a byte igual, aqui e no `DocsPageLayout.vue` — e por isso
 * as 83 docs pages que montam `navGroups` conferiam cada uma contra a cópia do
 * arquivo que estivessem, não contra um contrato único.
 *
 * Hoje o tipo não nasce aqui: vem de `@shared/primitives/docs-nav`, que é o
 * mesmo para as cinco stacks. Este bloco só o repassa, para quem já importava
 * deste arquivo não precisar mudar.
 */
export type { DocsNavSection, DocsNavGroup } from '@shared/primitives/docs-nav';
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { deriveSlugFromUrl } from '@/lib/docs-tracking';
// Importado do módulo compartilhado, não do bloco ao lado. `export type { X }
// from '…'` REEXPORTA sem criar vínculo local, então o nome não fica em escopo
// aqui — e, pela mesma razão, importá-lo não colide com nada. Enquanto o bloco
// DECLARAVA o tipo era o oposto: os dois scripts do SFC dividem o mesmo escopo
// de módulo, e o import batia com a declaração (`TS2440`).
import type { DocsNavGroup } from '@shared/primitives/docs-nav';

const props = defineProps<{
  groups: DocsNavGroup[];
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
