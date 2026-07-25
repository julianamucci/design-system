<script lang="ts">
  import { untrack } from 'svelte';
  import FoundationPage from './shared/FoundationPage.svelte';
  import { Button } from '@/components/ui/button';
  import { useTranslation } from '@/lib/i18n';
  import translations from '@shared/content/foundations/motion/translations.json';

  const { tStore } = untrack(() => useTranslation(translations));

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
<FoundationPage {translations} componentSlug="motion">
  {#snippet extra()}
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('specimens.title')}</h2>
        <p class="nds-text-body">{$tStore('specimens.subtitle')}</p>
      </div>

      <div class="nds-cluster nds-p-6 nds-bg-card nds-rounded-lg nds-border-soft" data-spacing="md">
        {#each DURATIONS as d (d.token)}
          <Button
            variant="outline"
            class="nds-hover-bg-primary nds-hover-text-primary-foreground nds-hover-scale-105"
            style="transition-property: background-color, color, transform; transition-duration: var({d.token}); transition-timing-function: var(--transition-timing, cubic-bezier(0.4, 0, 0.2, 1))"
          >
            {d.label}
          </Button>
        {/each}
      </div>
    </section>
  {/snippet}
</FoundationPage>
