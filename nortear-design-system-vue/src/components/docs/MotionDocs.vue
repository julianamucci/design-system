<script setup lang="ts">
import { ref } from 'vue';
import { motion, AnimatePresence } from 'motion-v';
import FoundationsRenderer from '@/components/docs/shared/FoundationsRenderer.vue';
import translations from '@shared/content/foundations/motion/translations.json';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

const { t } = useTranslation(translations);

const DURATIONS = [
  { token: '--transition-fast', label: 'fast — 150ms' },
  { token: '--transition-normal', label: 'normal — 300ms' },
  { token: '--transition-slow', label: 'slow — 500ms' },
];

const STAGGER_ITEMS = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
const SPRING = { type: 'spring', stiffness: 400, damping: 22 } as const;

const run = ref(0);
const show = ref(true);

const CODE_SPRING = `// npm i motion-v
<script setup>
import { motion } from 'motion-v';
<\/script>

<motion.div
  drag
  :drag-snap-to-origin="true"
  :while-drag="{ scale: 1.05 }"
  :transition="{ type: 'spring', stiffness: 400, damping: 22 }"
/>`;

const CODE_STAGGER = `<motion.li
  v-for="(item, i) in items"
  :key="item"
  :initial="{ opacity: 0, y: 8 }"
  :animate="{ opacity: 1, y: 0 }"
  :transition="{ delay: i * 0.06 }"
>
  {{ item }}
</motion.li>`;

const CODE_PRESENCE = `import { AnimatePresence, motion } from 'motion-v';

<AnimatePresence>
  <motion.div
    v-if="open"
    :initial="{ opacity: 0, scale: 0.95 }"
    :animate="{ opacity: 1, scale: 1 }"
    :exit="{ opacity: 0, scale: 0.95 }"
  />
</AnimatePresence>`;
</script>

<!--
  Specimens: botões com hover demonstrando cada duração + demos interativas da
  biblioteca Motion (motion-v, MIT) — springs, stagger e presence. As
  micro-interações dos componentes continuam CSS-first (ver motion.css).
-->
<template>
  <FoundationsRenderer
    component-slug="foundations/motion"
    :translations="translations"
  >
    <template #extra>
      <section
        class="nds-stack nds-docs-section-divider"
        data-spacing="md"
      >
        <div
          class="nds-stack"
          data-spacing="xs"
        >
          <h2 class="nds-text-h2 nds-text-foreground">
            {{ t('specimens.title') }}
          </h2>
          <p class="nds-text-body">
            {{ t('specimens.subtitle') }}
          </p>
        </div>

        <div
          class="nds-cluster nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft"
          data-spacing="md"
        >
          <Button
            v-for="d in DURATIONS"
            :key="d.token"
            variant="outline"
            class="nds-hover-bg-primary nds-hover-text-primary-foreground nds-hover-scale-105"
            :style="{
              transitionProperty: 'background-color, color, transform',
              transitionDuration: `var(${d.token})`,
              transitionTimingFunction: 'var(--transition-timing, cubic-bezier(0.4, 0, 0.2, 1))',
            }"
          >
            {{ d.label }}
          </Button>
        </div>
      </section>

      <section
        class="nds-stack nds-docs-section-divider"
        data-spacing="md"
      >
        <div
          class="nds-stack"
          data-spacing="xs"
        >
          <h2 class="nds-text-h2 nds-text-foreground">
            {{ t('specimens.advanced.title') }}
          </h2>
          <p class="nds-text-body">
            {{ t('specimens.advanced.subtitle') }}
          </p>
        </div>

        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <h3 class="nds-text-body nds-font-medium">
            {{ t('specimens.advanced.spring.title') }}
          </h3>
          <p class="nds-text-body">
            {{ t('specimens.advanced.spring.desc') }}
          </p>
          <div
            class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-cluster"
            data-align="center"
            data-justify="center"
            style="min-height: 9rem; overflow: hidden"
          >
            <motion.div
              drag
              :drag-snap-to-origin="true"
              :while-drag="{ scale: 1.05 }"
              :transition="SPRING"
              class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption nds-font-medium nds-cursor-pointer"
              style="touch-action: none; user-select: none"
            >
              {{ t('specimens.advanced.labels.drag') }}
            </motion.div>
          </div>
          <pre class="nds-code-block"><code>{{ CODE_SPRING }}</code></pre>
        </div>

        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <h3 class="nds-text-body nds-font-medium">
            {{ t('specimens.advanced.stagger.title') }}
          </h3>
          <p class="nds-text-body">
            {{ t('specimens.advanced.stagger.desc') }}
          </p>
          <div
            class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack"
            data-spacing="sm"
            style="min-height: 9rem"
          >
            <div>
              <Button
                variant="outline"
                size="sm"
                @click="run++"
              >
                {{ t('specimens.advanced.labels.replay') }}
              </Button>
            </div>
            <ul
              :key="run"
              class="nds-cluster nds-list-none"
              data-spacing="sm"
            >
              <motion.li
                v-for="(item, i) in STAGGER_ITEMS"
                :key="item"
                :initial="{ opacity: 0, y: 8 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ delay: i * 0.06 }"
                class="nds-bg-muted-50 nds-rounded-md nds-px-4 nds-py-2 nds-text-caption"
              >
                {{ item }}
              </motion.li>
            </ul>
          </div>
          <pre class="nds-code-block"><code>{{ CODE_STAGGER }}</code></pre>
        </div>

        <div
          class="nds-stack"
          data-spacing="sm"
        >
          <h3 class="nds-text-body nds-font-medium">
            {{ t('specimens.advanced.presence.title') }}
          </h3>
          <p class="nds-text-body">
            {{ t('specimens.advanced.presence.desc') }}
          </p>
          <div
            class="nds-bg-card nds-border-soft nds-rounded-lg nds-p-6 nds-stack"
            data-spacing="sm"
            style="min-height: 9rem; align-items: center"
          >
            <Button
              variant="outline"
              size="sm"
              @click="show = !show"
            >
              {{ show ? t('specimens.advanced.labels.hide') : t('specimens.advanced.labels.show') }}
            </Button>
            <AnimatePresence>
              <motion.div
                v-if="show"
                :initial="{ opacity: 0, scale: 0.95 }"
                :animate="{ opacity: 1, scale: 1 }"
                :exit="{ opacity: 0, scale: 0.95 }"
                class="nds-bg-primary-soft nds-border-primary-soft nds-rounded-lg nds-p-4 nds-text-caption"
              >
                Presence
              </motion.div>
            </AnimatePresence>
          </div>
          <pre class="nds-code-block"><code>{{ CODE_PRESENCE }}</code></pre>
        </div>

        <p class="nds-text-body nds-accent-start">
          {{ t('specimens.advanced.note') }}
        </p>
      </section>
    </template>
  </FoundationsRenderer>
</template>
