<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge } from '@/components/ui/badge';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
  import Swatch from '@/components/docs/shared/Swatch.svelte';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { locale, useTranslation } from '@/lib/i18n';
  import { applySeo } from '@/lib/use-seo';
  import { track } from '@/lib/analytics';
  import themeColorsTranslations from '@shared/content/theme-colors/translations.json';

  // ─── Definições estáticas ──────────────────────────────────────────────────

  /** Grupos da paleta semântica e seus tokens (sem o prefixo `--`). */
  const PALETTE_GROUPS: Array<{ key: string; tokens: string[] }> = [
    {
      key: 'surface',
      tokens: [
        'background', 'foreground', 'card', 'card-foreground', 'popover',
        'popover-foreground', 'muted', 'muted-foreground', 'accent', 'accent-foreground',
      ],
    },
    {
      key: 'brand',
      tokens: ['primary', 'primary-foreground', 'secondary', 'secondary-foreground'],
    },
    {
      key: 'feedback',
      tokens: [
        'destructive', 'destructive-foreground', 'success', 'success-foreground',
        'warning', 'warning-foreground', 'info', 'info-foreground',
      ],
    },
    {
      key: 'structure',
      tokens: ['border', 'input', 'input-background', 'ring', 'ring-offset-color'],
    },
    {
      key: 'sidebar',
      tokens: [
        'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
        'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
      ],
    },
    {
      key: 'chart',
      tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'],
    },
  ];

  /** Tokens exibidos como mini-swatches nos cards de tema/modo. */
  const MINI_TOKENS = ['primary', 'secondary', 'accent', 'muted', 'destructive', 'success'];

  const BRAND_THEMES: Array<{ key: string; className: string }> = [
    { key: 'default', className: 'tema-default' },
    { key: 'warm', className: 'tema-warm' },
    { key: 'cold', className: 'tema-cold' },
  ];

  const MODES: Array<{ key: string; className: string }> = [
    { key: 'light', className: '' },
    { key: 'dark', className: 'dark' },
  ];

  const DENSITY_ITEMS: Array<{ key: string; className: string }> = [
    { key: 'condensado', className: 'densidade-condensado' },
    { key: 'default', className: 'densidade-default' },
    { key: 'confortavel', className: 'densidade-confortavel' },
  ];

  const FONT_ITEMS: Array<{ key: string; className: string }> = [
    { key: 'default', className: 'fonte-default' },
    { key: 'lexend', className: 'fonte-lexend' },
    { key: 'pt-serif', className: 'fonte-pt-serif' },
    { key: 'lxgw-wenkai', className: 'fonte-lxgw-wenkai' },
  ];

  // ─── i18n ──────────────────────────────────────────────────────────────────

  const { tStore } = useTranslation(themeColorsTranslations);

  // ─── Estado ─────────────────────────────────────────────────────────────────

  // Valores HSL resolvidos do <html>, indexados por token.
  let tokenValues = $state<Record<string, string>>({});

  // Conteúdo da tabela de demonstração de densidade — reativo ao locale.
  const densityData = $derived(
    (themeColorsTranslations as Record<string, any>)[$locale].axes.density as {
      tableCols: string[]; tableRows: string[][];
    }
  );

  // Tema/modo ativos derivados das classes do <html>, para que os cards
  // de demonstração combinem `tema-X` + `dark` no mesmo elemento (o dark
  // variant só aplica com ambas as classes juntas).
  let temaAtivo = $state<'tema-default' | 'tema-warm' | 'tema-cold'>('tema-default');
  let paginaDark = $state(false);

  function readTokens() {
    const styles = getComputedStyle(document.documentElement);
    const next: Record<string, string> = {};
    for (const group of PALETTE_GROUPS) {
      for (const token of group.tokens) {
        next[token] = styles.getPropertyValue(`--${token}`).trim();
      }
    }
    tokenValues = next;
  }

  function readHtmlState() {
    const cl = document.documentElement.classList;
    temaAtivo = cl.contains('tema-warm')
      ? 'tema-warm'
      : cl.contains('tema-cold')
        ? 'tema-cold'
        : 'tema-default';
    paginaDark = cl.contains('dark');
  }

  onMount(() => {
    readTokens();
    readHtmlState();
    // Reage a trocas de tema/modo/densidade aplicadas via classe no <html>.
    const observer = new MutationObserver(() => {
      readTokens();
      readHtmlState();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
    };
  });

  // ─── SEO + Analytics ──────────────────────────────────────────────────────

  $effect(() => {
    const t = $tStore;
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('description'),
      locale: $locale,
      componentSlug: 'theme-colors',
      kind: 'guide',
    });
    track('docs_page_view', {
      component_name: 'theme-colors',
      locale: $locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

</script>

<div class="sb-unstyled nds-flex-1 nds-w-full ds-docs" style="height: 100%; overflow: auto">
  <div class="nds-p-8 nds-stack" data-spacing="xl" style="max-width: 72rem; margin-inline: auto">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="nds-stack nds-pb-8" style="padding-bottom: 2rem">
      <div class="nds-cluster" data-justify="between">
        <div class="nds-cluster" data-spacing="sm" data-align="center">
          <Badge variant="secondary" class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium">
            {$tStore('category')}
          </Badge>
          <Badge variant="outline" class="nds-text-muted-foreground nds-font-normal">
            {$tStore('type')}
          </Badge>
        </div>
        <LanguageSwitcher />
      </div>

      <h1 class="nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground">
        {$tStore('title')}
      </h1>

      <p class="nds-text-muted-foreground nds-leading-relaxed" style="max-width: 48rem">
        {$tStore('description')}
      </p>
    </header>

    <!-- ── Paleta semântica ──────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('palette.title')}</h2>
        <p class="nds-text-body">{$tStore('palette.subtitle')}</p>
      </div>

      {#each PALETTE_GROUPS as group}
        <div class="nds-swatch-group">
          <h3 class="nds-swatch-group-title">{$tStore(`palette.groups.${group.key}`)}</h3>
          <ul class="nds-swatch-grid">
            {#each group.tokens as token}
              <li class="nds-swatch-grid-item">
                <Swatch
                  {token}
                  orientation="horizontal"
                  value={tokenValues[token]}
                  copyLabel={$tStore('copy.tooltip')}
                  copiedLabel={$tStore('copy.copied')}
                />
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </section>

    <!-- ── Temas de marca ──────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('brand.title')}</h2>
        <p class="nds-text-body">{$tStore('brand.subtitle')}</p>
      </div>
      <div class="nds-theme-card-grid">
        {#each BRAND_THEMES as theme}
          <div class="nds-theme-card">
            <div class={`nds-theme-card-scope ${theme.className}${paginaDark ? ' dark' : ''}`}>
              <span class="nds-theme-card-label">{$tStore(`brand.themes.${theme.key}`)}</span>
              <div class="nds-miniswatch-row">
                {#each MINI_TOKENS as token}
                  <Swatch {token} orientation="vertical" />
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── Light e Dark ──────────────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="md">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('modes.title')}</h2>
        <p class="nds-text-body">{$tStore('modes.subtitle')}</p>
      </div>
      <div class="nds-theme-card-grid">
        {#each MODES as mode}
          <div class="nds-theme-card">
            <div class={`nds-theme-card-scope ${temaAtivo}${mode.className ? ` ${mode.className}` : ''}`}>
              <span class="nds-theme-card-label">{$tStore(`modes.${mode.key}`)}</span>
              <div class="nds-miniswatch-row">
                {#each MINI_TOKENS as token}
                  <Swatch {token} orientation="vertical" />
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── Densidade e Fontes ──────────────────────────────────────────── -->
    <section class="nds-stack nds-docs-section-divider" data-spacing="lg">
      <div class="nds-stack" data-spacing="xs">
        <h2 class="nds-text-h2 nds-text-foreground">{$tStore('axes.title')}</h2>
        <p class="nds-text-body">{$tStore('axes.subtitle')}</p>
      </div>

      <!-- Densidade -->
      <div class="nds-stack" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h3 class="nds-text-body nds-font-medium">{$tStore('axes.density.title')}</h3>
          <p class="nds-text-body">{$tStore('axes.density.subtitle')}</p>
        </div>
        <div class="nds-axis-grid">
          {#each DENSITY_ITEMS as item}
            <div class="nds-axis-sample">
              <span class="nds-axis-sample-label">{$tStore(`axes.density.items.${item.key}`)}</span>
              <div class={`nds-axis-scope ${item.className}`}>
                <Table class="nds-axis-density-table">
                  <TableHeader>
                    <TableRow>
                      {#each densityData.tableCols as col}
                        <TableHead>{col}</TableHead>
                      {/each}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {#each densityData.tableRows as row}
                      <TableRow>
                        {#each row as val}
                          <TableCell>{val}</TableCell>
                        {/each}
                      </TableRow>
                    {/each}
                  </TableBody>
                </Table>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Fontes -->
      <div class="nds-stack" data-spacing="md">
        <div class="nds-stack" data-spacing="xs">
          <h3 class="nds-text-body nds-font-medium">{$tStore('axes.fonts.title')}</h3>
          <p class="nds-text-body">{$tStore('axes.fonts.subtitle')}</p>
        </div>
        <div class="nds-axis-grid" data-cols="4">
          {#each FONT_ITEMS as item}
            <div class="nds-axis-sample">
              <span class="nds-axis-sample-label">{$tStore(`axes.fonts.items.${item.key}`)}</span>
              <div class={item.className}>
                <span class="nds-font-sample">Aa Bb Cc 123</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

  </div>
</div>
