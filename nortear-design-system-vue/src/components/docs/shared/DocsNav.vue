<script setup lang="ts">
interface Section {
  id: string;
  label: string;
}

interface Group {
  label: string;
  sections: Section[];
}

defineProps<{
  groups: Group[];
  activeSection?: string;
  /** Slug do componente — usado no data-track-id (ex: "alert" → `alert:nav:anatomia`). */
  componentSlug?: string;
}>();

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            :data-track-id="componentSlug ? `${componentSlug}:nav:${section.id}` : undefined"
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
