import { icons as ALL_ICONS } from 'lucide';
import { applySeo } from '@/lib/use-seo';
import { track } from '@/lib/analytics';
import { getLocale, createTranslation } from '@/lib/i18n';
import { createLanguageSwitcher } from '@/components/product/LanguageSwitcher';
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

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-foreground/80 group-hover:text-primary transition-colors" aria-hidden="true">';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t, subscribe } = createTranslation(iconsTranslations as Record<string, unknown>);

// ─── Componente principal ────────────────────────────────────────────────────

export function createIconsDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // Root
  const root = document.createElement('div');
  root.className = 'nds-flex-1 ds-docs';
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

  // Linha superior: badges + language switcher
  const topRow = document.createElement('div');
  topRow.className = 'nds-cluster';
  topRow.dataset.justify = 'between';
  topRow.dataset.align = 'center';

  const badgeRow = document.createElement('div');
  badgeRow.className = 'nds-cluster';
  badgeRow.dataset.spacing = 'sm';
  badgeRow.dataset.align = 'center';

  const badgeCategory = document.createElement('span');
  badgeCategory.className = 'nds-pill nds-text-caption nds-font-medium nds-text-primary';
  badgeCategory.style.borderColor = 'color-mix(in srgb, var(--color-primary) 10%, transparent)';
  badgeCategory.style.background = 'color-mix(in srgb, var(--color-primary) 5%, transparent)';

  const badgeType = document.createElement('span');
  badgeType.className = 'nds-pill nds-text-caption nds-font-normal nds-text-muted-foreground nds-border-default';

  badgeRow.append(badgeCategory, badgeType);

  topRow.append(badgeRow, createLanguageSwitcher());

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
  libBadge.className = 'nds-pill nds-bg-muted nds-text-caption nds-font-mono nds-border-default nds-text-muted-foreground';
  libBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg> lucide`;

  const iconsCount = document.createElement('span');
  iconsCount.className = 'nds-text-body nds-text-muted-foreground';
  iconsCount.style.opacity = '0.7';

  libRow.append(libBadge, iconsCount);
  header.append(topRow, h1, desc, libRow);

  // ── Busca ──────────────────────────────────────────────────────────────────

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'nds-stack';
  searchWrapper.dataset.spacing = 'sm';

  const inputWrapper = document.createElement('div');
  inputWrapper.style.position = 'relative';
  inputWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 nds-text-muted-foreground pointer-events-none" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'nds-w-full nds-rounded-md nds-border-default nds-text-body nds-shadow-sm';
  searchInput.style.background = 'var(--color-input)';
  searchInput.style.paddingLeft = '2.25rem';
  searchInput.style.paddingRight = '0.75rem';
  searchInput.style.paddingBlock = '0.25rem';
  searchInput.style.height = '2.25rem';

  const searchStatus = document.createElement('p');
  searchStatus.className = 'nds-text-body nds-text-muted-foreground';
  searchStatus.setAttribute('aria-live', 'polite');
  searchStatus.setAttribute('aria-atomic', 'true');

  inputWrapper.appendChild(searchInput);
  searchWrapper.append(inputWrapper, searchStatus);

  // ── Empty state ────────────────────────────────────────────────────────────

  const emptyState = document.createElement('div');
  emptyState.className = 'nds-hidden nds-stack nds-text-muted-foreground';
  emptyState.dataset.spacing = 'sm';
  emptyState.style.alignItems = 'center';
  emptyState.style.justifyContent = 'center';
  emptyState.style.paddingBlock = '5rem';
  emptyState.setAttribute('role', 'status');
  emptyState.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

  const emptyTitle = document.createElement('p');
  emptyTitle.className = 'nds-font-medium';
  const emptySubtitle = document.createElement('p');
  emptySubtitle.className = 'nds-text-body';
  emptySubtitle.style.opacity = '0.7';
  emptyState.append(emptyTitle, emptySubtitle);

  // ── Grade de ícones ────────────────────────────────────────────────────────

  const grid = document.createElement('ul');
  grid.className = 'nds-grid nds-list-none nds-p-0 nds-m-0';
  grid.dataset.spacing = 'xs';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(96px, 1fr))';

  ALL_ICON_NAMES.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'nds-list-none';
    li.dataset.iconName = name;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group nds-w-full nds-stack nds-rounded-lg nds-cursor-pointer';
    btn.dataset.spacing = 'sm';
    btn.style.position = 'relative';
    btn.style.alignItems = 'center';
    btn.style.padding = '0.75rem';
    btn.style.border = '1px solid transparent';
    btn.style.background = 'transparent';
    btn.style.overflow = 'visible';
    btn.style.transition = 'background-color .2s, border-color .2s';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'nds-icon-lg';
    iconWrap.style.display = 'flex';
    iconWrap.style.alignItems = 'center';
    iconWrap.style.justifyContent = 'center';
    iconWrap.innerHTML = `${SVG_OPEN}${ICON_SVG_INNER[name]}</svg>`;

    const nameLabel = document.createElement('span');
    nameLabel.className = 'nds-text-muted-foreground nds-font-mono nds-w-full';
    nameLabel.style.fontSize = '10px';
    nameLabel.style.textAlign = 'center';
    nameLabel.style.lineHeight = '1.2';
    nameLabel.style.wordBreak = 'break-all';
    nameLabel.style.display = '-webkit-box';
    (nameLabel.style as unknown as Record<string, string>)['WebkitLineClamp'] = '2';
    (nameLabel.style as unknown as Record<string, string>)['WebkitBoxOrient'] = 'vertical';
    nameLabel.style.overflow = 'hidden';
    nameLabel.textContent = name;

    const tooltip = document.createElement('span');
    tooltip.className = 'nds-whitespace-nowrap nds-rounded';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.position = 'absolute';
    tooltip.style.top = '-2rem';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.background = 'rgb(23 23 23)';
    tooltip.style.padding = '0.25rem 0.5rem';
    tooltip.style.fontSize = '10px';
    tooltip.style.color = '#fff';
    tooltip.style.zIndex = '10';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity .15s';
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.dataset.tooltipFor = name;

    btn.append(iconWrap, nameLabel, tooltip);
    li.appendChild(btn);
    grid.appendChild(li);

    btn.addEventListener('click', () => {
      navigator.clipboard
        .writeText(`import { ${name} } from 'lucide';`)
        .then(() => {
          tooltip.textContent = t('copy.copied');
          setTimeout(() => {
            tooltip.textContent = t('copy.tooltip');
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
      li.classList.toggle('hidden', !matches);
      if (matches) visibleCount++;
    });
    const hasResults = visibleCount > 0;
    grid.classList.toggle('hidden', !hasResults);
    emptyState.classList.toggle('hidden', hasResults);
    if (!hasResults) emptyState.style.display = 'flex';
    else emptyState.style.display = '';

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
  howToUseSection.className = 'nds-stack';
  howToUseSection.dataset.spacing = 'lg';
  howToUseSection.style.borderTop = '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)';
  howToUseSection.style.paddingTop = '2rem';

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
  individualCode.className = 'nds-bg-muted nds-rounded-lg nds-p-4 nds-text-caption nds-overflow-x nds-border-default nds-font-mono nds-leading-relaxed';
  individualCode.innerHTML = `<code>import { Search, Settings, User } from 'lucide';\n\ncreateIcons({ icons: { Search, Settings, User } });\n// &lt;i data-lucide="search" class="" aria-hidden="true"&gt;&lt;/i&gt;</code>`;
  individualDiv.append(individualTitle, individualCode);

  const sizesDiv = document.createElement('div');
  sizesDiv.className = 'nds-stack';
  sizesDiv.dataset.spacing = 'sm';
  const sizesTitle = document.createElement('p');
  sizesTitle.className = 'nds-text-body nds-font-medium nds-text-foreground';
  const sizesCode = document.createElement('pre');
  sizesCode.className = 'nds-bg-muted nds-rounded-lg nds-p-4 nds-text-caption nds-overflow-x nds-border-default nds-font-mono nds-leading-relaxed';
  sizesCode.innerHTML = `<code>h-3 w-3   // 12px — badges, captions\nh-4 w-4   // 16px — padrão em texto e botões\nh-5 w-5   // 20px — destaque em headers\nh-6 w-6   // 24px — standalone / ilustrativo</code>`;
  sizesDiv.append(sizesTitle, sizesCode);
  howToUseGrid.append(individualDiv, sizesDiv);
  howToUseSection.append(howToUseTitle, howToUseGrid);

  // ── Acessibilidade ─────────────────────────────────────────────────────────

  const a11ySection = document.createElement('section');
  a11ySection.className = 'nds-stack';
  a11ySection.dataset.spacing = 'md';
  a11ySection.style.borderTop = '1px solid color-mix(in srgb, var(--color-border) 50%, transparent)';
  a11ySection.style.paddingTop = '2rem';

  const a11yTitle = document.createElement('h2');
  a11yTitle.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';

  const a11yGrid = document.createElement('div');
  a11yGrid.className = 'nds-grid';
  a11yGrid.dataset.spacing = 'sm';
  a11yGrid.dataset.min = '18rem';

  const decorativeBox = document.createElement('div');
  decorativeBox.className = 'nds-box nds-stack nds-border-success-soft';
  decorativeBox.dataset.padding = 'sm';
  decorativeBox.dataset.spacing = 'sm';
  decorativeBox.style.background = 'color-mix(in srgb, var(--color-success) 8%, transparent)';
  const decorativeTitle = document.createElement('p');
  decorativeTitle.className = 'nds-text-body nds-font-semibold nds-text-success';
  const decorativeCode = document.createElement('pre');
  decorativeCode.className = 'nds-text-caption nds-font-mono nds-overflow-x nds-leading-relaxed nds-text-success';
  decorativeCode.innerHTML = `<code>&lt;button&gt;\n  &lt;i data-lucide="save" class="" aria-hidden="true"&gt;&lt;/i&gt;\n  Salvar\n&lt;/button&gt;</code>`;
  decorativeBox.append(decorativeTitle, decorativeCode);

  const functionalBox = document.createElement('div');
  functionalBox.className = 'nds-box nds-stack';
  functionalBox.dataset.padding = 'sm';
  functionalBox.dataset.spacing = 'sm';
  functionalBox.style.border = '1px solid color-mix(in srgb, var(--color-info) 30%, transparent)';
  functionalBox.style.background = 'color-mix(in srgb, var(--color-info) 8%, transparent)';
  const functionalTitle = document.createElement('p');
  functionalTitle.className = 'nds-text-body nds-font-semibold nds-text-info';
  const functionalCode = document.createElement('pre');
  functionalCode.className = 'nds-text-caption nds-font-mono nds-overflow-x nds-leading-relaxed nds-text-info';
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
    check.className = 'nds-text-primary nds-shrink-0';
    check.style.marginTop = '0.125rem';
    check.textContent = '✓';
    const ruleText = document.createElement('span');
    li.append(check, ruleText);
    a11yList.appendChild(li);
    a11yRules.push(ruleText);
  }
  a11ySection.append(a11yTitle, a11yGrid, a11yList);

  // ── Montar tudo ────────────────────────────────────────────────────────────

  container.append(header, searchWrapper, emptyState, grid, howToUseSection, a11ySection);

  // ── Textos reativos ────────────────────────────────────────────────────────

  function rerenderTexts() {
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');
    h1.textContent = t('title');
    desc.textContent = t('description');
    iconsCount.textContent = t('iconsAvailable').replace('{count}', String(ALL_ICON_NAMES.length));
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
