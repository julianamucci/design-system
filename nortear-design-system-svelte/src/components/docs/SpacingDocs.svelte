<script lang="ts">
  import { untrack } from 'svelte';
  import FoundationPage from './shared/FoundationPage.svelte';
  import { useTranslation } from '@/lib/i18n';
  import translations from '@shared/content/foundations/espacamento/translations.json';

  const { tStore } = untrack(() => useTranslation(translations));

  // Barras coloridas com largura igual a cada token de spacing — visualiza a
  // escala em pixels concretos. Width aplicado via var(--spacing-*) reage à
  // densidade ativa (condensado / default / confortável).
  const SPACING_TOKENS: Array<{ name: string; varName: string; px: string }> = [
    { name: 'spacing-px', varName: '--spacing-px', px: '1px' },
    { name: 'spacing-0-5', varName: '--spacing-0-5', px: '2px' },
    { name: 'spacing-1', varName: '--spacing-1', px: '4px' },
    { name: 'spacing-2', varName: '--spacing-2', px: '8px' },
    { name: 'spacing-4', varName: '--spacing-4', px: '16px' },
    { name: 'spacing-6', varName: '--spacing-6', px: '24px' },
    { name: 'spacing-8', varName: '--spacing-8', px: '32px' },
    { name: 'spacing-10', varName: '--spacing-10', px: '40px' },
    { name: 'spacing-12', varName: '--spacing-12', px: '48px' },
    { name: 'spacing-14', varName: '--spacing-14', px: '56px' },
    { name: 'spacing-16', varName: '--spacing-16', px: '64px' },
    { name: 'spacing-20', varName: '--spacing-20', px: '80px' },
    { name: 'spacing-24', varName: '--spacing-24', px: '96px' },
  ];
</script>

<FoundationPage {translations} componentSlug="espacamento">
  {#snippet extra()}
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('specimens.title')}</h2>
        <p class="nds-text-body">{$tStore('specimens.subtitle')}</p>
      </div>
      <div class="nds-stack nds-bg-card nds-border-soft nds-rounded-lg nds-p-6" data-spacing="sm">
        {#each SPACING_TOKENS as tok (tok.name)}
          <div class="nds-row" data-align="center" data-spacing="md">
            <code class="nds-text-caption nds-text-muted-foreground nds-shrink-0" style="width: 8rem">{tok.name}</code>
            <div
              class="nds-bg-primary nds-rounded-sm nds-shrink-0"
              style="width: var({tok.varName}); height: var(--spacing-4)"
              aria-hidden="true"
            ></div>
            <span class="nds-text-caption nds-text-muted-foreground">{tok.px}</span>
          </div>
        {/each}
      </div>
    </section>
  {/snippet}
</FoundationPage>
