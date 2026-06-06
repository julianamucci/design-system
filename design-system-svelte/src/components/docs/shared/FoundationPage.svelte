<script lang="ts">
  /**
   * Wrapper de página Foundations.
   * Renderiza header (badges + título + descrição + LanguageSwitcher),
   * aplica SEO e dispara analytics, e itera as seções top-level do JSON
   * delegando a renderização para FoundationSection.
   */
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import FoundationSection from './FoundationSection.svelte';

  type Props = {
    translations: Record<string, unknown>;
    componentSlug: string;
  };

  let { translations, componentSlug }: Props = $props();

  const { tStore } = useTranslation(translations);

  const META_KEYS = new Set(['title', 'category', 'type', 'description', 'seo', 'nav']);

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

<div class="sb-unstyled flex-1 h-full overflow-auto ds-docs">
  <div class="p-8 max-w-6xl mx-auto space-y-8">

    <!-- Header -->
    <header class="space-y-4 pb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Badge variant="secondary" class="rounded-md bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
            {$tStore('category')}
          </Badge>
          <Badge variant="outline" class="rounded-md text-muted-foreground font-normal px-2 py-0">
            {$tStore('type')}
          </Badge>
        </div>
        <LanguageSwitcher />
      </div>

      <h1 class="text-4xl font-bold tracking-tight text-foreground">
        {$tStore('title')}
      </h1>

      <p class="text-muted-foreground max-w-3xl leading-relaxed">
        {$tStore('description')}
      </p>
    </header>

    {#each sections as [key, value] (key)}
      <section class="space-y-6 border-t border-border/50 pt-8">
        <FoundationSection node={value} level={2} />
      </section>
    {/each}

  </div>
</div>
