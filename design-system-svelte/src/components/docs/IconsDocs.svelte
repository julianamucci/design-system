<script lang="ts">
  import { onDestroy } from 'svelte';
  import { icons } from 'lucide';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import iconsTranslations from '@shared/content/icons/translations.json';

  // ─── Catálogo de ícones ────────────────────────────────────────────────────

  type IconData = [string, Record<string, string>][];
  const ALL_ICONS = icons as Record<string, IconData>;
  const ALL_ICON_NAMES: string[] = Object.keys(ALL_ICONS);

  // Pré-constrói inner HTML de cada SVG uma vez — evita {#each} aninhado
  function buildInnerHtml(data: IconData): string {
    return data
      .map(([tag, attrs]) => {
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        return `<${tag} ${attrStr}/>`;
      })
      .join('');
  }

  const ICON_SVG_INNER: Record<string, string> = {};
  for (const name of ALL_ICON_NAMES) {
    ICON_SVG_INNER[name] = buildInnerHtml(ALL_ICONS[name]);
  }

  // ─── i18n ──────────────────────────────────────────────────────────────────

  const { tStore } = useTranslation(iconsTranslations);

  // ─── Estado ───────────────────────────────────────────────────────────────

  let search = $state('');
  let copied = $state<string | null>(null);
  let copiedTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── SEO + Analytics ──────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('description'),
      locale: $locale,
      componentSlug: 'icons',
    });
    track('docs_page_view', {
      component_name: 'icons',
      locale: $locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

  // ─── Filtro ───────────────────────────────────────────────────────────────

  const visibleSet = $derived.by(() => {
    const q = search.trim().toLowerCase().replace(/[\s\-_]+/g, '');
    if (!q) return null;
    return new Set(
      ALL_ICON_NAMES.filter((name) =>
        name.toLowerCase().replace(/[\s\-_]+/g, '').includes(q)
      )
    );
  });

  const filteredCount = $derived(visibleSet ? visibleSet.size : ALL_ICON_NAMES.length);
  const hasResults = $derived(filteredCount > 0);

  // ─── Texto interpolado ────────────────────────────────────────────────────

  const iconsAvailableText = $derived(
    $tStore('iconsAvailable').replace('{count}', String(ALL_ICON_NAMES.length))
  );

  const searchCountText = $derived.by(() => {
    const t = $tStore;
    if (search.trim()) {
      return t('search.results')
        .replace('{count}', String(filteredCount))
        .replace('{plural}', filteredCount !== 1 ? 's' : '')
        .replace('{query}', search);
    }
    return t('search.count').replace('{count}', String(filteredCount));
  });

  // ─── Copiar ───────────────────────────────────────────────────────────────

  function handleCopy(name: string) {
    navigator.clipboard
      .writeText(name)
      .then(() => {
        if (copiedTimer) clearTimeout(copiedTimer);
        copied = name;
        copiedTimer = setTimeout(() => { copied = null; }, 1500);
      })
      .catch(() => {});
  }

  onDestroy(() => {
    if (copiedTimer) clearTimeout(copiedTimer);
  });
</script>

<div class="sb-unstyled flex-1 h-full overflow-auto ds-docs">
  <div class="p-8 max-w-6xl mx-auto space-y-8">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="space-y-4 border-b border-border/50 pb-8">
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

      <div class="flex flex-wrap items-center gap-3 pt-1">
        <span class="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-xs font-mono border border-border/50 text-muted-foreground">
          <!-- Package icon inlined — avoid lucide-svelte (Svelte 4 compat issue) -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>
          lucide-svelte
        </span>
        <span class="text-sm text-muted-foreground/70">
          {iconsAvailableText}
        </span>
      </div>
    </header>

    <!-- ── Como usar ────────────────────────────────────────────────────── -->
    <section class="space-y-6 border-t border-border/50 pt-8">
      <h2 class="text-xl font-semibold text-foreground">{$tStore('howToUse.title')}</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">{$tStore('howToUse.individual.title')}</p>
          <pre class="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed"><code>{`import { Search, Settings, User } from 'lucide-svelte';

<Search class="h-4 w-4" aria-hidden="true" />`}</code></pre>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">{$tStore('howToUse.sizes.title')}</p>
          <pre class="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed"><code>{`h-3 w-3   // 12px — badges, captions
h-4 w-4   // 16px — padrão em texto e botões
h-5 w-5   // 20px — destaque em headers
h-6 w-6   // 24px — standalone / ilustrativo`}</code></pre>
        </div>
      </div>
    </section>

    <!-- ── Acessibilidade ──────────────────────────────────────────────── -->
    <section class="space-y-4 border-t border-border/50 pt-8">
      <h2 class="text-xl font-semibold text-foreground">{$tStore('accessibility.title')}</h2>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">
            {$tStore('accessibility.decorative.title')}
          </p>
          <pre class="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed"><code>{`<Button>
  <Save class="h-4 w-4" aria-hidden="true" />
  Salvar
</Button>`}</code></pre>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-foreground">
            {$tStore('accessibility.functional.title')}
          </p>
          <pre class="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed"><code>{`<Button
  size="icon"
  aria-label="Excluir produto"
>
  <Trash2 class="h-4 w-4" aria-hidden="true" />
</Button>`}</code></pre>
        </div>
      </div>
      <ul class="space-y-1.5 text-sm text-muted-foreground list-none p-0 m-0">
        {#each ['rule1', 'rule2', 'rule3', 'rule4'] as rule}
          <li class="flex gap-2 items-start list-none">
            <span class="text-primary mt-0.5 shrink-0">✓</span>
            <!-- eslint-disable svelte/no-at-html-tags -->
            {@html $tStore(`accessibility.${rule}`)}
          </li>
        {/each}
      </ul>
    </section>

    <!-- ── Busca ────────────────────────────────────────────────────────── -->
    <section class="space-y-3 border-t border-border/50 pt-8">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-foreground">{$tStore('search.title')}</h2>
        <p class="text-sm text-muted-foreground">{$tStore('search.subtitle')}</p>
      </div>
      <div class="relative">
        <!-- Search icon inlined -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          type="search"
          bind:value={search}
          placeholder={$tStore('search.placeholder')}
          aria-label={$tStore('search.placeholder')}
          class="flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
        />
      </div>
      <p class="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
        {searchCountText}
      </p>
    </section>

    <!-- ── Galeria ──────────────────────────────────────────────────────── -->

    <!-- Empty state — sempre no DOM, CSS controla visibilidade -->
    <div
      class="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground"
      class:hidden={hasResults}
      role="status"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 opacity-25" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <p class="font-medium">{$tStore('search.noResults')}</p>
      <p class="text-sm opacity-70">{$tStore('search.noResultsSub')}</p>
    </div>

    <!-- Grade de ícones — todos no DOM, visibility via CSS -->
    <ul
      class="grid gap-1 list-none p-0 m-0"
      class:hidden={!hasResults}
      style="grid-template-columns: repeat(auto-fill, minmax(96px, 1fr))"
      aria-label={iconsAvailableText}
    >
      {#each ALL_ICON_NAMES as name}
        {@const isCopied = copied === name}
        <li
          class="list-none"
          class:hidden={visibleSet !== null && !visibleSet.has(name)}
        >
          <button
            type="button"
            aria-label={`${$tStore('copy.tooltip')} ${name}`}
            class="group relative w-full flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors overflow-visible"
            onclick={() => handleCopy(name)}
          >
            <!-- Ícone / check — ambos no DOM, opacity via CSS -->
            <span class="h-6 w-6 flex items-center justify-center relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="absolute h-5 w-5 text-primary transition-opacity"
                class:opacity-0={!isCopied}
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors transition-opacity"
                class:opacity-0={isCopied}
                aria-hidden="true"
              >
                {@html ICON_SVG_INNER[name]}
              </svg>
            </span>

            <span class="text-[10px] text-muted-foreground text-center leading-tight break-all font-mono w-full line-clamp-2">
              {name}
            </span>

            <span
              class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            >
              {isCopied ? $tStore('copy.copied') : $tStore('copy.tooltip')}
            </span>
          </button>
        </li>
      {/each}
    </ul>

  </div>
</div>
