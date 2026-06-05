import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, createTranslation } from '@/lib/i18n';
import { createLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { createBadge } from '@/components/ui/badge';
import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableRow,
  createTableHead,
  createTableCell,
} from '@/components/ui/table';
import { createSwatch as createSwatchEl } from '@/components/docs/shared/swatch';
import themeColorsTranslations from '@shared/content/theme-colors/translations.json';

// ─── Definições estáticas ──────────────────────────────────────────────────────

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

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t, subscribe } = createTranslation(themeColorsTranslations as Record<string, unknown>);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Lê o valor HSL atual de um token CSS resolvido no <html>. */
function readToken(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
}

/** Lê o estado de tema/modo ativo a partir das classes do <html>. */
function readActiveTheme(): { brandClass: string; isDark: boolean } {
  const list = document.documentElement.classList;
  const brand = BRAND_THEMES.find((th) => list.contains(th.className));
  return {
    brandClass: brand ? brand.className : 'tema-default',
    isDark: list.contains('dark'),
  };
}

function sectionTitle(text: string): HTMLHeadingElement {
  const h = document.createElement('h2');
  h.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';
  h.textContent = text;
  return h;
}

function sectionSubtitle(text: string): HTMLParagraphElement {
  const p = document.createElement('p');
  p.className = 'nds-text-body nds-text-muted-foreground';
  p.textContent = text;
  return p;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function createThemeColorsDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // Root — sb-unstyled neutraliza o reset de prose do Storybook autodocs.
  const root = document.createElement('div');
  root.className = 'sb-unstyled nds-flex-1 nds-w-full ds-docs';
  root.style.height = '100%';
  root.style.overflow = 'auto';

  const container = document.createElement('div');
  container.className = 'nds-p-8 nds-stack';
  container.dataset.spacing = 'xl';
  container.style.maxWidth = '72rem';
  container.style.marginInline = 'auto';
  root.appendChild(container);

  // ── SEO + analytics reativos ───────────────────────────────────────────────

  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('description'),
      locale,
      componentSlug: 'theme-colors',
    });
    track('docs_page_view', {
      component_name: 'theme-colors',
      locale,
      page_title: `${t('title')} · Design System`,
    });
    return cleanup;
  }

  let cleanupSeo = updateSeo();
  const unsubSeo = subscribe(() => {
    cleanupSeo();
    cleanupSeo = updateSeo();
  });
  cleanups.push(() => { cleanupSeo(); unsubSeo(); });

  // ── Header ────────────────────────────────────────────────────────────────

  const header = document.createElement('header');
  header.className = 'nds-stack nds-pb-8';
  header.style.paddingBottom = '2rem';

  const topRow = document.createElement('div');
  topRow.className = 'nds-cluster nds-w-full';
  topRow.dataset.spacing = 'sm';
  topRow.dataset.align = 'center';

  const badgeCategory = createBadge({ variant: 'secondary', className: 'nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium' });
  const badgeType = createBadge({ variant: 'outline', className: 'nds-text-muted-foreground nds-font-normal' });
  const switcher = createLanguageSwitcher();
  switcher.classList.add('nds-spacer-start');

  topRow.append(badgeCategory, badgeType, switcher);

  const h1 = document.createElement('h1');
  h1.className = 'nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground';

  const desc = document.createElement('p');
  desc.className = 'nds-text-muted-foreground nds-leading-relaxed';
  desc.style.maxWidth = '48rem';

  header.append(topRow, h1, desc);

  // ── Seção 1: Paleta semântica ──────────────────────────────────────────────

  const paletteSection = document.createElement('section');
  paletteSection.className = 'nds-stack nds-docs-section-divider';
  paletteSection.dataset.spacing = 'lg';

  const paletteTitle = sectionTitle('');
  const paletteSubtitle = sectionSubtitle('');
  paletteSection.append(paletteTitle, paletteSubtitle);

  // Tooltips que precisam de texto reativo (copy.tooltip)
  const tooltipEls: HTMLElement[] = [];
  const groupTitleEls: Array<{ el: HTMLElement; key: string }> = [];
  // Swatches cujo valor HSL precisa ser re-lido quando o tema/modo muda.
  const swatchValueEls: Array<{ el: HTMLElement; token: string }> = [];

  /** Cria um swatch horizontal clicável (variante de paleta) que copia `--token`. */
  function createSwatch(token: string): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'nds-swatch-grid-item';

    const { el: btn, valueEl, tooltipEl } = createSwatchEl({
      token,
      orientation: 'horizontal',
      value: readToken(token),
    });
    if (valueEl) swatchValueEls.push({ el: valueEl, token });
    if (tooltipEl) tooltipEls.push(tooltipEl);

    btn.addEventListener('click', () => {
      navigator.clipboard
        .writeText(`--${token}`)
        .then(() => {
          if (!tooltipEl) return;
          tooltipEl.textContent = t('copy.copied');
          tooltipEl.style.opacity = '1';
          setTimeout(() => {
            tooltipEl.textContent = t('copy.tooltip');
            tooltipEl.style.opacity = '0';
          }, 1500);
        })
        .catch(() => {});
    });

    li.appendChild(btn);
    return li;
  }

  PALETTE_GROUPS.forEach((group) => {
    const groupWrap = document.createElement('div');
    groupWrap.className = 'nds-swatch-group';

    const groupTitle = document.createElement('h3');
    groupTitle.className = 'nds-swatch-group-title';
    groupTitleEls.push({ el: groupTitle, key: group.key });

    const grid = document.createElement('ul');
    grid.className = 'nds-swatch-grid';
    group.tokens.forEach((token) => grid.appendChild(createSwatch(token)));

    groupWrap.append(groupTitle, grid);
    paletteSection.appendChild(groupWrap);
  });

  // ── Helper: fileira de mini-swatches ────────────────────────────────────────

  function createMiniRow(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'nds-miniswatch-row';
    MINI_TOKENS.forEach((token) => {
      row.appendChild(createSwatchEl({ token, orientation: 'vertical' }).el);
    });
    return row;
  }

  // ── Seção 2: Temas de marca ────────────────────────────────────────────────

  const brandSection = document.createElement('section');
  brandSection.className = 'nds-stack nds-docs-section-divider';
  brandSection.dataset.spacing = 'md';

  const brandTitle = sectionTitle('');
  const brandSubtitle = sectionSubtitle('');

  const brandGrid = document.createElement('div');
  brandGrid.className = 'nds-theme-card-grid';

  const brandLabelEls: Array<{ el: HTMLElement; key: string }> = [];
  // Cada card de marca mostra SEU tema no modo atual da página.
  const brandScopeEls: Array<{ el: HTMLElement; className: string }> = [];

  BRAND_THEMES.forEach((theme) => {
    const card = document.createElement('div');
    card.className = 'nds-theme-card';

    const scope = document.createElement('div');
    // Tema default é claro por padrão; warm/cold também têm light base.
    scope.className = `nds-theme-card-scope ${theme.className}`;
    brandScopeEls.push({ el: scope, className: theme.className });

    const label = document.createElement('span');
    label.className = 'nds-theme-card-label';
    brandLabelEls.push({ el: label, key: theme.key });

    scope.append(label, createMiniRow());
    card.appendChild(scope);
    brandGrid.appendChild(card);
  });

  brandSection.append(brandTitle, brandSubtitle, brandGrid);

  // ── Seção 3: Light e Dark ──────────────────────────────────────────────────

  const modesSection = document.createElement('section');
  modesSection.className = 'nds-stack nds-docs-section-divider';
  modesSection.dataset.spacing = 'md';

  const modesTitle = sectionTitle('');
  const modesSubtitle = sectionSubtitle('');

  const modesGrid = document.createElement('div');
  modesGrid.className = 'nds-theme-card-grid';

  const modeLabelEls: Array<{ el: HTMLElement; key: string }> = [];
  // Cada card mostra o tema ativo num modo fixo (light/dark).
  const modeScopeEls: Array<{ el: HTMLElement; dark: boolean }> = [];
  const MODES: Array<{ key: string; dark: boolean }> = [
    { key: 'light', dark: false },
    { key: 'dark', dark: true },
  ];

  MODES.forEach((mode) => {
    const card = document.createElement('div');
    card.className = 'nds-theme-card';

    const scope = document.createElement('div');
    scope.className = 'nds-theme-card-scope';
    modeScopeEls.push({ el: scope, dark: mode.dark });

    const label = document.createElement('span');
    label.className = 'nds-theme-card-label';
    modeLabelEls.push({ el: label, key: mode.key });

    scope.append(label, createMiniRow());
    card.appendChild(scope);
    modesGrid.appendChild(card);
  });

  modesSection.append(modesTitle, modesSubtitle, modesGrid);

  // ── Seção 4: Densidade e Fontes ────────────────────────────────────────────

  const axesSection = document.createElement('section');
  axesSection.className = 'nds-stack nds-docs-section-divider';
  axesSection.dataset.spacing = 'lg';

  // Header da seção: título + subtítulo agrupados num cluster tight (4px),
  // separado dos blocos por 24px do axesSection (data-spacing="lg").
  const axesHeader = document.createElement('div');
  axesHeader.className = 'nds-stack';
  axesHeader.dataset.spacing = 'xs';
  const axesTitle = sectionTitle('');
  const axesSubtitle = sectionSubtitle('');
  axesHeader.append(axesTitle, axesSubtitle);

  // Bloco Densidade: header (h3+subtítulo) + grade. 16px entre header e grade.
  const densityBlock = document.createElement('div');
  densityBlock.className = 'nds-stack';
  densityBlock.dataset.spacing = 'md';

  const densityHeader = document.createElement('div');
  densityHeader.className = 'nds-stack';
  densityHeader.dataset.spacing = 'xs';
  const densityTitle = document.createElement('h3');
  densityTitle.className = 'nds-text-body nds-font-medium nds-text-foreground';
  const densitySubtitle = sectionSubtitle('');
  densityHeader.append(densityTitle, densitySubtitle);

  const densityGrid = document.createElement('div');
  densityGrid.className = 'nds-axis-grid';

  const densityLabelEls: Array<{ el: HTMLElement; key: string }> = [];

  // Cada card de densidade renderiza a MESMA tabela 3-col; as alturas de linha
  // e paddings de célula (tokenizados) escalam com a densidade do escopo,
  // demonstrando o eixo. Guardamos as células p/ reescrever ao trocar locale.
  const densityTables: Array<{ heads: HTMLElement[]; cells: HTMLElement[][] }> = [];

  function densityData() {
    return (themeColorsTranslations as Record<string, any>)[getLocale()].axes.density as {
      tableCols: string[];
      tableRows: string[][];
    };
  }

  function createDensityTable(): HTMLElement {
    const { wrapper, table } = createTable('nds-axis-density-table');
    const data = densityData();

    const thead = createTableHeader();
    const headRow = createTableRow();
    const heads: HTMLElement[] = data.tableCols.map((col) => {
      const th = createTableHead(col);
      headRow.appendChild(th);
      return th;
    });
    thead.appendChild(headRow);

    const tbody = createTableBody();
    const cells: HTMLElement[][] = data.tableRows.map((row) => {
      const tr = createTableRow();
      const rowCells = row.map((val) => {
        const td = createTableCell(val);
        tr.appendChild(td);
        return td;
      });
      tbody.appendChild(tr);
      return rowCells;
    });

    table.append(thead, tbody);
    densityTables.push({ heads, cells });
    return wrapper;
  }

  DENSITY_ITEMS.forEach((item) => {
    const sample = document.createElement('div');
    sample.className = 'nds-axis-sample';

    const label = document.createElement('span');
    label.className = 'nds-axis-sample-label';
    densityLabelEls.push({ el: label, key: item.key });

    const scope = document.createElement('div');
    scope.className = `nds-axis-scope ${item.className}`;
    scope.appendChild(createDensityTable());

    sample.append(label, scope);
    densityGrid.appendChild(sample);
  });

  densityBlock.append(densityHeader, densityGrid);

  // Bloco Fontes: mesma estrutura do bloco Densidade.
  const fontsBlock = document.createElement('div');
  fontsBlock.className = 'nds-stack';
  fontsBlock.dataset.spacing = 'md';

  const fontsHeader = document.createElement('div');
  fontsHeader.className = 'nds-stack';
  fontsHeader.dataset.spacing = 'xs';
  const fontsTitle = document.createElement('h3');
  fontsTitle.className = 'nds-text-body nds-font-medium nds-text-foreground';
  const fontsSubtitle = sectionSubtitle('');
  fontsHeader.append(fontsTitle, fontsSubtitle);

  const fontsGrid = document.createElement('div');
  fontsGrid.className = 'nds-axis-grid';
  fontsGrid.dataset.cols = '4';

  const fontLabelEls: Array<{ el: HTMLElement; key: string }> = [];

  FONT_ITEMS.forEach((item) => {
    const sample = document.createElement('div');
    sample.className = 'nds-axis-sample';

    const label = document.createElement('span');
    label.className = 'nds-axis-sample-label';
    fontLabelEls.push({ el: label, key: item.key });

    const scope = document.createElement('div');
    scope.className = item.className;
    const text = document.createElement('span');
    text.className = 'nds-font-sample';
    text.textContent = 'Aa Bb Cc 123';
    scope.appendChild(text);

    sample.append(label, scope);
    fontsGrid.appendChild(sample);
  });

  fontsBlock.append(fontsHeader, fontsGrid);

  axesSection.append(axesHeader, densityBlock, fontsBlock);

  // ── Montar tudo ────────────────────────────────────────────────────────────

  container.append(header, paletteSection, brandSection, modesSection, axesSection);

  // ── Textos reativos ────────────────────────────────────────────────────────

  function rerenderTexts() {
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');
    h1.textContent = t('title');
    desc.textContent = t('description');

    paletteTitle.textContent = t('palette.title');
    paletteSubtitle.textContent = t('palette.subtitle');
    groupTitleEls.forEach(({ el, key }) => { el.textContent = t(`palette.groups.${key}`); });

    brandTitle.textContent = t('brand.title');
    brandSubtitle.textContent = t('brand.subtitle');
    brandLabelEls.forEach(({ el, key }) => { el.textContent = t(`brand.themes.${key}`); });

    modesTitle.textContent = t('modes.title');
    modesSubtitle.textContent = t('modes.subtitle');
    modeLabelEls.forEach(({ el, key }) => { el.textContent = t(`modes.${key}`); });

    axesTitle.textContent = t('axes.title');
    axesSubtitle.textContent = t('axes.subtitle');
    densityTitle.textContent = t('axes.density.title');
    densitySubtitle.textContent = t('axes.density.subtitle');
    densityLabelEls.forEach(({ el, key }) => { el.textContent = t(`axes.density.items.${key}`); });
    const dData = densityData();
    densityTables.forEach(({ heads, cells }) => {
      dData.tableCols.forEach((col, i) => { if (heads[i]) heads[i].textContent = col; });
      dData.tableRows.forEach((row, r) => row.forEach((val, c) => {
        if (cells[r]?.[c]) cells[r][c].textContent = val;
      }));
    });
    fontsTitle.textContent = t('axes.fonts.title');
    fontsSubtitle.textContent = t('axes.fonts.subtitle');
    fontLabelEls.forEach(({ el, key }) => { el.textContent = t(`axes.fonts.items.${key}`); });

    tooltipEls.forEach((tip) => { tip.textContent = t('copy.tooltip'); });
  }

  rerenderTexts();
  cleanups.push(subscribe(rerenderTexts));

  // ── Estado de tema/modo reativo ────────────────────────────────────────────
  // Os dark variants (.dark.tema-X) só aplicam com AMBAS as classes no MESMO
  // elemento. Como a toolbar coloca tema/dark no <html>, replicamos a
  // combinação correta no scope de cada card.

  function syncThemeState() {
    const { brandClass, isDark } = readActiveTheme();

    // Cards de marca: cada um mostra SEU tema no modo atual da página.
    brandScopeEls.forEach(({ el, className }) => {
      el.className = `nds-theme-card-scope ${className}${isDark ? ' dark' : ''}`;
    });

    // Cards light/dark: cada um mostra o tema ATIVO num modo fixo.
    modeScopeEls.forEach(({ el, dark }) => {
      el.className = `nds-theme-card-scope ${brandClass}${dark ? ' dark' : ''}`;
    });

    // Re-lê os valores HSL dos swatches da paleta (resolvidos no <html>).
    swatchValueEls.forEach(({ el, token }) => { el.textContent = readToken(token); });
  }

  syncThemeState();

  const themeObserver = new MutationObserver(syncThemeState);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  cleanups.push(() => themeObserver.disconnect());

  // ── Cleanup ao desmontar ───────────────────────────────────────────────────

  const detachObserver = new MutationObserver(() => {
    if (!root.isConnected) {
      cleanups.forEach((fn) => fn());
      detachObserver.disconnect();
    }
  });
  const attachObserver = new MutationObserver(() => {
    if (root.isConnected && root.parentElement) {
      detachObserver.observe(root.parentElement, { childList: true });
      attachObserver.disconnect();
    }
  });
  attachObserver.observe(document.body, { childList: true, subtree: true });

  return root;
}
