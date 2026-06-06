/**
 * DocsEditor.ts — editor visual de documentação com Quill.js (Vanilla JS/TS).
 * Acesse em: http://localhost:5173/?view=admin  (modo dev)
 */

import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { createDocsStore } from './useDocs';
import type { Locale } from '@/lib/i18n';
import { sanitizeHtml } from '@/lib/sanitize-html';

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
    wrapper.className = 'nds-admin-field-group';
    if (depth > 0) wrapper.dataset['nested'] = 'true';

    const heading = document.createElement('p');
    heading.className = 'nds-admin-field-group-title';
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
    wrapper.className = 'nds-admin-field';

    const lbl = document.createElement('label');
    lbl.className = 'nds-admin-field-label';
    lbl.textContent = label;

    const editorDiv = document.createElement('div');
    editorDiv.className = 'nds-admin-field-editor';

    wrapper.appendChild(lbl);
    wrapper.appendChild(editorDiv);
    container.appendChild(wrapper);

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: { toolbar: [['bold', 'italic', 'code'], ['link', 'clean']] },
    });
    quill.root.innerHTML = sanitizeHtml((value as string) ?? '');

    const handler = () => onchange(fieldKey, sanitizeHtml(quill.root.innerHTML));
    quill.on('text-change', handler);

    cleanups.push(() => quill.off('text-change', handler));
  } else if (!Array.isArray(value)) {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-admin-field';

    const lbl = document.createElement('label');
    lbl.className = 'nds-admin-field-label';
    lbl.textContent = label;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = String(value ?? '');
    input.className = 'nds-admin-field-input';

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
  root.className = 'nds-admin';
  root.innerHTML = `
    <aside class="nds-admin-sidebar">
      <div class="nds-admin-sidebar-header">
        <span>Docs Editor</span>
        <span id="de-dirty-dot" class="nds-admin-dirty-dot nds-hidden" title="Não salvo"></span>
      </div>
      <nav id="de-component-list" class="nds-admin-component-list">
        <p class="nds-admin-component-list-empty">Carregando...</p>
      </nav>
      <div class="nds-admin-locale-switcher" id="de-locale-switcher"></div>
    </aside>

    <div class="nds-admin-main">
      <header class="nds-admin-header">
        <h1 id="de-title" class="nds-admin-title">button</h1>
        <span id="de-locale-label" class="nds-admin-locale-label"></span>
        <span id="de-error" class="nds-admin-error nds-hidden"></span>
        <div class="nds-admin-actions">
          <span id="de-dirty-label" class="nds-admin-dirty-label nds-hidden">Alterações não salvas</span>
          <button id="de-save-btn" class="nds-admin-save-btn" disabled>Salvar</button>
          <span class="nds-admin-shortcut-hint">Ctrl+S</span>
        </div>
      </header>

      <main id="de-fields" class="nds-admin-fields">
        <div class="nds-app-loading">
          <div class="nds-spinner" data-size="sm"></div>
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
    btn.className = 'nds-admin-locale-btn de-locale-btn';
    btn.textContent = LOCALE_LABELS[l];
    btn.addEventListener('click', () => store.setLocale(l));
    elLocaleSwitcher.appendChild(btn);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  function renderLocaleButtons(activeLocale: string) {
    root.querySelectorAll<HTMLButtonElement>('.de-locale-btn').forEach((btn) => {
      btn.dataset['active'] = String(btn.dataset['locale'] === activeLocale);
    });
  }

  function renderFields(localeData: Record<string, unknown>) {
    fieldCleanups.forEach((fn) => fn());
    fieldCleanups = [];
    elFields.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'nds-admin-fields-wrapper';
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
    elDirtyDot.classList.toggle('nds-hidden', !dirty);
    elDirtyLabel.classList.toggle('nds-hidden', !dirty);
    elSaveBtn.disabled = saving || !dirty;
    elSaveBtn.textContent = saving ? 'Salvando...' : 'Salvar';

    if (error) {
      elError.textContent = `Erro: ${error}`;
      elError.classList.remove('nds-hidden');
    } else {
      elError.classList.add('nds-hidden');
    }

    renderLocaleButtons(locale);

    if (loading) {
      elFields.innerHTML = `
        <div class="nds-app-loading">
          <div class="nds-spinner" data-size="sm"></div>
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
      btn.className = 'nds-admin-comp-btn';
      btn.dataset['active'] = String(activeComp === comp);
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
