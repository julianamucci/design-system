/**
 * DocsEditor.ts — editor visual de documentação com Quill.js (Vanilla JS/TS).
 * Acesse em: http://localhost:5173/?view=admin  (modo dev)
 */

import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { createDocsStore } from './useDocs';
import type { Locale } from '@/lib/i18n';

const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const LOCALE_LABELS: Record<Locale, string> = { 'pt-BR': '🇧🇷 PT', en: '🇺🇸 EN', es: '🇪🇸 ES' };

// ─── Field rendering ──────────────────────────────────────────────────────────

function renderField(
  container: HTMLElement,
  fieldKey: string,
  value: unknown,
  depth: number,
  onchange: (key: string, val: string) => void
): (() => void)[] {
  const label = fieldKey.split('.').at(-1) ?? fieldKey;
  const isHtml = typeof value === 'string' && /<[a-z]/i.test(value);
  const isNested = typeof value === 'object' && value !== null && !Array.isArray(value);

  const cleanups: (() => void)[] = [];

  if (isNested) {
    const wrapper = document.createElement('div');
    wrapper.className = `space-y-3${depth > 0 ? ' pl-4 border-l border-border' : ''}`;

    const heading = document.createElement('p');
    heading.className = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';
    heading.textContent = label;
    wrapper.appendChild(heading);

    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const child = document.createElement('div');
      wrapper.appendChild(child);
      cleanups.push(...renderField(child, `${fieldKey}.${k}`, v, depth + 1, onchange));
    }

    container.appendChild(wrapper);
  } else if (isHtml) {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-1';

    const lbl = document.createElement('label');
    lbl.className = 'text-xs font-medium text-muted-foreground';
    lbl.textContent = label;

    const editorDiv = document.createElement('div');
    editorDiv.className =
      'rounded-md border border-border bg-background [&_.ql-editor]:min-h-[80px] [&_.ql-editor]:text-foreground';

    wrapper.appendChild(lbl);
    wrapper.appendChild(editorDiv);
    container.appendChild(wrapper);

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: { toolbar: [['bold', 'italic', 'code'], ['link', 'clean']] },
    });
    quill.root.innerHTML = (value as string) ?? '';

    const handler = () => onchange(fieldKey, quill.root.innerHTML);
    quill.on('text-change', handler);

    cleanups.push(() => quill.off('text-change', handler));
  } else if (!Array.isArray(value)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-1';

    const lbl = document.createElement('label');
    lbl.className = 'text-xs font-medium text-muted-foreground';
    lbl.textContent = label;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = String(value ?? '');
    input.className =
      'w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

    const inputHandler = (e: Event) =>
      onchange(fieldKey, (e.target as HTMLInputElement).value);
    input.addEventListener('input', inputHandler);
    cleanups.push(() => input.removeEventListener('input', inputHandler));

    wrapper.appendChild(lbl);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  }

  return cleanups;
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function createDocsEditor(root: HTMLElement): () => void {
  const store = createDocsStore('button');
  let fieldCleanups: (() => void)[] = [];

  // ── Build skeleton ────────────────────────────────────────────────────────
  root.className = 'flex h-screen bg-background text-foreground font-sans';
  root.innerHTML = `
    <aside id="de-sidebar" class="w-56 shrink-0 border-r border-border flex flex-col">
      <div class="flex h-14 items-center gap-2 border-b border-border px-4">
        <span class="font-semibold text-sm">Docs Editor</span>
        <span id="de-dirty-dot" class="ml-auto h-2 w-2 rounded-full bg-warning hidden" title="Não salvo"></span>
      </div>
      <nav id="de-component-list" class="flex-1 overflow-y-auto py-2">
        <p class="px-4 text-xs text-muted-foreground">Carregando...</p>
      </nav>
      <div class="border-t border-border p-3 flex gap-1" id="de-locale-switcher"></div>
    </aside>

    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-14 items-center gap-3 border-b border-border px-6">
        <h1 id="de-title" class="text-sm font-semibold">button</h1>
        <span id="de-locale-label" class="text-xs text-muted-foreground"></span>
        <span id="de-error" class="text-xs text-destructive hidden"></span>
        <div class="ml-auto flex items-center gap-2">
          <span id="de-dirty-label" class="text-xs text-warning hidden">Alterações não salvas</span>
          <button id="de-save-btn" disabled
            class="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50">
            Salvar
          </button>
          <span class="text-xs text-muted-foreground">Ctrl+S</span>
        </div>
      </header>

      <main id="de-fields" class="flex-1 overflow-y-auto p-6">
        <div class="flex h-32 items-center justify-center">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </main>
    </div>
  `;

  // ── Element refs ──────────────────────────────────────────────────────────
  const elDirtyDot     = root.querySelector<HTMLElement>('#de-dirty-dot')!;
  const elComponentList = root.querySelector<HTMLElement>('#de-component-list')!;
  const elLocaleSwitcher = root.querySelector<HTMLElement>('#de-locale-switcher')!;
  const elTitle        = root.querySelector<HTMLElement>('#de-title')!;
  const elLocaleLabel  = root.querySelector<HTMLElement>('#de-locale-label')!;
  const elError        = root.querySelector<HTMLElement>('#de-error')!;
  const elDirtyLabel   = root.querySelector<HTMLElement>('#de-dirty-label')!;
  const elSaveBtn      = root.querySelector<HTMLButtonElement>('#de-save-btn')!;
  const elFields       = root.querySelector<HTMLElement>('#de-fields')!;

  // ── Locale switcher ───────────────────────────────────────────────────────
  LOCALES.forEach((l) => {
    const btn = document.createElement('button');
    btn.dataset['locale'] = l;
    btn.className = 'de-locale-btn flex-1 rounded py-1 text-xs transition-colors bg-muted text-muted-foreground hover:bg-muted/80';
    btn.textContent = LOCALE_LABELS[l];
    btn.addEventListener('click', () => store.setLocale(l));
    elLocaleSwitcher.appendChild(btn);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  function renderLocaleButtons(activeLocale: string) {
    root.querySelectorAll<HTMLButtonElement>('.de-locale-btn').forEach((btn) => {
      const isActive = btn.dataset['locale'] === activeLocale;
      btn.className = `de-locale-btn flex-1 rounded py-1 text-xs transition-colors ${
        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`;
    });
  }

  function renderFields(localeData: Record<string, unknown>) {
    fieldCleanups.forEach((fn) => fn());
    fieldCleanups = [];
    elFields.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'max-w-2xl space-y-6';
    elFields.appendChild(wrapper);

    for (const [key, value] of Object.entries(localeData)) {
      const slot = document.createElement('div');
      wrapper.appendChild(slot);
      fieldCleanups.push(
        ...renderField(slot, key, value, 0, (k, v) => store.updateField(k, v))
      );
    }
  }

  function update() {
    const { loading, saving, dirty, error, locale, localeData, component } = store.getState();

    elTitle.textContent = component;
    elLocaleLabel.textContent = LOCALE_LABELS[locale];
    elDirtyDot.classList.toggle('hidden', !dirty);
    elDirtyLabel.classList.toggle('hidden', !dirty);
    elSaveBtn.disabled = saving || !dirty;
    elSaveBtn.textContent = saving ? 'Salvando...' : 'Salvar';

    if (error) {
      elError.textContent = `Erro: ${error}`;
      elError.classList.remove('hidden');
    } else {
      elError.classList.add('hidden');
    }

    renderLocaleButtons(locale);

    if (loading) {
      elFields.innerHTML = `
        <div class="flex h-32 items-center justify-center">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>`;
    } else {
      renderFields(localeData);
    }
  }

  // ── Save button ───────────────────────────────────────────────────────────
  elSaveBtn.addEventListener('click', () => store.save());

  // ── Ctrl+S ────────────────────────────────────────────────────────────────
  function handleKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      store.save();
    }
  }
  window.addEventListener('keydown', handleKeyDown);

  // ── Subscribe to store ────────────────────────────────────────────────────
  const unsubscribe = store.subscribe(update);

  // ── Component list ────────────────────────────────────────────────────────
  let activeComp = 'button';
  function renderComponentList(components: string[]) {
    elComponentList.innerHTML = '';
    components.forEach((comp) => {
      const btn = document.createElement('button');
      btn.className = `de-comp-btn w-full px-4 py-2 text-left text-sm transition-colors ${
        activeComp === comp
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`;
      btn.textContent = comp;
      btn.addEventListener('click', () => {
        activeComp = comp;
        store.setComponent(comp);
        renderComponentList(components);
      });
      elComponentList.appendChild(btn);
    });
  }

  fetch('/api/docs/__components')
    .then((r) => r.json() as Promise<string[]>)
    .then((comps) => renderComponentList(comps))
    .catch(() => renderComponentList([activeComp]));

  // ── Cleanup ───────────────────────────────────────────────────────────────
  return () => {
    unsubscribe();
    fieldCleanups.forEach((fn) => fn());
    window.removeEventListener('keydown', handleKeyDown);
  };
}
