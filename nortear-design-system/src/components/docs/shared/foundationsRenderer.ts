// ─── Foundations renderer — Nortear (Vanilla TS) ─────────────────────────────
// Renderer genérico que percorre uma translations.json de Foundations e produz
// uma página com header (badges + título + descrição) + N seções.
//
// Cada seção é detectada por padrões comuns nas translations:
//   - `title` (string, opcional `subtitle`)
//   - `cols` + `rows` (objeto) → tabela
//   - `items` (objeto)         → lista de cards com title/body
//   - `rules` / `do` / `dont`  → lista textual
//   - chaves restantes string  → parágrafo
//
// Tudo é reativo a mudança de locale via `subscribe`.

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

interface FoundationsRendererOptions {
  translations: Record<string, unknown>;
  componentSlug: string;
  /** Chaves do nível superior que são metadados (header) e não devem virar seções. */
  metaKeys?: string[];
}

const DEFAULT_META_KEYS = ['title', 'category', 'type', 'description', 'seo', 'nav'];

type AnyRecord = Record<string, unknown>;

function isPlainObject(v: unknown): v is AnyRecord {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

// ─── Componente principal ────────────────────────────────────────────────────

export function createFoundationsDocs(opts: FoundationsRendererOptions): HTMLElement {
  const { translations, componentSlug } = opts;
  const metaKeys = new Set(opts.metaKeys ?? DEFAULT_META_KEYS);

  const { t, subscribe } = createTranslation(translations as AnyRecord);

  const cleanups: Array<() => void> = [];

  // Root
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

  // ── SEO + analytics reativos ─────────────────────────────────────────────
  function updateSeo() {
    const locale = getLocale();
    const cleanup = applySeo({
      title: `${t('title')} — ${t('category')}`,
      description: t('description'),
      locale,
      componentSlug,
    });
    track('docs_page_view', {
      component_name: componentSlug,
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

  // ── Header ─────────────────────────────────────────────────────────────────
  const header = document.createElement('header');
  header.className = 'nds-stack nds-pb-8';
  header.style.paddingBottom = '2rem';

  const topRow = document.createElement('div');
  topRow.className = 'nds-cluster nds-w-full';
  topRow.dataset.spacing = 'sm';
  topRow.dataset.align = 'center';

  const badgeCategory = createBadge({
    variant: 'secondary',
    className: 'nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium',
  });
  const badgeType = createBadge({
    variant: 'outline',
    className: 'nds-text-muted-foreground nds-font-normal',
  });
  const switcher = createLanguageSwitcher();
  switcher.classList.add('nds-spacer-start');

  topRow.append(badgeCategory, badgeType, switcher);

  const h1 = document.createElement('h1');
  h1.className = 'nds-text-h1 nds-font-bold nds-tracking-tight nds-text-foreground';

  const desc = document.createElement('p');
  desc.className = 'nds-text-muted-foreground nds-leading-relaxed';
  desc.style.maxWidth = '48rem';

  header.append(topRow, h1, desc);
  container.appendChild(header);

  // ── Seções dinâmicas ────────────────────────────────────────────────────
  // Mantemos referências para reescrever textos em mudança de locale.
  type TextRef = { el: HTMLElement; key: string; html?: boolean };
  const textRefs: TextRef[] = [];
  const tableCols: Array<{ heads: HTMLElement[]; keys: string[] }> = [];
  const tableRows: Array<{ cells: HTMLElement[]; keys: string[] }> = [];

  function addText(el: HTMLElement, key: string, html = false) {
    textRefs.push({ el, key, html });
  }

  function makeSectionTitle(key: string): HTMLHeadingElement {
    const h = document.createElement('h2');
    h.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';
    addText(h, key, true);
    return h;
  }

  function makeSectionSubtitle(key: string): HTMLParagraphElement {
    const p = document.createElement('p');
    p.className = 'nds-text-body nds-text-muted-foreground';
    addText(p, key, true);
    return p;
  }

  function makeParagraph(key: string): HTMLParagraphElement {
    const p = document.createElement('p');
    p.className = 'nds-text-body nds-text-foreground nds-leading-relaxed';
    addText(p, key, true);
    return p;
  }

  /**
   * Renderiza uma tabela a partir de uma sub-árvore { cols: {…}, rows: {…} }.
   * As linhas viram pares chave→objeto; pegamos as mesmas chaves de `cols` para
   * extrair as colunas correspondentes em cada linha.
   */
  function renderTable(parent: HTMLElement, basePath: string, node: AnyRecord) {
    const cols = node['cols'] as AnyRecord | undefined;
    const rows = node['rows'] as AnyRecord | undefined;
    if (!cols || !rows) return false;

    const colKeys = Object.keys(cols);

    const { wrapper, table } = createTable();

    const thead = createTableHeader();
    const headRow = createTableRow();
    const heads: HTMLElement[] = colKeys.map((ck) => {
      const th = createTableHead('');
      headRow.appendChild(th);
      return th;
    });
    thead.appendChild(headRow);
    tableCols.push({ heads, keys: colKeys.map((ck) => `${basePath}.cols.${ck}`) });

    const tbody = createTableBody();
    Object.keys(rows).forEach((rk) => {
      const row = rows[rk];
      const tr = createTableRow();
      const cells: HTMLElement[] = [];
      colKeys.forEach((ck) => {
        const td = createTableCell('');
        tr.appendChild(td);
        cells.push(td);
      });
      tbody.appendChild(tr);
      // Para cada linha, mapeamos a célula c à chave rows.<rk>.<ck>.
      const valueKeys = colKeys.map((ck) => {
        // Se a linha é objeto, lê rows.<rk>.<ck>. Se for string array, usa índice.
        if (isPlainObject(row)) return `${basePath}.rows.${rk}.${ck}`;
        return `${basePath}.rows.${rk}`;
      });
      tableRows.push({ cells, keys: valueKeys });
    });

    table.append(thead, tbody);
    parent.appendChild(wrapper);
    return true;
  }

  /** Lista simples de strings (array) → <ul>. */
  function renderStringList(parent: HTMLElement, basePath: string, arr: string[]) {
    const ul = document.createElement('ul');
    ul.className = 'nds-stack nds-text-body nds-text-foreground nds-leading-relaxed';
    ul.dataset.spacing = 'sm';
    ul.style.listStyle = 'disc';
    ul.style.paddingInlineStart = '1.5rem';
    arr.forEach((_, i) => {
      const li = document.createElement('li');
      addText(li, `${basePath}.${i}`, true);
      ul.appendChild(li);
    });
    parent.appendChild(ul);
  }

  /** items: { key: { title, body, … } } → grid de cards. */
  function renderItemsGrid(parent: HTMLElement, basePath: string, node: AnyRecord) {
    const grid = document.createElement('div');
    grid.className = 'nds-grid';
    grid.dataset.spacing = 'md';
    grid.dataset.min = '18rem';

    Object.keys(node).forEach((k) => {
      const item = node[k];
      const card = document.createElement('div');
      card.className = 'nds-stack nds-p-4 nds-rounded-md nds-border-soft nds-bg-card';
      card.dataset.spacing = 'xs';
      card.style.padding = '1rem';

      if (isPlainObject(item)) {
        // Procura title-like e body-like
        const titleKey = ['title', 'name', 'label'].find((x) => typeof item[x] === 'string');
        const bodyKey = ['body', 'description', 'use', 'text'].find(
          (x) => typeof item[x] === 'string',
        );
        if (titleKey) {
          const h4 = document.createElement('h4');
          h4.className = 'nds-text-body nds-font-semibold nds-text-foreground';
          addText(h4, `${basePath}.${k}.${titleKey}`, true);
          card.appendChild(h4);
        }
        if (bodyKey) {
          const p = document.createElement('p');
          p.className = 'nds-text-body nds-text-muted-foreground nds-leading-relaxed';
          addText(p, `${basePath}.${k}.${bodyKey}`, true);
          card.appendChild(p);
        }
        // Render restantes como chave: valor
        Object.keys(item).forEach((sk) => {
          if (sk === titleKey || sk === bodyKey) return;
          const v = item[sk];
          if (typeof v !== 'string') return;
          const meta = document.createElement('p');
          meta.className = 'nds-text-small nds-text-muted-foreground';
          meta.style.fontSize = '0.75rem';
          addText(meta, `${basePath}.${k}.${sk}`, true);
          card.appendChild(meta);
        });
      } else if (typeof item === 'string') {
        const p = document.createElement('p');
        p.className = 'nds-text-body nds-text-foreground nds-leading-relaxed';
        addText(p, `${basePath}.${k}`, true);
        card.appendChild(p);
      }
      grid.appendChild(card);
    });

    parent.appendChild(grid);
  }

  /** Renderiza uma seção genérica. */
  function renderSection(key: string, node: unknown) {
    const section = document.createElement('section');
    section.className = 'nds-stack nds-docs-section-divider';
    section.dataset.spacing = 'lg';

    if (typeof node === 'string') {
      section.appendChild(makeSectionTitle(`${key}.title`));
      const p = makeParagraph(key);
      section.appendChild(p);
      container.appendChild(section);
      return;
    }

    if (!isPlainObject(node)) return;

    // Title / subtitle
    if (typeof node['title'] === 'string') {
      section.appendChild(makeSectionTitle(`${key}.title`));
    } else {
      // Fallback: usa a própria chave como título
      const h = document.createElement('h2');
      h.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';
      h.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      section.appendChild(h);
    }
    if (typeof node['subtitle'] === 'string') {
      section.appendChild(makeSectionSubtitle(`${key}.subtitle`));
    }

    // Tabela cols + rows
    if (isPlainObject(node['cols']) && isPlainObject(node['rows'])) {
      renderTable(section, key, node);
    }

    // Iterar restantes
    const skip = new Set(['title', 'subtitle', 'cols', 'rows']);
    Object.keys(node).forEach((sk) => {
      if (skip.has(sk)) return;
      const child = node[sk];

      if (typeof child === 'string') {
        const block = document.createElement('div');
        block.className = 'nds-stack';
        block.dataset.spacing = 'xs';
        const h4 = document.createElement('h3');
        h4.className = 'nds-text-body nds-font-semibold nds-text-foreground';
        h4.textContent = sk.charAt(0).toUpperCase() + sk.slice(1);
        const p = document.createElement('p');
        p.className = 'nds-text-body nds-text-foreground nds-leading-relaxed';
        addText(p, `${key}.${sk}`, true);
        block.append(h4, p);
        section.appendChild(block);
        return;
      }

      if (isStringArray(child)) {
        const block = document.createElement('div');
        block.className = 'nds-stack';
        block.dataset.spacing = 'xs';
        const h4 = document.createElement('h3');
        h4.className = 'nds-text-body nds-font-semibold nds-text-foreground';
        h4.textContent = sk.charAt(0).toUpperCase() + sk.slice(1);
        block.appendChild(h4);
        renderStringList(block, `${key}.${sk}`, child);
        section.appendChild(block);
        return;
      }

      if (isPlainObject(child)) {
        // Sub-seção com title/subtitle?
        const sub = document.createElement('div');
        sub.className = 'nds-stack';
        sub.dataset.spacing = 'sm';

        if (typeof child['title'] === 'string') {
          const h3 = document.createElement('h3');
          h3.className = 'nds-text-body nds-font-semibold nds-text-foreground';
          addText(h3, `${key}.${sk}.title`, true);
          sub.appendChild(h3);
        } else {
          const h3 = document.createElement('h3');
          h3.className = 'nds-text-body nds-font-semibold nds-text-foreground';
          h3.textContent = sk.charAt(0).toUpperCase() + sk.slice(1);
          sub.appendChild(h3);
        }
        if (typeof child['subtitle'] === 'string') {
          const psub = document.createElement('p');
          psub.className = 'nds-text-body nds-text-muted-foreground';
          addText(psub, `${key}.${sk}.subtitle`, true);
          sub.appendChild(psub);
        }

        if (isPlainObject(child['cols']) && isPlainObject(child['rows'])) {
          renderTable(sub, `${key}.${sk}`, child);
        }

        // items
        if (isPlainObject(child['items'])) {
          renderItemsGrid(sub, `${key}.${sk}.items`, child['items'] as AnyRecord);
        }

        // rules / strings remanescentes
        Object.keys(child).forEach((ssk) => {
          if (['title', 'subtitle', 'cols', 'rows', 'items'].includes(ssk)) return;
          const v = child[ssk];
          if (typeof v === 'string') {
            const p = document.createElement('p');
            p.className = 'nds-text-body nds-text-foreground nds-leading-relaxed';
            addText(p, `${key}.${sk}.${ssk}`, true);
            sub.appendChild(p);
          } else if (isStringArray(v)) {
            renderStringList(sub, `${key}.${sk}.${ssk}`, v);
          } else if (isPlainObject(v)) {
            // Sub-sub-seção como cards
            renderItemsGrid(sub, `${key}.${sk}.${ssk}`, v);
          }
        });

        section.appendChild(sub);
        return;
      }
    });

    container.appendChild(section);
  }

  // Itera o dicionário no locale atual (estrutura é igual entre locales)
  const sampleLocale = (translations['pt-BR'] ?? translations['en'] ?? translations['es']) as AnyRecord;
  if (isPlainObject(sampleLocale)) {
    Object.keys(sampleLocale).forEach((k) => {
      if (metaKeys.has(k)) return;
      renderSection(k, sampleLocale[k]);
    });
  }

  // ── Textos reativos ───────────────────────────────────────────────────────
  function rerenderTexts() {
    badgeCategory.textContent = t('category');
    badgeType.textContent = t('type');
    h1.textContent = t('title');
    desc.innerHTML = t('description');

    textRefs.forEach(({ el, key, html }) => {
      const val = t(key, '');
      if (html) el.innerHTML = val;
      else el.textContent = val;
    });
    tableCols.forEach(({ heads, keys }) => {
      heads.forEach((h, i) => {
        h.textContent = t(keys[i], '');
      });
    });
    tableRows.forEach(({ cells, keys }) => {
      cells.forEach((c, i) => {
        c.innerHTML = t(keys[i], '');
      });
    });
  }

  rerenderTexts();
  cleanups.push(subscribe(rerenderTexts));

  // ── Cleanup ao desmontar ─────────────────────────────────────────────────
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
