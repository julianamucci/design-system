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
import { mountDocsTracking } from '@/lib/docs-tracking';
import { getLocale, createTranslation } from '@/lib/i18n';
import { createLanguageSwitcher } from '@/components/product/LanguageSwitcher';
import { createBadge } from '@/components/ui/badge';
import {
  createCard,
  createCardHeader,
  createCardTitle,
  createCardDescription,
  createCardContent,
} from '@/components/ui/card';
import {
  createTable,
  createTableHeader,
  createTableBody,
  createTableRow,
  createTableHead,
  createTableCell,
} from '@/components/ui/table';

/** Contexto entregue ao `extraSection` — `addText` registra textos reativos a locale. */
export interface FoundationsExtraCtx {
  t: (key: string, fallback?: string) => string;
  addText: (el: HTMLElement, key: string, html?: boolean) => void;
}

interface FoundationsRendererOptions {
  translations: Record<string, unknown>;
  componentSlug: string;
  /** Chaves do nível superior que são metadados (header) e não devem virar seções. */
  metaKeys?: string[];
  /** Seção visual custom (specimens) renderizada após o header. */
  extraSection?: (ctx: FoundationsExtraCtx) => HTMLElement;
}

// `specimens` é renderizado pela própria página via `extraSection` (visual custom).
const DEFAULT_META_KEYS = ['title', 'category', 'type', 'description', 'seo', 'nav', 'specimens'];

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
      kind: 'guide',
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

  // Observer de cliques (data-track*) — mesmo mecanismo do DocsPageLayout.
  cleanups.push(mountDocsTracking(root, { componentSlug }));

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
  h1.className = 'nds-text-h1 nds-text-foreground';

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

  // Seção visual custom (specimens) — após o header, antes das seções genéricas.
  // Os textos registrados via addText entram no mesmo rerender reativo de locale.
  if (opts.extraSection) {
    container.appendChild(opts.extraSection({ t, addText }));
  }

  function makeSectionTitle(key: string): HTMLHeadingElement {
    const h = document.createElement('h2');
    h.className = 'nds-text-h2 nds-text-foreground';
    addText(h, key, true);
    return h;
  }

  function makeSectionSubtitle(key: string): HTMLParagraphElement {
    const p = document.createElement('p');
    p.className = 'nds-text-body';
    addText(p, key, true);
    return p;
  }

  function makeParagraph(key: string): HTMLParagraphElement {
    const p = document.createElement('p');
    p.className = 'nds-text-body nds-leading-relaxed';
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
    const heads: HTMLElement[] = colKeys.map(() => {
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
      colKeys.forEach(() => {
        const td = createTableCell('');
        tr.appendChild(td);
        cells.push(td);
      });
      tbody.appendChild(tr);
      // Para cada linha, mapeamos a célula c à chave rows.<rk>.<ck>.
      const valueKeys = colKeys.map((ck, ci) => {
        // Linha objeto → rows.<rk>.<ck>; linha array → rows.<rk>.<índice da coluna>.
        if (isPlainObject(row)) return `${basePath}.rows.${rk}.${ck}`;
        if (Array.isArray(row)) return `${basePath}.rows.${rk}.${ci}`;
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
    ul.className = 'nds-stack nds-text-body nds-leading-relaxed';
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

  // Chaves candidatas a título e a corpo de um card (na ordem de preferência).
  const TITLE_KEYS = ['title', 'name', 'label'];
  const BODY_KEYS = ['body', 'description', 'usage', 'use', 'text'];

  /**
   * items → cada item vira um <Card> (title + description + extras) num grid fixo
   * de 2 colunas. Itens apenas-string viram uma lista vertical simples.
   */
  function renderItemsGrid(parent: HTMLElement, basePath: string, node: AnyRecord) {
    const isCards = Object.values(node).some((v) => isPlainObject(v));

    // Só strings → lista vertical (sem cards), como nas demais stacks.
    if (!isCards) {
      const ul = document.createElement('ul');
      ul.className = 'nds-stack nds-list-none';
      ul.dataset.spacing = 'md';
      Object.keys(node).forEach((k) => {
        const li = document.createElement('li');
        li.className = 'nds-text-body nds-leading-relaxed nds-accent-start';
        addText(li, `${basePath}.${k}`, true);
        ul.appendChild(li);
      });
      parent.appendChild(ul);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'nds-grid';
    grid.dataset.spacing = 'md';
    grid.dataset.cols = '2';
    grid.dataset.fixed = 'true';

    Object.keys(node).forEach((k) => {
      const item = node[k];
      const card = createCard();
      const header = createCardHeader();

      if (isPlainObject(item)) {
        const titleKey = TITLE_KEYS.find((x) => typeof item[x] === 'string');
        const bodyKey = BODY_KEYS.find((x) => typeof item[x] === 'string');
        if (titleKey) {
          const titleEl = createCardTitle();
          addText(titleEl, `${basePath}.${k}.${titleKey}`, true);
          header.appendChild(titleEl);
        }
        if (bodyKey) {
          const descEl = createCardDescription();
          addText(descEl, `${basePath}.${k}.${bodyKey}`, true);
          header.appendChild(descEl);
        }
        card.appendChild(header);

        // Campos extras → CardContent (metadados).
        const extraKeys = Object.keys(item).filter(
          (sk) => typeof item[sk] === 'string' && sk !== titleKey && sk !== bodyKey,
        );
        if (extraKeys.length) {
          const content = createCardContent();
          content.classList.add('nds-stack');
          content.dataset.spacing = 'xs';
          extraKeys.forEach((sk) => {
            const p = document.createElement('p');
            p.className = 'nds-text-caption nds-text-muted-foreground nds-m-0';
            addText(p, `${basePath}.${k}.${sk}`, true);
            content.appendChild(p);
          });
          card.appendChild(content);
        }
      } else if (typeof item === 'string') {
        const descEl = createCardDescription();
        addText(descEl, `${basePath}.${k}`, true);
        header.appendChild(descEl);
        card.appendChild(header);
      }

      grid.appendChild(card);
    });

    parent.appendChild(grid);
  }

  /** Renderiza uma seção genérica. */
  function renderSection(key: string, node: unknown) {
    const section = document.createElement('section');
    section.className = 'nds-stack nds-docs-section-divider';
    section.dataset.spacing = 'md';

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
      h.className = 'nds-text-h2 nds-text-foreground';
      h.textContent = key.charAt(0).toUpperCase() + key.slice(1);
      section.appendChild(h);
    }
    if (typeof node['subtitle'] === 'string') {
      section.appendChild(makeSectionSubtitle(`${key}.subtitle`));
    }

    // body / audience → parágrafos simples (sem rótulo de chave), como nas demais
    // stacks (React/Vue/Svelte tratam essas chaves como texto direto da seção).
    if (typeof node['body'] === 'string') {
      section.appendChild(makeParagraph(`${key}.body`));
    }
    if (typeof node['audience'] === 'string') {
      section.appendChild(makeParagraph(`${key}.audience`));
    }

    // Tabela cols + rows — rows pode ser objeto {id: linha} ou ARRAY de arrays
    // (posicional, ex.: "Tipos de uso" da página Motion); renderTable trata os dois
    if (isPlainObject(node['cols']) && (isPlainObject(node['rows']) || Array.isArray(node['rows']))) {
      renderTable(section, key, node);
    }

    // items → grid de cards (cada item = um card com title + body), como nas
    // demais stacks. Sem esse tratamento, o laço genérico criava um heading
    // "Items" e quebrava cada {title, body} em dois cards separados.
    if (isPlainObject(node['items'])) {
      renderItemsGrid(section, `${key}.items`, node['items'] as AnyRecord);
    }

    // rules → lista de acento SEM heading do nome da chave (igual às demais
    // stacks). Sem isso, o laço genérico criava o subtítulo "Rules".
    const rules = node['rules'];
    if (isStringArray(rules) || isPlainObject(rules)) {
      const ul = document.createElement('ul');
      ul.className = 'nds-stack nds-list-none';
      ul.dataset.spacing = 'md';
      const ruleKeys = Array.isArray(rules)
        ? rules.map((_, i) => String(i))
        : Object.keys(rules).filter((rk) => typeof (rules as AnyRecord)[rk] === 'string');
      ruleKeys.forEach((rk) => {
        const li = document.createElement('li');
        li.className = 'nds-text-body nds-leading-relaxed nds-accent-start';
        addText(li, `${key}.rules.${rk}`, true);
        ul.appendChild(li);
      });
      section.appendChild(ul);
    }

    // Iterar restantes
    const skip = new Set(['title', 'subtitle', 'body', 'audience', 'cols', 'rows', 'items', 'rules']);
    Object.keys(node).forEach((sk) => {
      if (skip.has(sk)) return;
      const child = node[sk];

      if (typeof child === 'string') {
        // `*Title` → h3, `*Code` → bloco de código, resto → parágrafo
        // (sem rótulo do nome da chave — igual às demais stacks).
        if (sk.endsWith('Title')) {
          const h3 = document.createElement('h3');
          h3.className = 'nds-text-h3 nds-text-foreground';
          addText(h3, `${key}.${sk}`, true);
          section.appendChild(h3);
        } else if (sk.endsWith('Code')) {
          const codeWrap = document.createElement('div');
          codeWrap.className = 'nds-docs-code';
          const codeEl = document.createElement('span');
          codeEl.className = 'nds-whitespace-pre';
          addText(codeEl, `${key}.${sk}`, true);
          codeWrap.appendChild(codeEl);
          section.appendChild(codeWrap);
        } else {
          const p = document.createElement('p');
          p.className = 'nds-text-body nds-leading-relaxed';
          addText(p, `${key}.${sk}`, true);
          section.appendChild(p);
        }
        return;
      }

      if (isStringArray(child)) {
        const block = document.createElement('div');
        block.className = 'nds-stack';
        block.dataset.spacing = 'xs';
        const h4 = document.createElement('h3');
        h4.className = 'nds-text-body nds-font-semibold';
        h4.textContent = sk.charAt(0).toUpperCase() + sk.slice(1);
        block.appendChild(h4);
        renderStringList(block, `${key}.${sk}`, child);
        section.appendChild(block);
        return;
      }

      if (isPlainObject(child)) {
        // Mapa puro de strings sem title (ex.: usage.ranges) → lista de acento,
        // sem heading inventado a partir do nome da chave (igual às demais stacks)
        const childVals = Object.values(child);
        if (
          typeof child['title'] !== 'string' &&
          childVals.length > 0 &&
          childVals.every((v) => typeof v === 'string')
        ) {
          const ul = document.createElement('ul');
          ul.className = 'nds-stack nds-list-none';
          ul.dataset.spacing = 'md';
          Object.keys(child).forEach((ssk) => {
            const li = document.createElement('li');
            li.className = 'nds-text-body nds-leading-relaxed nds-accent-start';
            addText(li, `${key}.${sk}.${ssk}`, true);
            ul.appendChild(li);
          });
          section.appendChild(ul);
          return;
        }

        // Sub-seção com title/subtitle
        const sub = document.createElement('div');
        sub.className = 'nds-stack';
        sub.dataset.spacing = 'sm';

        if (typeof child['title'] === 'string') {
          // mesmo nível visual das demais stacks (h3 do type scale)
          const h3 = document.createElement('h3');
          h3.className = 'nds-text-h3 nds-text-foreground';
          addText(h3, `${key}.${sk}.title`, true);
          sub.appendChild(h3);
        }
        if (typeof child['subtitle'] === 'string') {
          const psub = document.createElement('p');
          psub.className = 'nds-text-body';
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
            p.className = 'nds-text-body nds-leading-relaxed';
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
