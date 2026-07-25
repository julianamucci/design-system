<script setup lang="ts">
import DOMPurify from 'dompurify';
import ComponentDemo from '@/components/ComponentDemo.vue';
import { Card } from '@/components/ui/card';

defineProps<{
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
}>();
</script>

<template>
  <section id="anatomia">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <ComponentDemo>
      <div
        class="nds-stack nds-w-full"
        data-spacing="md"
      >
        <ol
          class="nds-stack nds-text-body nds-list-none"
          data-spacing="sm"
        >
          <li
            v-for="(item, i) in items"
            :key="i"
            class="nds-row nds-list-none"
            data-spacing="sm"
            data-align="start"
          >
            <span
              class="nds-pill"
              data-tone="primary"
            >
              {{ i + 1 }}
            </span>
            <span v-html="DOMPurify.sanitize(item)" />
          </li>
        </ol>
        <Card class="nds-bg-muted-soft nds-border-soft nds-shadow-none nds-p-4 nds-overflow-x">
          <p
            v-if="structureLabel"
            class="nds-text-caption nds-text-muted-foreground nds-mb-2"
          >
            {{ structureLabel }}
          </p>
          <pre class="nds-font-mono nds-text-body nds-whitespace-pre">{{ structureCode }}</pre>
        </Card>
      </div>
    </ComponentDemo>
  </section>
</template>
