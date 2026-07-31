<script setup lang="ts">
import DOMPurify from 'dompurify';
import ComponentDemo from '@/components/ComponentDemo.vue';
import { CodeBlock } from '@/components/ui/code-block';

withDefaults(defineProps<{
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
  /** Linguagem do snippet de estrutura, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}>(), {
  language: 'vue',
});
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
        <div>
          <p
            v-if="structureLabel"
            class="nds-text-caption nds-text-muted-foreground nds-mb-2"
          >
            {{ structureLabel }}
          </p>
          <CodeBlock
            :code="structureCode"
            :language="language"
            :show-line-numbers="false"
            :copy-label="copyLabel"
            :copied-label="copiedLabel"
          />
        </div>
      </div>
    </ComponentDemo>
  </section>
</template>
