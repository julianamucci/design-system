<script setup lang="ts">
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';

interface DocsKeyboardItem { key: string; description: string }

// As chaves de `accessibility.screenReader` variam por componente
// (`closed/open/disabled`, `onOpen/onClose`, …), então o container recebe só os
// valores — quem chama passa `Object.values(...)`.
withDefaults(defineProps<{
  title: string;
  summary: string;
  items?: string[];
  keyboardTitle?: string;
  keyboardItems: DocsKeyboardItem[];
  screenReaderTitle?: string;
  screenReaderItems?: string[];
  contrast?: string;
}>(), {
  items: () => [],
  keyboardTitle: '',
  screenReaderTitle: '',
  screenReaderItems: () => [],
  contrast: '',
});
</script>

<template>
  <section id="acessibilidade">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <Card
      class="nds-p-4 nds-stack"
      data-spacing="lg"
    >
      <div
        class="nds-stack"
        data-spacing="md"
      >
        <p
          class="nds-text-body nds-leading-relaxed"
          v-html="DOMPurify.sanitize(summary)"
        />
        <ul
          class="nds-stack nds-text-body nds-list-disc"
          data-spacing="sm"
        >
          <li
            v-for="(item, i) in items"
            :key="i"
            class="nds-leading-relaxed"
            v-html="DOMPurify.sanitize(item)"
          />
        </ul>
        <p
          v-if="contrast"
          class="nds-text-body nds-leading-relaxed"
          v-html="DOMPurify.sanitize(contrast)"
        />
      </div>
      <div>
        <h3
          v-if="keyboardTitle"
          class="nds-text-base nds-font-semibold nds-mb-4"
        >
          {{ keyboardTitle }}
        </h3>
        <div
          class="nds-grid"
          data-cols="2"
          data-spacing="sm"
        >
          <Card
            v-for="(item, i) in keyboardItems"
            :key="i"
            class="nds-border-none nds-shadow-none nds-bg-muted-soft nds-p-4 nds-card-nested"
          >
            <div
              class="nds-row"
              data-spacing="sm"
              data-align="start"
            >
              <kbd class="nds-kbd">
                {{ item.key }}
              </kbd>
              <span class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">{{ item.description }}</span>
            </div>
          </Card>
        </div>
      </div>
      <div v-if="screenReaderItems.length">
        <h3
          v-if="screenReaderTitle"
          class="nds-text-base nds-font-semibold nds-mb-4"
        >
          {{ screenReaderTitle }}
        </h3>
        <ul
          class="nds-stack nds-text-body nds-list-disc"
          data-spacing="sm"
        >
          <li
            v-for="(item, i) in screenReaderItems"
            :key="i"
            class="nds-leading-relaxed"
            v-html="DOMPurify.sanitize(item)"
          />
        </ul>
      </div>
    </Card>
  </section>
</template>
