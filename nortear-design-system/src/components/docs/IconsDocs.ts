import { icons as ALL_ICONS } from 'lucide';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, createTranslation } from '@/lib/i18n';
import { createLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { createBadge } from '@/components/ui/badge';
import iconsTranslations from '@shared/content/icons/translations.json';

// ─── Catálogo de ícones ──────────────────────────────────────────────────────

type IconData = [string, Record<string, string>][];
const ALL_ICON_NAMES: string[] = Object.keys(ALL_ICONS);

// Pré-constrói inner HTML de cada SVG uma vez
const ICON_SVG_INNER: Record<string, string> = {};
for (const name of ALL_ICON_NAMES) {
  const data = (ALL_ICONS as unknown as Record<string, IconData>)[name];
  ICON_SVG_INNER[name] = data
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${attrStr}/>`;
    })
    .join('');
}

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t, subscribe } = createTranslation(iconsTranslations as Record<string, unknown>);

// ─── Componente principal ────────────────────────────────────────────────────

export function createIconsDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // Root — sb-unstyled neutraliza o reset de prose do Storybook autodocs
  // (sem ele, todas as divs descendentes herdam font-size 16px + Nunito Sans).
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
      componentSlug: 'icons',
    });
    track('docs_page_view', {
      component_name: 'icons',
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
  header.className = 'nds-stack nds-border-b-soft nds-pb-8';
  header.style.paddingBottom = '2rem';

  // Linha superior: badges à esquerda + language switcher à direita (spacer-start)
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

  const libRow = document.createElement('div');
  libRow.className = 'nds-cluster';
  libRow.dataset.spacing = 'sm';
  libRow.dataset.align = 'center';
  libRow.style.paddingTop = '0.25rem';

  const libBadge = document.createElement('span');
  libBadge.className = 'nds-badge nds-bg-muted nds-text-muted-foreground nds-font-mono nds-border-default';
  libBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg> lucide`;

  const iconsCount = document.createElement('span');
  iconsCount.className = 'nds-text-body nds-text-muted-foreground';
  iconsCount.style.opacity = '0.7';

  libRow.append(libBadge, iconsCount);
  header.append(topRow, h1, desc, libRow);

  // ── Busca ──────────────────────────────────────────────────────────────────

  const searchWrapper = document.createElement('section');
  searchWrapper.className = 'nds-stack nds-docs-section-divider';
  searchWrapper.dataset.spacing = 'sm';

  const searchTitle = document.createElement('h2');
  searchTitle.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';

  const searchSubtitle = document.createElement('p');
  searchSubtitle.className = 'nds-text-body nds-text-muted-foreground';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'nds-icon-search-wrap';
  inputWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nds-icon-search-svg" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'nds-icon-search-input';

  const searchStatus = document.createElement('p');
  searchStatus.className = 'nds-text-body nds-text-muted-foreground';
  searchStatus.setAttribute('aria-live', 'polite');
  searchStatus.setAttribute('aria-atomic', 'true');

  inputWrapper.appendChild(searchInput);
  searchWrapper.append(searchTitle, searchSubtitle, inputWrapper, searchStatus);

  // ── Empty state ────────────────────────────────────────────────────────────

  const emptyState = document.createElement('div');
  emptyState.className = 'nds-icon-empty-state';
  emptyState.setAttribute('role', 'status');
  emptyState.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nds-icon-empty-state-svg" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

  const emptyTitle = document.createElement('p');
  emptyTitle.className = 'nds-font-medium';
  const emptySubtitle = document.createElement('p');
  emptySubtitle.className = 'nds-text-body';
  emptySubtitle.style.opacity = '0.7';
  emptyState.append(emptyTitle, emptySubtitle);

  // ── Grade de ícones ────────────────────────────────────────────────────────

  const grid = document.createElement('ul');
  grid.className = 'nds-icon-grid';

  ALL_ICON_NAMES.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'nds-icon-grid-item';
    li.dataset.iconName = name;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nds-icon-tile';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'nds-icon-tile-svg';
    iconWrap.innerHTML = `${SVG_OPEN}${ICON_SVG_INNER[name]}</svg>`;

    const nameLabel = document.createElement('span');
    nameLabel.className = 'nds-icon-tile-name';
    nameLabel.textContent = name;

    const tooltip = document.createElement('span');
    tooltip.className = 'nds-icon-tile-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.dataset.tooltipFor = name;

    btn.append(iconWrap, nameLabel, tooltip);
    li.appendChild(btn);
    grid.appendChild(li);

    btn.addEventListener('click', () => {
      navigator.clipboard
        .writeText(name)
        .then(() => {
          tooltip.textContent = t('copy.copied');
          tooltip.style.opacity = '1';
          setTimeout(() => {
            tooltip.textContent = t('copy.tooltip');
            tooltip.style.opacity = '0';
          }, 1500);
        })
        .catch(() => {});
    });
  });

  // ── Filtro ─────────────────────────────────────────────────────────────────

  function updateSearch(query: string) {
    const q = query.trim().toLowerCase().replace(/[\s\-_]+/g, '');
    let visibleCount = 0;
    grid.querySelectorAll<HTMLLIElement>('li[data-icon-name]').forEach((li) => {
      const name = li.dataset.iconName ?? '';
      const matches = !q || name.toLowerCase().replace(/[\s\-_]+/g, '').includes(q);
      li.classList.toggle('is-hidden', !matches);
      if (matches) visibleCount++;
    });
    const hasResults = visibleCount > 0;
    grid.classList.toggle('is-hidden', !hasResults);
    emptyState.classList.toggle('is-visible', !hasResults);

    const count = visibleCount;
    if (query.trim()) {
      searchStatus.textContent = t('search.results')
        .replace('{count}', String(count))
        .replace('{plural}', count !== 1 ? 's' : '')
        .replace('{query}', query);
    } else {
      searchStatus.textContent = t('search.count').replace('{count}', String(count));
    }
  }

  searchInput.addEventListener('input', () => updateSearch(searchInput.value));

  // ── Como usar ──────────────────────────────────────────────────────────────

  const howToUseSection = document.createElement('section');
  howToUseSection.className = 'nds-stack nds-docs-section-divider';
  howToUseSection.dataset.spacing = 'lg';

  const howToUseTitle = document.createElement('h2');
  howToUseTitle.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';

  const howToUseGrid = document.createElement('div');
  howToUseGrid.className = 'nds-grid';
  howToUseGrid.dataset.spacing = 'md';
  howToUseGrid.dataset.min = '18rem';

  const individualDiv = document.createElement('div');
  individualDiv.className = 'nds-stack';
  individualDiv.dataset.spacing = 'sm';
  const individualTitle = document.createElement('p');
  individualTitle.className = 'nds-text-body nds-font-medium nds-text-foreground';
  const individualCode = document.createElement('pre');
  individualCode.className = 'nds-docs-code';
  individualCode.innerHTML = `<code>import { Search, Settings, User } from 'lucide';\n\ncreateIcons({ icons: { Search, Settings, User } });\n// &lt;i data-lucide="search" class="" aria-hidden="true"&gt;&lt;/i&gt;</code>`;
  individualDiv.append(individualTitle, individualCode);

  const sizesDiv = document.createElement('div');
  sizesDiv.className = 'nds-stack';
  sizesDiv.dataset.spacing = 'sm';
  const sizesTitle = document.createElement('p');
  sizesTitle.className = 'nds-text-body nds-font-medium nds-text-foreground';
  const sizesCode = document.createElement('pre');
  sizesCode.className = 'nds-docs-code';
  sizesCode.innerHTML = `<code>h-3 w-3   // 12px — badges, captions\nh-4 w-4   // 16px — padrão em texto e botões\nh-5 w-5   // 20px — destaque em headers\nh-6 w-6   // 24px — standalone / ilustrativo</code>`;
  sizesDiv.append(sizesTitle, sizesCode);
  howToUseGrid.append(individualDiv, sizesDiv);
  howToUseSection.append(howToUseTitle, howToUseGrid);

  // ── Acessibilidade ─────────────────────────────────────────────────────────

  const a11ySection = document.createElement('section');
  a11ySection.className = 'nds-stack nds-docs-section-divider';
  a11ySection.dataset.spacing = 'md';

  const a11yTitle = document.createElement('h2');
  a11yTitle.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';

  const a11yGrid = document.createElement('div');
  a11yGrid.className = 'nds-grid';
  a11yGrid.dataset.spacing = 'sm';
  a11yGrid.dataset.min = '18rem';

  const decorativeBox = document.createElement('div');
  decorativeBox.className = 'nds-stack';
  decorativeBox.dataset.spacing = 'sm';
  const decorativeTitle = document.createElement('p');
  decorativeTitle.className = 'nds-text-body nds-font-medium nds-text-foreground';
  const decorativeCode = document.createElement('pre');
  decorativeCode.className = 'nds-docs-code';
  decorativeCode.innerHTML = `<code>&lt;button&gt;\n  &lt;i data-lucide="save" class="" aria-hidden="true"&gt;&lt;/i&gt;\n  Salvar\n&lt;/button&gt;</code>`;
  decorativeBox.append(decorativeTitle, decorativeCode);

  const functionalBox = document.createElement('div');
  functionalBox.className = 'nds-stack';
  functionalBox.dataset.spacing = 'sm';
  const functionalTitle = document.createElement('p');
  functionalTitle.className = 'nds-text-body nds-font-medium nds-text-foreground';
  const functionalCode = document.createElement('pre');
  functionalCode.className = 'nds-docs-code';
  functionalCode.innerHTML = `<code>&lt;button\n  aria-label="Excluir produto"\n&gt;\n  &lt;i data-lucide="trash-2" class="" aria-hidden="true"&gt;&lt;/i&gt;\n&lt;/button&gt;</code>`;
  functionalBox.append(functionalTitle, functionalCode);
  a11yGrid.append(decorativeBox, functionalBox);

  const a11yList = document.createElement('ul');
  a11yList.className = 'nds-stack nds-text-body nds-text-muted-foreground nds-list-none nds-p-0 nds-m-0';
  a11yList.dataset.spacing = 'xs';
  const a11yRules: HTMLSpanElement[] = [];
  for (let i = 1; i <= 4; i++) {
    const li = document.createElement('li');
    li.className = 'nds-cluster nds-list-none';
    li.dataset.spacing = 'sm';
    li.dataset.align = 'start';
    const check = document.createElement('span');
    check.className = 'nds-text-primary nds-shrink-0 nds-mt-0-5';
    check.textContent = '✓';
    const ruleText = document.createElement('span');
    li.append(check, ruleText);
    a11yList.appendChild(li);
    a11yRules.push(ruleText);
  }
  a11ySection.append(a11yTitle, a11yGrid, a11yList);

  // ── Montar tudo ────────────────────────────────────────────────────────────

  container.append(header, howToUseSection, a11ySection, searchWrapper, emptyState, grid);

  // ── Textos reativos ────────────────────────────────────────────────────────

  function rerenderTexts() {
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');
    h1.textContent = t('title');
    desc.textContent = t('description');
    iconsCount.textContent = t('iconsAvailable').replace('{count}', String(ALL_ICON_NAMES.length));
    searchTitle.textContent = t('search.title');
    searchSubtitle.textContent = t('search.subtitle');
    searchInput.placeholder = t('search.placeholder');
    searchInput.setAttribute('aria-label', t('search.placeholder'));
    emptyTitle.textContent = t('search.noResults');
    emptySubtitle.textContent = t('search.noResultsSub');
    howToUseTitle.textContent = t('howToUse.title');
    individualTitle.textContent = t('howToUse.individual.title');
    sizesTitle.textContent = t('howToUse.sizes.title');
    a11yTitle.textContent = t('accessibility.title');
    decorativeTitle.textContent = t('accessibility.decorative.title');
    functionalTitle.textContent = t('accessibility.functional.title');
    a11yRules.forEach((el, i) => { el.innerHTML = t(`accessibility.rule${i + 1}`); });
    grid.querySelectorAll<HTMLSpanElement>('[data-tooltip-for]').forEach((tip) => {
      tip.textContent = t('copy.tooltip');
    });
    updateSearch(searchInput.value);
  }

  rerenderTexts();
  cleanups.push(subscribe(rerenderTexts));

  // ── Cleanup ao desmontar ───────────────────────────────────────────────────

  const detachObserver = new MutationObserver(() => {
    if (!root.isConnected) {
      cleanups.forEach((fn) => fn());
      detachObserver.disconnect();
    }
  });
  // Começa a observar quando o root for inserido no DOM
  const attachObserver = new MutationObserver(() => {
    if (root.isConnected && root.parentElement) {
      detachObserver.observe(root.parentElement, { childList: true });
      attachObserver.disconnect();
    }
  });
  attachObserver.observe(document.body, { childList: true, subtree: true });

  return root;
}
