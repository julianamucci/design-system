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

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors" aria-hidden="true">';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const { t, subscribe } = createTranslation(iconsTranslations as Record<string, unknown>);

// ─── Componente principal ────────────────────────────────────────────────────

export function createIconsDocs(): HTMLElement {
  const cleanups: Array<() => void> = [];

  // Root
  const root = document.createElement('div');
  root.className = 'flex-1 h-full overflow-auto ds-docs';

  const container = document.createElement('div');
  container.className = 'p-8 max-w-6xl mx-auto space-y-8';
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
  header.className = 'space-y-4 border-b border-border/50 pb-8';

  // Linha superior: badges + language switcher
  const topRow = document.createElement('div');
  topRow.className = 'flex items-center justify-between';

  const badgeRow = document.createElement('div');
  badgeRow.className = 'flex items-center gap-2';

  const badgeCategory = document.createElement('span');
  badgeCategory.className = 'inline-flex items-center rounded-md border border-primary/10 bg-primary/5 px-2 py-0 text-xs font-medium text-primary';

  const badgeType = document.createElement('span');
  badgeType.className = 'inline-flex items-center rounded-md border border-border px-2 py-0 text-xs font-normal text-muted-foreground';

  badgeRow.append(badgeCategory, badgeType);

  topRow.append(badgeRow, createLanguageSwitcher());

  const h1 = document.createElement('h1');
  h1.className = 'text-4xl font-bold tracking-tight text-foreground';

  const desc = document.createElement('p');
  desc.className = 'text-muted-foreground max-w-3xl leading-relaxed';

  const libRow = document.createElement('div');
  libRow.className = 'flex flex-wrap items-center gap-3 pt-1';

  const libBadge = document.createElement('span');
  libBadge.className = 'inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-xs font-mono border border-border/50 text-muted-foreground';
  libBadge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3" aria-hidden="true"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/><path d="m7.5 4.27 9 5.15"/></svg> lucide`;

  const iconsCount = document.createElement('span');
  iconsCount.className = 'text-sm text-muted-foreground/70';

  libRow.append(libBadge, iconsCount);
  header.append(topRow, h1, desc, libRow);

  // ── Busca ──────────────────────────────────────────────────────────────────

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'space-y-3';

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'relative';
  inputWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9';

  const searchStatus = document.createElement('p');
  searchStatus.className = 'text-sm text-muted-foreground';
  searchStatus.setAttribute('aria-live', 'polite');
  searchStatus.setAttribute('aria-atomic', 'true');

  inputWrapper.appendChild(searchInput);
  searchWrapper.append(inputWrapper, searchStatus);

  // ── Empty state ────────────────────────────────────────────────────────────

  const emptyState = document.createElement('div');
  emptyState.className = 'hidden flex-col items-center justify-center py-20 gap-3 text-muted-foreground';
  emptyState.setAttribute('role', 'status');
  emptyState.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10 opacity-25" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

  const emptyTitle = document.createElement('p');
  emptyTitle.className = 'font-medium';
  const emptySubtitle = document.createElement('p');
  emptySubtitle.className = 'text-sm opacity-70';
  emptyState.append(emptyTitle, emptySubtitle);

  // ── Grade de ícones ────────────────────────────────────────────────────────

  const grid = document.createElement('ul');
  grid.className = 'grid gap-1 list-none p-0 m-0';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(96px, 1fr))';

  ALL_ICON_NAMES.forEach((name) => {
    const li = document.createElement('li');
    li.className = 'list-none';
    li.dataset.iconName = name;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group relative w-full flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors overflow-visible';

    const iconWrap = document.createElement('span');
    iconWrap.className = 'h-6 w-6 flex items-center justify-center';
    iconWrap.innerHTML = `${SVG_OPEN}${ICON_SVG_INNER[name]}</svg>`;

    const nameLabel = document.createElement('span');
    nameLabel.className = 'text-[10px] text-muted-foreground text-center leading-tight break-all font-mono w-full line-clamp-2';
    nameLabel.textContent = name;

    const tooltip = document.createElement('span');
    tooltip.className = 'pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity';
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
  howToUseSection.className = 'space-y-6 border-t border-border/50 pt-8';

  const howToUseTitle = document.createElement('h2');
  howToUseTitle.className = 'text-xl font-semibold text-foreground';

  const howToUseGrid = document.createElement('div');
  howToUseGrid.className = 'grid gap-4 md:grid-cols-2';

  const individualDiv = document.createElement('div');
  individualDiv.className = 'space-y-2';
  const individualTitle = document.createElement('p');
  individualTitle.className = 'text-sm font-medium text-foreground';
  const individualCode = document.createElement('pre');
  individualCode.className = 'bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed';
  individualCode.innerHTML = `<code>import { Search, Settings, User } from 'lucide';\n\ncreateIcons({ icons: { Search, Settings, User } });\n// &lt;i data-lucide="search" class="h-4 w-4" aria-hidden="true"&gt;&lt;/i&gt;</code>`;
  individualDiv.append(individualTitle, individualCode);

  const sizesDiv = document.createElement('div');
  sizesDiv.className = 'space-y-2';
  const sizesTitle = document.createElement('p');
  sizesTitle.className = 'text-sm font-medium text-foreground';
  const sizesCode = document.createElement('pre');
  sizesCode.className = 'bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border/50 font-mono leading-relaxed';
  sizesCode.innerHTML = `<code>h-3 w-3   // 12px — badges, captions\nh-4 w-4   // 16px — padrão em texto e botões\nh-5 w-5   // 20px — destaque em headers\nh-6 w-6   // 24px — standalone / ilustrativo</code>`;
  sizesDiv.append(sizesTitle, sizesCode);
  howToUseGrid.append(individualDiv, sizesDiv);
  howToUseSection.append(howToUseTitle, howToUseGrid);

  // ── Acessibilidade ─────────────────────────────────────────────────────────

  const a11ySection = document.createElement('section');
  a11ySection.className = 'space-y-4 border-t border-border/50 pt-8';

  const a11yTitle = document.createElement('h2');
  a11yTitle.className = 'text-xl font-semibold text-foreground';

  const a11yGrid = document.createElement('div');
  a11yGrid.className = 'grid gap-3 md:grid-cols-2';

  const decorativeBox = document.createElement('div');
  decorativeBox.className = 'rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 space-y-2';
  const decorativeTitle = document.createElement('p');
  decorativeTitle.className = 'text-sm font-semibold text-green-700 dark:text-green-400';
  const decorativeCode = document.createElement('pre');
  decorativeCode.className = 'text-xs font-mono overflow-x-auto leading-relaxed text-green-800 dark:text-green-300';
  decorativeCode.innerHTML = `<code>&lt;button&gt;\n  &lt;i data-lucide="save" class="h-4 w-4" aria-hidden="true"&gt;&lt;/i&gt;\n  Salvar\n&lt;/button&gt;</code>`;
  decorativeBox.append(decorativeTitle, decorativeCode);

  const functionalBox = document.createElement('div');
  functionalBox.className = 'rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-4 space-y-2';
  const functionalTitle = document.createElement('p');
  functionalTitle.className = 'text-sm font-semibold text-blue-700 dark:text-blue-400';
  const functionalCode = document.createElement('pre');
  functionalCode.className = 'text-xs font-mono overflow-x-auto leading-relaxed text-blue-800 dark:text-blue-300';
  functionalCode.innerHTML = `<code>&lt;button\n  aria-label="Excluir produto"\n&gt;\n  &lt;i data-lucide="trash-2" class="h-4 w-4" aria-hidden="true"&gt;&lt;/i&gt;\n&lt;/button&gt;</code>`;
  functionalBox.append(functionalTitle, functionalCode);
  a11yGrid.append(decorativeBox, functionalBox);

  const a11yList = document.createElement('ul');
  a11yList.className = 'space-y-1.5 text-sm text-muted-foreground list-none p-0 m-0';
  const a11yRules: HTMLSpanElement[] = [];
  for (let i = 1; i <= 4; i++) {
    const li = document.createElement('li');
    li.className = 'flex gap-2 items-start list-none';
    const check = document.createElement('span');
    check.className = 'text-primary mt-0.5 shrink-0';
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
