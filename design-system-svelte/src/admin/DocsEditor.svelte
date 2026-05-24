<script lang="ts">
/**
 * DocsEditor.svelte — editor visual com Quill.js (Svelte 5 runes).
 * Acesse em: http://localhost:5173/?view=admin  (modo dev)
 */
  import { onMount, onDestroy } from 'svelte';
  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';
  import { createDocsStore } from './useDocs';
  import type { Locale } from '@/lib/i18n';

  const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
  const LOCALE_LABELS: Record<Locale, string> = { 'pt-BR': '🇧🇷 PT', en: '🇺🇸 EN', es: '🇪🇸 ES' };

  let components = $state<string[]>([]);
  let activeComponent = $state('button');

  const store = createDocsStore(activeComponent);
  const { loading, saving, dirty, error, locale, localeData, setComponent, updateField, save } = store;

  function changeComponent(name: string) {
    activeComponent = name;
    setComponent(name);
  }

  // Atalho Ctrl+S
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      save();
    }
  }

  onMount(async () => {
    window.addEventListener('keydown', handleKeyDown);
    try {
      const r = await fetch('/api/docs/__components');
      components = await r.json();
    } catch {
      components = [activeComponent];
    }
  });

  onDestroy(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<div class="flex h-screen bg-background text-foreground font-sans">

  <!-- Sidebar -->
  <aside class="w-56 shrink-0 border-r border-border flex flex-col">
    <div class="flex h-14 items-center gap-2 border-b border-border px-4">
      <span class="font-semibold text-sm">Docs Editor</span>
      {#if $dirty}
        <span class="ml-auto h-2 w-2 rounded-full bg-warning" title="Não salvo"></span>
      {/if}
    </div>

    <nav class="flex-1 overflow-y-auto py-2">
      {#if !components.length}
        <p class="px-4 text-xs text-muted-foreground">Carregando...</p>
      {/if}
      {#each components as comp}
        <button
          onclick={() => changeComponent(comp)}
          class="w-full px-4 py-2 text-left text-sm transition-colors
            {activeComponent === comp
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}"
        >
          {comp}
        </button>
      {/each}
    </nav>

    <!-- Locale switcher -->
    <div class="border-t border-border p-3 flex gap-1">
      {#each LOCALES as l}
        <button
          onclick={() => locale.set(l)}
          class="flex-1 rounded py-1 text-xs transition-colors
            {$locale === l
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'}"
        >
          {LOCALE_LABELS[l]}
        </button>
      {/each}
    </div>
  </aside>

  <!-- Editor area -->
  <div class="flex flex-1 flex-col overflow-hidden">

    <!-- Toolbar -->
    <header class="flex h-14 items-center gap-3 border-b border-border px-6">
      <h1 class="text-sm font-semibold">{activeComponent}</h1>
      <span class="text-xs text-muted-foreground">{LOCALE_LABELS[$locale]}</span>
      {#if $error}
        <span class="text-xs text-destructive">Erro: {$error}</span>
      {/if}
      <div class="ml-auto flex items-center gap-2">
        {#if $dirty}
          <span class="text-xs text-warning">Alterações não salvas</span>
        {/if}
        <button
          onclick={save}
          disabled={$saving || !$dirty}
          class="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {$saving ? 'Salvando...' : 'Salvar'}
        </button>
        <span class="text-xs text-muted-foreground">Ctrl+S</span>
      </div>
    </header>

    <!-- Fields -->
    <main class="flex-1 overflow-y-auto p-6">
      {#if $loading}
        <div class="flex h-32 items-center justify-center">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      {:else}
        <div class="max-w-2xl space-y-6">
          {#each Object.entries($localeData) as [key, value] (key)}
            {@render FieldEditorSnippet(key, value, 0, updateField)}
          {/each}
        </div>
      {/if}
    </main>
  </div>
</div>

<!-- ─── FieldEditor ─────────────────────────────────────────────────────────── -->
{#snippet FieldEditorSnippet(fieldKey: string, value: unknown, depth: number, onchange: (k: string, v: string) => void)}
  {@const label = fieldKey.split('.').at(-1) ?? fieldKey}
  {@const isHtml = typeof value === 'string' && /<[a-z]/i.test(value)}
  {@const isNested = typeof value === 'object' && value !== null && !Array.isArray(value)}

  {#if isNested}
    <div class="{depth > 0 ? 'pl-4 border-l border-border' : ''} space-y-3">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {#each Object.entries(value as Record<string, unknown>) as [k, v]}
        {@render FieldEditorSnippet(`${fieldKey}.${k}`, v, depth + 1, onchange)}
      {/each}
    </div>
  {:else if isHtml}
    <div class="space-y-1">
      <label class="text-xs font-medium text-muted-foreground">{label}</label>
      <QuillField {fieldKey} value={String(value ?? '')} {onchange} />
    </div>
  {:else if !Array.isArray(value)}
    <div class="space-y-1">
      <label class="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={String(value ?? '')}
        oninput={(e) => onchange(fieldKey, (e.target as HTMLInputElement).value)}
        class="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  {/if}
{/snippet}
