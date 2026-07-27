<script lang="ts">
  import { onDestroy } from 'svelte';
  // Catálogo de ícones como JSON único (1 módulo) em vez de `import { icons }
  // from 'lucide'` (que puxava ~5.5k módulos por-ícone e dominava o build).
  // Regenerar quando atualizar o lucide:
  //   node --input-type=module -e "import {icons} from 'lucide'; import {writeFileSync} from 'fs'; writeFileSync('src/lib/lucide-icons.json', JSON.stringify(icons))"
  import icons from '@/lib/lucide-icons.json';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import DOMPurify from 'dompurify';
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
      kind: 'guide',
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

<div class="sb-unstyled nds-flex-1 nds-w-full ds-docs" style="height: 100%; overflow: auto">
  <div class="nds-p-8 nds-stack" data-spacing="xl" style="max-width: 72rem; margin-inline: auto">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="nds-stack nds-border-b-soft nds-pb-8" style="padding-bottom: 2rem">
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

      <h1 class="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground">
        {$tStore('title')}
      </h1>

      <p class="nds-text-muted-foreground nds-leading-relaxed" style="max-width: 48rem">
        {$tStore('description')}
      </p>

      <div class="nds-cluster" data-spacing="sm" data-align="center" style="padding-top: 0.25rem">
        <span class="nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default">
          <!-- Package icon inlined (SVG) — sem depender de componente de ícone -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>
          @lucide/svelte
        </span>
        <span class="nds-text-body nds-text-muted-foreground" style="opacity: 0.7">
          {iconsAvailableText}
        </span>
      </div>
    </header>

    <!-- ── Como usar ────────────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
      <h2 class="nds-text-h2 nds-text-foreground">{$tStore('howToUse.title')}</h2>
      <div class="nds-grid" data-spacing="md" data-min="18rem">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-medium">{$tStore('howToUse.individual.title')}</p>
          <pre class="nds-docs-code"><code>{`import Search from '@lucide/svelte/icons/search';

<Search class="nds-icon" aria-hidden="true" />`}</code></pre>
        </div>
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-medium">{$tStore('howToUse.sizes.title')}</p>
          <pre class="nds-docs-code"><code>{`h-3 w-3   // 12px — badges, captions
h-4 w-4   // 16px — padrão em texto e botões
h-5 w-5   // 20px — destaque em headers
h-6 w-6   // 24px — standalone / ilustrativo`}</code></pre>
        </div>
      </div>
    </section>

    <!-- ── Acessibilidade ──────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <h2 class="nds-text-h2 nds-text-foreground">{$tStore('accessibility.title')}</h2>
      <div class="nds-grid" data-spacing="sm" data-min="18rem">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-medium">
            {$tStore('accessibility.decorative.title')}
          </p>
          <pre class="nds-docs-code"><code>{`<Button>
  <Save class="nds-icon" aria-hidden="true" />
  Salvar
</Button>`}</code></pre>
        </div>
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-medium">
            {$tStore('accessibility.functional.title')}
          </p>
          <pre class="nds-docs-code"><code>{`<Button
  size="icon"
  aria-label="Excluir produto"
>
  <Trash2 class="nds-icon" aria-hidden="true" />
</Button>`}</code></pre>
        </div>
      </div>
      <ul class="nds-stack nds-text-body nds-text-muted-foreground nds-list-none nds-p-0 nds-m-0" data-spacing="xs">
        {#each ['rule1', 'rule2', 'rule3', 'rule4'] as rule}
          <li class="nds-cluster nds-list-none" data-spacing="sm" data-align="start">
            <span class="nds-text-primary nds-shrink-0 nds-mt-0-5">✓</span>
            <!-- eslint-disable svelte/no-at-html-tags -->
            <span>{@html DOMPurify.sanitize($tStore(`accessibility.${rule}`))}</span>
          </li>
        {/each}
      </ul>
    </section>

    <!-- ── Busca ────────────────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="sm">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('search.title')}</h2>
        <p class="nds-text-body">{$tStore('search.subtitle')}</p>
      </div>
      <div class="nds-icon-search-wrap">
        <!-- Search icon inlined -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nds-icon-search-svg" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          type="search"
          bind:value={search}
          placeholder={$tStore('search.placeholder')}
          aria-label={$tStore('search.placeholder')}
          class="nds-icon-search-input"
        />
      </div>
      <p class="nds-text-body" aria-live="polite" aria-atomic="true">
        {searchCountText}
      </p>
    </section>

    <!-- ── Galeria ──────────────────────────────────────────────────────── -->

    <!-- Empty state — sempre no DOM, CSS controla visibilidade -->
    <div
      class="nds-icon-empty-state"
      class:is-visible={!hasResults}
      role="status"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nds-icon-empty-state-svg" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <p class="nds-font-medium">{$tStore('search.noResults')}</p>
      <p class="nds-text-body" style="opacity: 0.7">{$tStore('search.noResultsSub')}</p>
    </div>

    <!-- Grade de ícones — todos no DOM, visibility via CSS -->
    <ul
      class="nds-icon-grid"
      class:is-hidden={!hasResults}
      aria-label={iconsAvailableText}
    >
      {#each ALL_ICON_NAMES as name}
        {@const isCopied = copied === name}
        <li
          class="nds-icon-grid-item"
          class:is-hidden={visibleSet !== null && !visibleSet.has(name)}
        >
          <button
            type="button"
            aria-label={`${$tStore('copy.tooltip')} ${name}`}
            class="nds-icon-tile"
            onclick={() => handleCopy(name)}
          >
            <!-- Ícone / check — ambos no DOM, opacity via CSS -->
            <span class="nds-icon-tile-svg" style="position: relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="nds-icon-lg nds-text-primary"
                style="position: absolute; opacity: {isCopied ? 1 : 0}; transition: opacity var(--duration-fast)"
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
                class="nds-icon-lg"
                style="opacity: {isCopied ? 0 : 1}; transition: opacity var(--duration-fast)"
                aria-hidden="true"
              >
                {@html DOMPurify.sanitize(ICON_SVG_INNER[name])}
              </svg>
            </span>

            <span class="nds-icon-tile-name">
              {name}
            </span>

            <span
              class="nds-icon-tile-tooltip"
              style="opacity: {isCopied ? 1 : 0}"
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
