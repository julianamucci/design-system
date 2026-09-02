<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';
  import Home from '@lucide/svelte/icons/house';
  import MousePointer from '@lucide/svelte/icons/mouse-pointer';
  import Database from '@lucide/svelte/icons/database';


  // ─── Estado global ──────────────────────────────────────────────────────────

  let isDark = $state(false);
  let activeComponent = $state<string | null>(null);
  let sidebarOpen = $state(false);

  // ─── Lazy-loaded docs ───────────────────────────────────────────────────────

  const lazyDocs: Record<string, () => Promise<{ default: Component }>> = {
    'alert':  () => import('./components/docs/AlertDocs.svelte'),
    'icons':  () => import('./components/docs/IconsDocs.svelte'),
  };

  // ─── Navegação ──────────────────────────────────────────────────────────────

  const navItems = [
    { group: 'Visão Geral', icon: Home,         id: null,    label: 'Início' },
    { group: 'Componentes', icon: MousePointer, id: 'alert', label: 'Alert'  },
    { group: 'Fundamentos', icon: Database,     id: 'icons', label: 'Icons'  },
  ];

  let CurrentDoc = $state<{ default: Component } | null>(null);
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

<div class="nds-app">
  <!-- Sidebar -->
  <aside class="nds-app-sidebar" data-drawer="true" data-open={sidebarOpen ? 'true' : 'false'}>
    <!-- Logo -->
    <div class="nds-app-sidebar-header">
      <div class="nds-app-sidebar-logo"></div>
      <span>Design System</span>
      <span class="nds-app-sidebar-tag">Svelte</span>
    </div>

    <!-- Nav -->
    <nav class="nds-app-sidebar-nav">
      {#each Object.entries(groups) as [groupName, items] (groupName)}
        <div>
          <p class="nds-app-nav-group-title">{groupName}</p>
          {#each items as item (item.id)}
            <button
              onclick={() => navigate(item.id)}
              class="nds-app-nav-item"
              data-active={activeComponent === item.id ? 'true' : 'false'}
            >
              <item.icon class="nds-icon nds-shrink-0" />
              {item.label}
            </button>
          {/each}
        </div>
      {/each}
    </nav>
  </aside>

  <!-- Main -->
  <div class="nds-app-main">
    <!-- Topbar -->
    <header class="nds-app-header">
      <!-- Mobile menu toggle -->
      <button
        class="nds-icon-button nds-md-hidden"
        onclick={() => sidebarOpen = !sidebarOpen}
        aria-label="Menu"
      >
        <svg class="nds-icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span class="nds-app-header-title">
        {activeComponent ? activeComponent : 'Início'}
      </span>

      <!-- Dark mode toggle -->
      <button
        onclick={toggleDark}
        class="nds-icon-button"
        aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
      >
        {#if isDark}
          <Sun class="nds-icon" />
        {:else}
          <Moon class="nds-icon" />
        {/if}
      </button>
    </header>

    <!-- Content -->
    <main class="nds-app-content">
      {#if loadingDoc}
        <div class="nds-app-loading">
          <div class="nds-spinner"></div>
        </div>
      {:else if CurrentDoc}
        <CurrentDoc.default />
      {:else}
        <!-- Home page -->
        <div class="nds-app-home">
          <h1 class="nds-app-home-title">Design System</h1>
          <p class="nds-app-home-lead">
            Biblioteca de componentes em <strong>Svelte 5</strong> usando o design system-svelte e bits-ui.
          </p>
          <div class="nds-app-home-grid">
            <button onclick={() => navigate('alert')} class="nds-app-home-card">
              <p class="nds-app-home-card-title">Alert</p>
              <p class="nds-app-home-card-desc">Feedback visual para o usuário</p>
            </button>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<!-- Véu da gaveta (mobile) -->
{#if sidebarOpen}
  <div class="nds-app-scrim" onclick={() => sidebarOpen = false} role="presentation"></div>
{/if}
