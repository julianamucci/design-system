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
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar flex flex-col md:relative">
      <div class="flex h-14 items-center gap-2 border-b border-border px-4">
        <div class="h-6 w-6 rounded bg-primary"></div>
        <span class="font-semibold text-sidebar-foreground">Design System</span>
        <span class="ml-auto text-xs text-muted-foreground">Vanilla JS</span>
      </div>
      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        ${Object.entries(groups).map(([groupName, groupItems]) => `
          <div>
            <p class="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              ${groupName}
            </p>
            ${groupItems.map(item => `
              <button
                data-nav="${item.id ?? ''}"
                class="ds-nav-item flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors
                  ${activeComponent === item.id
                    ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
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
    <div class="p-8 max-w-2xl">
      <h1 class="text-3xl font-bold tracking-tight mb-2">Design System</h1>
      <p class="text-muted-foreground mb-6">
        Biblioteca de componentes em <strong>Vanilla JS</strong> usando
        <a href="https://basecoatui.com" target="_blank" rel="noopener noreferrer"
           class="underline hover:text-foreground">Basecoat UI</a> e Tailwind CSS.
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <button data-nav="alert" class="ds-home-nav rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors">
          <p class="font-medium">Alert</p>
          <p class="text-sm text-muted-foreground">Feedback visual para o usuário</p>
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
    <div class="flex h-64 items-center justify-center">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
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

  root.className = 'flex h-screen overflow-hidden bg-background text-foreground font-sans';
  root.innerHTML = `
    <div id="ds-sidebar-slot"></div>
    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
        <span id="ds-header-title" class="flex-1 text-sm text-muted-foreground">Início</span>
        <div id="ds-locale-switcher" class="flex gap-1">
          ${(['pt-BR', 'en', 'es'] as Locale[]).map((l) => `
            <button data-locale="${l}" class="ds-locale-btn px-2 py-1 text-xs rounded hover:bg-muted transition-colors ${getLocale() === l ? 'font-bold' : ''}">
              ${l === 'pt-BR' ? 'PT' : l === 'en' ? 'EN' : 'ES'}
            </button>
          `).join('')}
        </div>
        <button id="ds-dark-toggle" class="p-1.5 rounded-md hover:bg-muted transition-colors" aria-label="Toggle dark mode">
          ${isDark ? '☀️' : '🌙'}
        </button>
      </header>
      <main id="ds-content" class="flex-1 overflow-y-auto"></main>
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
        b.classList.toggle('font-bold', b.dataset['locale'] === next);
      });
    });
  });

  // Initial navigation
  const urlComponent = new URLSearchParams(window.location.search).get('component');
  navigateTo(urlComponent || null);
}
