<script setup lang="ts">
import { useI18nStore } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const store = useI18nStore();
const locales = [
  { value: 'pt-BR', label: 'PT' },
  { value: 'en',    label: 'EN' },
  { value: 'es',    label: 'ES' },
];

function handleChange(value: string) {
  if (!value || value === store.locale) return;
  track('language_switched', {
    previous_language: store.locale as 'pt-BR' | 'en' | 'es',
    new_language: value as 'pt-BR' | 'en' | 'es',
  });
  store.setLocale(value as 'pt-BR' | 'en' | 'es');
}
</script>

<template>
  <div class="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/40">
    <button
      v-for="lang in locales"
      :key="lang.value"
      @click="handleChange(lang.value)"
      :class="['h-6 px-2 text-[10px] font-bold rounded transition-all',
        store.locale === lang.value
          ? 'bg-secondary text-secondary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50']"
      :aria-pressed="store.locale === lang.value"
    >
      {{ lang.label }}
    </button>
  </div>
</template>
