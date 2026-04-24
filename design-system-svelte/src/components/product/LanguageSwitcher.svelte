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

<div class="flex items-center gap-1 bg-muted/30 p-1 rounded-(--radius-input) border border-border/40">
  {#each locales as lang}
    <button
      type="button"
      aria-label={lang.ariaLabel}
      aria-pressed={$locale === lang.value}
      onclick={() => handleChange(lang.value)}
      class={[
        'h-(--height-xs) px-2 text-[10px] font-bold rounded-(--radius-button) transition-all',
        $locale === lang.value
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
      ].join(' ')}
    >
      {lang.label}
    </button>
  {/each}
</div>
