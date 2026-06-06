import { setLocale, getLocale, onLocaleChange, type Locale } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { createDocsEditor } from '@/admin/DocsEditor';

// ─── Docs registry ────────────────────────────────────────────────────────────

type DocFactory = () => Promise<{ render: (container: HTMLElement) => (() => void) | void }>;

const docRegistry: Record<string, DocFactory> = {
  alert: () => import('./components/docs/AlertDocs').then((m) => ({
    render: (container: HTMLElement) => {
      container.innerHTML = '';
      container.appendChild(m.createAlertDocs());
    },
  })),
  icons: () => import('./components/docs/IconsDocs').then((m) => ({
    render: (container: HTMLElement) => {
      container.innerHTML = '';
      container.appendChild(m.createIconsDocs());
    },
  })),
};

// ─── Estado ───────────────────────────────────────────────────────────────────

let activeComponent: string | null = null;
let currentCleanup: (() => void) | null = null;
let isDark = false;
let localeCleanup: (() => void) | null = null;

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderSidebar(root: HTMLElement): void {
  const items = [
    { id: null,    label: 'Início', group: 'Visão Geral' },
    { id: 'alert', label: 'Alert',  group: 'Componentes' },
    { id: 'icons', label: 'Icons',  group: 'Fundamentos' },
  ];

  const groups = items.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  root.innerHTML = `
    <aside class="nds-app-sidebar">
      <div class="nds-app-sidebar-header">
        <div class="nds-app-sidebar-logo"></div>
        <span>Design System</span>
        <span class="nds-app-sidebar-tag">Vanilla JS</span>
      </div>
      <nav class="nds-app-sidebar-nav">
        ${Object.entries(groups).map(([groupName, groupItems]) => `
          <div>
            <p class="nds-app-nav-group-title">${groupName}</p>
            ${groupItems.map(item => `
              <button
                data-nav="${item.id ?? ''}"
                data-active="${activeComponent === item.id}"
                class="nds-app-nav-item ds-nav-item"
              >
                ${item.label}
              </button>
            `).join('')}
          </div>
        `).join('')}
      </nav>
    </aside>
  `;

  root.querySelectorAll<HTMLButtonElement>('.ds-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset['nav'] || null;
      navigateTo(id);
    });
  });
}

function renderHome(container: HTMLElement): void {
  container.innerHTML = `
    <div class="nds-app-home">
      <h1 class="nds-app-home-title">Design System</h1>
      <p class="nds-app-home-lead">
        Biblioteca de componentes em <strong>Vanilla JS</strong> usando
        <a href="https://basecoatui.com" target="_blank" rel="noopener noreferrer"
           class="nds-app-home-link">Basecoat UI</a>.
      </p>
      <div class="nds-app-home-grid">
        <button data-nav="alert" class="nds-app-home-card ds-home-nav">
          <p class="nds-app-home-card-title">Alert</p>
          <p class="nds-app-home-card-desc">Feedback visual para o usuário</p>
        </button>
      </div>
    </div>
  `;

  container.querySelectorAll<HTMLButtonElement>('.ds-home-nav').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset['nav'] ?? null));
  });
}

// ─── Navegação ────────────────────────────────────────────────────────────────

async function navigateTo(id: string | null): Promise<void> {
  activeComponent = id;

  // URL sync
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('component', id);
  else url.searchParams.delete('component');
  history.pushState({}, '', url);

  // Cleanup previous page
  currentCleanup?.();
  currentCleanup = null;
  localeCleanup?.();
  localeCleanup = null;

  const contentEl = document.getElementById('ds-content');
  if (!contentEl) return;

  if (!id || !docRegistry[id]) {
    renderHome(contentEl);
    return;
  }

  contentEl.innerHTML = `
    <div class="nds-app-loading">
      <div class="nds-spinner"></div>
    </div>
  `;

  const mod = await docRegistry[id]();
  const cleanup = mod.render(contentEl);
  if (cleanup) currentCleanup = cleanup;

  // Re-render on locale change
  localeCleanup = onLocaleChange(async () => {
    currentCleanup?.();
    const freshMod = await docRegistry[id]();
    const freshCleanup = freshMod.render(contentEl);
    if (freshCleanup) currentCleanup = freshCleanup;
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

export function createApp(root: HTMLElement): void {
  // Admin editor route: ?view=admin
  if (new URLSearchParams(window.location.search).get('view') === 'admin') {
    createDocsEditor(root);
    return;
  }

  // Detect dark mode
  isDark =
    localStorage.getItem('ds-theme') === 'dark' ||
    (!localStorage.getItem('ds-theme') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);

  root.className = 'nds-app';
  root.innerHTML = `
    <div id="ds-sidebar-slot"></div>
    <div class="nds-app-main">
      <header class="nds-app-header">
        <span id="ds-header-title" class="nds-app-header-title">Início</span>
        <div id="ds-locale-switcher" class="nds-app-locale-switcher">
          ${(['pt-BR', 'en', 'es'] as Locale[]).map((l) => `
            <button data-locale="${l}" data-active="${getLocale() === l}" class="nds-app-locale-btn ds-locale-btn">
              ${l === 'pt-BR' ? 'PT' : l === 'en' ? 'EN' : 'ES'}
            </button>
          `).join('')}
        </div>
        <button id="ds-dark-toggle" class="nds-icon-button" aria-label="Toggle dark mode">
          ${isDark ? '☀️' : '🌙'}
        </button>
      </header>
      <main id="ds-content" class="nds-app-content"></main>
    </div>
  `;

  // Sidebar
  const sidebarSlot = root.querySelector<HTMLElement>('#ds-sidebar-slot')!;
  renderSidebar(sidebarSlot);

  // Dark toggle
  root.querySelector('#ds-dark-toggle')?.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('ds-theme', isDark ? 'dark' : 'light');
    const btn = root.querySelector<HTMLButtonElement>('#ds-dark-toggle');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  });

  // Locale switcher
  root.querySelectorAll<HTMLButtonElement>('.ds-locale-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prev = getLocale();
      const next = btn.dataset['locale'] as Locale;
      setLocale(next);
      track('language_switched', { previous_language: prev, new_language: next });
      // Update active state
      root.querySelectorAll<HTMLButtonElement>('.ds-locale-btn').forEach((b) => {
        b.dataset['active'] = String(b.dataset['locale'] === next);
      });
    });
  });

  // Initial navigation
  const urlComponent = new URLSearchParams(window.location.search).get('component');
  navigateTo(urlComponent || null);
}
