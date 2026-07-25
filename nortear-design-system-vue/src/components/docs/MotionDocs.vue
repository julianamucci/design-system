<script setup lang="ts">
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
</script>

<!--
  Specimens: botões com hover demonstrando cada duração. O timing-function é
  o token padrão do sistema (cubic-bezier(.4,0,.2,1)). prefers-reduced-motion
  é tratado globalmente pelo motion.css — não precisa de tratamento aqui.
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
          <h2 class="nds-text-h2 nds-text-foreground">{{ t('specimens.title') }}</h2>
          <p class="nds-text-body">{{ t('specimens.subtitle') }}</p>
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
    </template>
  </FoundationsRenderer>
</template>
