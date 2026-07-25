<script lang="ts">
  import { untrack } from 'svelte';
  import FoundationPage from './shared/FoundationPage.svelte';
  import { useTranslation } from '@/lib/i18n';
  import translations from '@shared/content/foundations/tipografia/translations.json';

  // translations é import estático; tStore continua reativo ao locale.
  const { tStore } = untrack(() => useTranslation(translations));
</script>

<!--
  Specimens visuais usando os elementos HTML padrão — as regras `.nds-type-specimen` (typography.css) aplicam o type scale ativo.
  Textos vêm de translations.json (specimens.*); nds-m-0 zera as margens
  NATIVAS dos elementos base dentro do nds-stack.
-->
<FoundationPage {translations} componentSlug="tipografia">
  {#snippet extra()}
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('specimens.title')}</h2>
        <p class="nds-text-body">{$tStore('specimens.subtitle')}</p>
      </div>

      <div class="nds-type-specimen nds-stack nds-rounded-lg nds-border-default nds-p-6 nds-bg-card" data-spacing="md">
        <h1 class="nds-m-0">{$tStore('specimens.h1')}</h1>
        <h2 class="nds-m-0">{$tStore('specimens.h2')}</h2>
        <h3 class="nds-m-0">{$tStore('specimens.h3')}</h3>
        <h4 class="nds-m-0">{$tStore('specimens.h4')}</h4>
        <p class="nds-m-0 nds-text-foreground">{@html $tStore('specimens.body')}</p>
        <label class="nds-block nds-text-foreground">{$tStore('specimens.label')}</label>
      </div>
    </section>
  {/snippet}
</FoundationPage>
