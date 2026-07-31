<script lang="ts">
  import { locale, setLocale, type Locale } from '@/lib/i18n';
  import { track } from '@/lib/analytics';

  const locales: { value: Locale; label: string; ariaLabel: string }[] = [
    { value: 'pt-BR', label: 'PT', ariaLabel: 'Português' },
    { value: 'en',    label: 'EN', ariaLabel: 'English'   },
    { value: 'es',    label: 'ES', ariaLabel: 'Español'   },
  ];

  function handleChange(value: Locale) {
    if (value === $locale) return;
    track('language_switched', {
      previous_language: $locale,
      new_language: value,
    });
    setLocale(value);
  }
</script>

<div class="nds-lang-switcher" role="group" aria-label="Idioma">
  {#each locales as lang (lang.value)}
    <button
      type="button"
      class="nds-lang-switcher-button"
      data-locale={lang.value}
      aria-label={lang.ariaLabel}
      aria-pressed={$locale === lang.value}
      onclick={() => handleChange(lang.value)}
    >
      {lang.label}
    </button>
  {/each}
</div>
