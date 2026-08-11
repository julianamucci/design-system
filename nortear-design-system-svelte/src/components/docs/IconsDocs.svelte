<script lang="ts">
  import { onDestroy } from 'svelte';
  // Catálogo de ícones como JSON único, agora COMPARTILHADO pelas cinco stacks
  // (`docs/shared/content/icons/lucide-icons.json`) em vez de uma cópia local.
  // A escolha continua sendo a certa e passou a valer para todo mundo — a
  // medição de 2026-08-11 está no docblock do catálogo. A cópia que vivia aqui
  // estava 12 ícones atrás do pacote (1991 contra 2003).
  import {
    CATALOGO_LUCIDE,
    NOMES_DE_ICONE,
    montarSvgDoIcone,
  } from '@shared/primitives/lucide-catalog';
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import { mountDocsTracking } from '@/lib/docs-tracking';
  import DOMPurify from 'dompurify';
  import iconsTranslations from '@shared/content/icons/translations.json';

  // ─── Catálogo de ícones ────────────────────────────────────────────────────

  const ALL_ICON_NAMES: string[] = NOMES_DE_ICONE;

  // Pré-constrói o SVG INTEIRO de cada ícone uma vez — evita {#each} aninhado.
  //
  // Inteiro, e não só o interior: o DOMPurify valida namespace, e `<path>` solto
  // (sem um `<svg>` por pai) é descartado em silêncio. Era o que acontecia aqui
  // — os 2003 tiles desta stack desenhavam SVG vazio, e nada pegava porque esta
  // página estava fora da fumaça de docs pages. Com a raiz junto, o sanitizador
  // reconhece o namespace e o desenho passa.
  const ICON_SVG: Record<string, string> = {};
  for (const name of ALL_ICON_NAMES) {
    ICON_SVG[name] = montarSvgDoIcone(CATALOGO_LUCIDE[name], 'nds-icon-lg');
  }

  // ─── i18n ──────────────────────────────────────────────────────────────────

  const { tStore } = useTranslation(iconsTranslations);

  // ─── Estado ───────────────────────────────────────────────────────────────

  let search = $state('');
  let copied = $state<string | null>(null);
  let copiedTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── SEO + Analytics ──────────────────────────────────────────────────────

  // Observer de cliques (data-track*) — mesmo mecanismo do DocsPageLayout.
  let trackingRoot: HTMLElement | null = $state(null);

  $effect(() => {
    if (!trackingRoot) return;
    return mountDocsTracking(trackingRoot, { componentSlug: 'icons' });
  });

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

<div bind:this={trackingRoot} class="sb-unstyled nds-flex-1 nds-w-full nds-h-full nds-overflow-auto ds-docs">
  <!-- Landmark de conteúdo: esta página monta layout próprio (não usa o
       DocsPageLayout nem o FoundationPage), então o <main> vem daqui, e envolve
       a página INTEIRA — inclusive o <h1> que ele referencia por
       aria-labelledby. Antes o cabeçalho ficava fora, e o rótulo do landmark
       apontava para um título que não pertencia a ele.
       tabindex="-1" permite foco programático sem entrar na ordem de tabulação. -->
  <main
    id="docs-main-content"
    tabindex="-1"
    aria-labelledby="docs-page-title"
    class="nds-p-8 nds-stack nds-max-w-docs nds-mx-auto"
    data-spacing="xl"
  >

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="nds-stack nds-border-b-soft nds-pb-8">
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

      <!-- id estável: alvo do aria-labelledby do <main>, mesmo id do DocsHeader. -->
      <h1 id="docs-page-title" class="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground">
        {$tStore('title')}
      </h1>

      <p class="nds-text-muted-foreground nds-leading-relaxed nds-max-w-prose">
        {$tStore('description')}
      </p>

      <div class="nds-cluster" data-spacing="sm" data-align="center">
        <span class="nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default">
          <!-- Package icon inlined (SVG) — sem depender de componente de ícone -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg>
          @lucide/svelte
        </span>
        <!-- Sem opacity extra: --muted-foreground já é o tom secundário, e o
             0.7 derrubava o contraste para 3.03:1 (axe: color-contrast). -->
        <span class="nds-text-body nds-text-muted-foreground">
          {iconsAvailableText}
        </span>
      </div>
    </header>

    <!-- ── Como usar ────────────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
      <h2 class="nds-text-h2 nds-text-foreground">{$tStore('howToUse.title')}</h2>
      <!-- data-cols="2" no lugar de `--grid-min: 18rem` inline: o atributo
           existe na folha e produz a mesma coluna mínima. -->
      <div class="nds-grid" data-spacing="md" data-cols="2">
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-medium">{$tStore('howToUse.individual.title')}</p>
          <pre class="nds-docs-code"><code>{`import Search from '@lucide/svelte/icons/search';

<Search class="nds-icon" aria-hidden="true" />`}</code></pre>
        </div>
        <div class="nds-stack" data-spacing="sm">
          <p class="nds-text-body nds-font-medium">{$tStore('howToUse.sizes.title')}</p>
          <pre class="nds-docs-code"><code>{`nds-icon-sm   // 14px — badges, captions
nds-icon      // 16px — padrão em texto e botões
nds-icon-lg   // 20px — destaque em headers`}</code></pre>
        </div>
      </div>
    </section>

    <!-- ── Acessibilidade ──────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <h2 class="nds-text-h2 nds-text-foreground">{$tStore('accessibility.title')}</h2>
      <div class="nds-grid" data-spacing="sm" data-cols="2">
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
        {#each ['rule1', 'rule2', 'rule3', 'rule4'] as rule (rule)}
          <li class="nds-cluster nds-list-none" data-spacing="sm" data-align="start">
            <span class="nds-text-primary nds-shrink-0 nds-mt-0-5" aria-hidden="true">✓</span>
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
          class="nds-input nds-icon-search-input"
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
      <p class="nds-text-body nds-text-muted-foreground">{$tStore('search.noResultsSub')}</p>
    </div>

    <!-- Grade de ícones — todos no DOM, visibility via CSS -->
    <ul
      class="nds-icon-grid"
      class:is-hidden={!hasResults}
      aria-label={iconsAvailableText}
    >
      {#each ALL_ICON_NAMES as name (name)}
        {@const isCopied = copied === name}
        <li
          class="nds-icon-grid-item"
          class:is-hidden={visibleSet !== null && !visibleSet.has(name)}
          data-icon-name={name}
        >
          <button
            type="button"
            aria-label={`${$tStore('copy.tooltip')} ${name}`}
            class="nds-icon-tile"
            onclick={() => handleCopy(name)}
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            <span class="nds-icon-tile-svg">{@html DOMPurify.sanitize(ICON_SVG[name])}</span>

            <span class="nds-icon-tile-name">
              {name}
            </span>

            <!-- Confirmação de cópia: só o tooltip, como no Vanilla (referência
                 de markup). O check sobreposto que existia aqui não existia lá,
                 e trazia consigo dois SVGs e opacity inline por ícone. -->
            <span
              class="nds-icon-tile-tooltip"
              class:is-visible={isCopied}
              aria-hidden="true"
            >
              {isCopied ? $tStore('copy.copied') : $tStore('copy.tooltip')}
            </span>
          </button>
        </li>
      {/each}
    </ul>

  </main>
</div>
