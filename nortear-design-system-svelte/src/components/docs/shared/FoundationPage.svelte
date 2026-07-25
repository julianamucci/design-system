<script lang="ts">
  /**
   * Wrapper de página Foundations.
   * Renderiza header (badges + título + descrição + LanguageSwitcher),
   * aplica SEO e dispara analytics, e itera as seções top-level do JSON
   * delegando a renderização para FoundationSection.
   */
  import { untrack, type Snippet } from 'svelte';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import FoundationSection from './FoundationSection.svelte';

  type Props = {
    translations: Record<string, unknown>;
    componentSlug: string;
    /** Seção visual custom (specimens) renderizada após o header. */
    extra?: Snippet;
  };

  let { translations, componentSlug, extra }: Props = $props();

  // translations é um import estático por página (não muda em runtime); tStore
  // continua reativo ao locale internamente (useTranslation deriva do store de
  // locale). untrack silencia o aviso state_referenced_locally do Svelte 5.
  const { tStore } = untrack(() => useTranslation(translations));

  // `specimens` é renderizado pela própria página via snippet `extra` (visual custom).
  const META_KEYS = new Set(['title', 'category', 'type', 'description', 'seo', 'nav', 'specimens']);

  // Seções top-level do locale corrente (excluindo metadados).
  const sections = $derived.by(() => {
    const raw = (translations as Record<string, any>)[$locale]
      ?? (translations as Record<string, any>)['pt-BR']
      ?? {};
    return Object.entries(raw).filter(([k]) => !META_KEYS.has(k));
  });

  $effect(() => {
    const t = $tStore;
    const seoBlock = ((translations as Record<string, any>)[$locale]?.seo
      ?? (translations as Record<string, any>)['pt-BR']?.seo
      ?? {}) as Record<string, string>;
    const cleanup = applySeo({
      title: seoBlock.title ?? t('title'),
      description: seoBlock.description ?? t('description'),
      locale: $locale,
      componentSlug,
      aiSummary: seoBlock.aiSummary,
      aiEntities: seoBlock.aiEntities,
      aiIntent: seoBlock.aiIntent,
    });
    track('docs_page_view', {
      component_name: componentSlug,
      locale: $locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });
</script>

<div class="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs">
  <div class="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto" data-spacing="xl">

    <!-- Header -->
    <header class="nds-stack nds-pb-8">
      <div class="nds-cluster nds-w-full" data-spacing="sm" data-align="center">
        <Badge variant="secondary" class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium">
          {$tStore('category')}
        </Badge>
        <Badge variant="outline" class="nds-text-muted-foreground nds-font-normal">
          {$tStore('type')}
        </Badge>
        <div class="nds-spacer-start">
          <LanguageSwitcher />
        </div>
      </div>

      <h1 class="nds-text-h1 nds-text-foreground">
        {$tStore('title')}
      </h1>

      <p class="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose">
        {@html $tStore('description')}
      </p>
    </header>

    {@render extra?.()}

    {#each sections as [key, value] (key)}
      <section class="nds-stack nds-docs-section-divider" data-spacing="md">
        <FoundationSection node={value} level={2} />
      </section>
    {/each}

  </div>
</div>
