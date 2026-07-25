<script setup lang="ts">
import FoundationsRenderer from '@/components/docs/shared/FoundationsRenderer.vue';
import translations from '@shared/content/foundations/tipografia/translations.json';
import { useTranslation } from '@/lib/i18n';
import DOMPurify from 'dompurify';

const { t } = useTranslation(translations);
</script>

<!--
  Specimens visuais usando os elementos HTML padrão — as regras `.nds-type-specimen` (typography.css) aplicam o type scale ativo.
  Textos vêm de translations.json (specimens.*); nds-m-0 zera as margens
  NATIVAS dos elementos base dentro do nds-stack.
-->
<template>
  <FoundationsRenderer
    component-slug="foundations/tipografia"
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
          class="nds-type-specimen nds-stack nds-rounded-lg nds-border-default nds-p-6 nds-bg-card"
          data-spacing="md"
        >
          <h1 class="nds-m-0">{{ t('specimens.h1') }}</h1>
          <h2 class="nds-m-0">{{ t('specimens.h2') }}</h2>
          <h3 class="nds-m-0">{{ t('specimens.h3') }}</h3>
          <h4 class="nds-m-0">{{ t('specimens.h4') }}</h4>
          <p
            class="nds-m-0 nds-text-foreground"
            v-html="DOMPurify.sanitize(t('specimens.body'))"
          />
          <label class="nds-block nds-text-foreground">{{ t('specimens.label') }}</label>
        </div>
      </section>
    </template>
  </FoundationsRenderer>
</template>
