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
      tokens: ['border', 'input', 'input-background', 'ring'],
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
    });
    track('docs_page_view', {
      component_name: 'theme-colors',
      locale: $locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  });

</script>

<div class="sb-unstyled flex-1 h-full overflow-auto ds-docs">
  <div class="p-8 max-w-6xl mx-auto space-y-8">

    <!-- ── Header ──────────────────────────────────────────────────────── -->
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

    <!-- ── Paleta semântica ──────────────────────────────────────────────── -->
    <section class="space-y-6 border-t border-border/50 pt-8">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-foreground">{$tStore('palette.title')}</h2>
        <p class="text-sm text-muted-foreground">{$tStore('palette.subtitle')}</p>
      </div>

      {#each PALETTE_GROUPS as group}
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-foreground">{$tStore(`palette.groups.${group.key}`)}</h3>
          <ul class="grid gap-3 list-none p-0 m-0" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
            {#each group.tokens as token}
              <li class="list-none">
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
    <section class="space-y-4 border-t border-border/50 pt-8">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-foreground">{$tStore('brand.title')}</h2>
        <p class="text-sm text-muted-foreground">{$tStore('brand.subtitle')}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-3">
        {#each BRAND_THEMES as theme}
          <div class="rounded-lg border border-border/50 overflow-hidden">
            <div class={`${theme.className}${paginaDark ? ' dark' : ''} bg-background text-foreground p-4 space-y-3`}>
              <span class="block text-sm font-medium text-foreground">{$tStore(`brand.themes.${theme.key}`)}</span>
              <div class="flex flex-wrap gap-3">
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
    <section class="space-y-4 border-t border-border/50 pt-8">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-foreground">{$tStore('modes.title')}</h2>
        <p class="text-sm text-muted-foreground">{$tStore('modes.subtitle')}</p>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        {#each MODES as mode}
          <div class="rounded-lg border border-border/50 overflow-hidden">
            <div class={`${temaAtivo}${mode.className ? ` ${mode.className}` : ''} bg-background text-foreground p-4 space-y-3`}>
              <span class="block text-sm font-medium text-foreground">{$tStore(`modes.${mode.key}`)}</span>
              <div class="flex flex-wrap gap-3">
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
    <section class="space-y-6 border-t border-border/50 pt-8">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-foreground">{$tStore('axes.title')}</h2>
        <p class="text-sm text-muted-foreground">{$tStore('axes.subtitle')}</p>
      </div>

      <!-- Densidade -->
      <div class="space-y-3">
        <div class="space-y-1">
          <h3 class="text-sm font-medium text-foreground">{$tStore('axes.density.title')}</h3>
          <p class="text-sm text-muted-foreground">{$tStore('axes.density.subtitle')}</p>
        </div>
        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr))">
          {#each DENSITY_ITEMS as item}
            <div class="space-y-2 rounded-lg border border-border/50 p-4">
              <span class="block text-xs font-medium text-muted-foreground">{$tStore(`axes.density.items.${item.key}`)}</span>
              <div class={item.className}>
                <Table>
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
      <div class="space-y-3">
        <div class="space-y-1">
          <h3 class="text-sm font-medium text-foreground">{$tStore('axes.fonts.title')}</h3>
          <p class="text-sm text-muted-foreground">{$tStore('axes.fonts.subtitle')}</p>
        </div>
        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr))">
          {#each FONT_ITEMS as item}
            <div class="space-y-2 rounded-lg border border-border/50 p-4">
              <span class="block text-xs font-medium text-muted-foreground">{$tStore(`axes.fonts.items.${item.key}`)}</span>
              <div class={item.className}>
                <!-- font-family inline: o span precisa USAR var(--font-family-active)
                     para o escopo .fonte-* deste card valer (senão herda do <body>). -->
                <span class="text-2xl text-foreground" style="font-family: var(--font-family-active);">
                  Aa Bb Cc 123
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </section>

  </div>
</div>
