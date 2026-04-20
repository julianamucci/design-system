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
}>();

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <div class="space-y-6">
    <div v-for="group in groups" :key="group.label">
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
        {{ group.label }}
      </p>
      <ul class="list-none space-y-1 p-0 m-0">
        <li v-for="section in group.sections" :key="section.id" class="list-none">
          <button
            type="button"
            :aria-current="activeSection === section.id ? 'location' : undefined"
            :class="[
              'w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeSection === section.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            ]"
            @click="scrollTo(section.id)"
          >
            {{ section.label }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
