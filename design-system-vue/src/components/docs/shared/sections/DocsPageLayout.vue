<script setup lang="ts">
import DocsNav from '../DocsNav.vue';

interface Section {
  id: string;
  label: string;
}

interface Group {
  label: string;
  sections: Section[];
}

defineProps<{
  navGroups: Group[];
  activeSection?: string;
}>();
</script>

<template>
  <div class="ds-docs p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
    <slot name="header" />

    <div class="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
      <nav
        aria-label="Navegação das seções do componente"
        class="w-full lg:sticky lg:top-8 lg:w-52 lg:shrink-0 self-start space-y-5"
      >
        <DocsNav :groups="navGroups" :active-section="activeSection" />
      </nav>

      <div class="ds-docs flex-1 min-w-0 w-full space-y-12">
        <slot />
      </div>
    </div>
  </div>
</template>
