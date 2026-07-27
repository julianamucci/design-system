<script setup lang="ts">
import DOMPurify from 'dompurify';
import FoundationsRenderer from '@/components/docs/shared/FoundationsRenderer.vue';
import translations from '@shared/content/foundations/internacionalizacao/translations.json';
import { useTranslation } from '@/lib/i18n';

// Seção exclusiva desta stack — vive aqui (não no translations.json
// compartilhado) para não vazar menção de stack nas docs das demais.
const LOCAL = {
  'pt-BR': {
    localeRule: {
      title: 'Regra crítica de locale nesta stack',
      body: 'Em docs pages, o locale vem <strong>sempre</strong> de <code>useTranslation()</code> — nunca de <code>useLocaleStore</code> ou de qualquer store Pinia. Misturar fontes de locale causa crash em runtime (referência circular durante hydration).',
    },
  },
  en: {
    localeRule: {
      title: 'Critical locale rule in this stack',
      body: 'In docs pages, the locale <strong>always</strong> comes from <code>useTranslation()</code> — never from <code>useLocaleStore</code> or any Pinia store. Mixing locale sources causes a runtime crash (circular reference during hydration).',
    },
  },
  es: {
    localeRule: {
      title: 'Regla crítica de locale en este stack',
      body: 'En las docs pages, el locale viene <strong>siempre</strong> de <code>useTranslation()</code> — nunca de <code>useLocaleStore</code> ni de ningún store Pinia. Mezclar fuentes de locale causa un crash en runtime (referencia circular durante la hydration).',
    },
  },
};

const { t } = useTranslation(LOCAL);
</script>

<template>
  <FoundationsRenderer
    component-slug="foundations/internacionalizacao"
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
            {{ t('localeRule.title') }}
          </h2>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p
          class="nds-text-body nds-leading-relaxed nds-accent-start"
          v-html="DOMPurify.sanitize(t('localeRule.body'))"
        />
      </section>
    </template>
  </FoundationsRenderer>
</template>
