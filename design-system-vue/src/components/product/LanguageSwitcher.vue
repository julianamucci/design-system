<script setup lang="ts">
import { useI18nStore } from '@/lib/i18n';
import { track } from '@/lib/analytics';

/**
 * Componente de Produto: Seletor de Idioma.
 * Botões PT/EN/ES agrupados via CSS standalone `.nds-lang-switcher` (mesma
 * aparência das 4 stacks). Seleção única via `aria-pressed`. Rastreia trocas
 * de idioma via GA4.
 */
const store = useI18nStore();
const locales = [
  { value: 'pt-BR', label: 'PT', ariaLabel: 'Português' },
  { value: 'en',    label: 'EN', ariaLabel: 'English' },
  { value: 'es',    label: 'ES', ariaLabel: 'Español' },
] as const;

function handleChange(value: 'pt-BR' | 'en' | 'es') {
  if (value === store.locale) return;
  track('language_switched', {
    previous_language: store.locale as 'pt-BR' | 'en' | 'es',
    new_language: value,
  });
  store.setLocale(value);
}
</script>

<template>
  <div class="nds-lang-switcher" role="group" aria-label="Idioma">
    <button
      v-for="lang in locales"
      :key="lang.value"
      type="button"
      class="nds-lang-switcher-button"
      :data-locale="lang.value"
      :aria-label="lang.ariaLabel"
      :aria-pressed="store.locale === lang.value"
      @click="handleChange(lang.value)"
    >
      {{ lang.label }}
    </button>
  </div>
</template>
