<script lang="ts">
  import { onMount } from 'svelte';
  import { Moon, Sun, Home, MousePointer, Database } from 'lucide-svelte';
  import DocsEditor from './admin/DocsEditor.svelte';

  const isAdminView = new URLSearchParams(window.location.search).get('view') === 'admin';

  // ─── Estado global ──────────────────────────────────────────────────────────

  let isDark = $state(false);
  let activeComponent = $state<string | null>(null);
  let sidebarOpen = $state(false);

  // ─── Lazy-loaded docs ───────────────────────────────────────────────────────

  const lazyDocs: Record<string, () => Promise<{ default: any }>> = {
    'alert':  () => import('./components/docs/AlertDocs.svelte'),
    'icons':  () => import('./components/docs/IconsDocs.svelte'),
  };

  // ─── Navegação ──────────────────────────────────────────────────────────────

  const navItems = [
    { group: 'Visão Geral', icon: Home,         id: null,    label: 'Início' },
    { group: 'Componentes', icon: MousePointer, id: 'alert', label: 'Alert'  },
    { group: 'Fundamentos', icon: Database,     id: 'icons', label: 'Icons'  },
  ];

  let CurrentDoc = $state<{ default: any } | null>(null);
  let loadingDoc = $state(false);

  async function loadDoc(id: string | null) {
    if (!id) { CurrentDoc = null; return; }
    if (!lazyDocs[id]) { CurrentDoc = null; return; }
    loadingDoc = true;
    try {
      CurrentDoc = await lazyDocs[id]();
    } finally {
      loadingDoc = false;
    }
  }

  function navigate(id: string | null) {
    activeComponent = id;
    sidebarOpen = false;
    loadDoc(id);

    // Sync URL
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('component', id);
    else url.searchParams.delete('component');
    history.pushState({}, '', url);
  }

  // ─── Dark mode ──────────────────────────────────────────────────────────────

  function toggleDark() {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
  }

  // ─── Init ───────────────────────────────────────────────────────────────────

  onMount(() => {
    const stored = localStorage.getItem('ds-theme');
    isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);

    const urlComponent = new URLSearchParams(window.location.search).get('component');
    if (urlComponent) navigate(urlComponent);
  });

  $effect(() => {
    localStorage.setItem('ds-theme', isDark ? 'dark' : 'light');
  });

  // ─── Grupos de navegação ─────────────────────────────────────────────────────

  const groups = $derived(
    navItems.reduce((acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    }, {} as Record<string, typeof navItems>)
  );
</script>

{#if isAdminView}
  <DocsEditor />
{:else}
<div class="flex h-screen overflow-hidden bg-background text-foreground font-sans">
  <!-- Sidebar -->
  <aside
    class="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar flex flex-col transition-transform duration-300 md:relative md:translate-x-0"
    class:translate-x-0={sidebarOpen}
    class:-translate-x-full={!sidebarOpen}
  >
    <!-- Logo -->
    <div class="flex h-14 items-center gap-2 border-b border-border px-4">
      <div class="h-6 w-6 rounded bg-primary"></div>
      <span class="font-semibold text-sidebar-foreground">Design System</span>
      <span class="ml-auto text-xs text-muted-foreground">Svelte</span>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
      {#each Object.entries(groups) as [groupName, items]}
        <div>
          <p class="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {groupName}
          </p>
          {#each items as item}
            <button
              onclick={() => navigate(item.id)}
              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors
                {activeComponent === item.id
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}"
            >
              <item.icon class="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          {/each}
        </div>
      {/each}
    </nav>
  </aside>

  <!-- Main -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Topbar -->
    <header class="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
      <!-- Mobile menu toggle -->
      <button
        class="md:hidden p-1.5 rounded-md hover:bg-muted"
        onclick={() => sidebarOpen = !sidebarOpen}
        aria-label="Menu"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span class="flex-1 text-sm text-muted-foreground">
        {activeComponent ? activeComponent : 'Início'}
      </span>

      <!-- Dark mode toggle -->
      <button
        onclick={toggleDark}
        class="p-1.5 rounded-md hover:bg-muted transition-colors"
        aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
      >
        {#if isDark}
          <Sun class="h-4 w-4" />
        {:else}
          <Moon class="h-4 w-4" />
        {/if}
      </button>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto">
      {#if loadingDoc}
        <div class="flex h-full items-center justify-center">
          <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      {:else if CurrentDoc}
        <CurrentDoc.default />
      {:else}
        <!-- Home page -->
        <div class="p-8 max-w-2xl">
          <h1 class="text-3xl font-bold tracking-tight mb-2">Design System</h1>
          <p class="text-muted-foreground mb-6">
            Biblioteca de componentes em <strong>Svelte 5</strong> usando shadcn-svelte e bits-ui.
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              onclick={() => navigate('alert')}
              class="rounded-lg border border-border p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <p class="font-medium">Alert</p>
              <p class="text-sm text-muted-foreground">Feedback visual para o usuário</p>
            </button>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<!-- Sidebar overlay (mobile) -->
{#if sidebarOpen}
  <div
    class="fixed inset-0 z-40 bg-black/50 md:hidden"
    onclick={() => sidebarOpen = false}
    role="presentation"
  ></div>
{/if}
{/if}
