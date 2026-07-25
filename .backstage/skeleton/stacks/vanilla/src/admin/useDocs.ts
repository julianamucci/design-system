/**
 * useDocs — vanilla TS observer-pattern store para carregar e salvar translations.json via API Vite.
 */

import type { Locale } from '@/lib/i18n';

export type DocsContent = Record<string, Record<string, unknown>>;

type Listener = () => void;

export function createDocsStore(initialComponent: string) {
  let component = initialComponent;
  let data: DocsContent | null = null;
  let loading = true;
  let saving = false;
  let dirty = false;
  let error: string | null = null;
  let locale: Locale = 'pt-BR';

  const listeners = new Set<Listener>();

  function notify() {
    listeners.forEach((fn) => fn());
  }

  function subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function getState() {
    return {
      component,
      data,
      loading,
      saving,
      dirty,
      error,
      locale,
      localeData: (data?.[locale] ?? {}) as Record<string, unknown>,
    };
  }

  async function load(name: string) {
    loading = true;
    error = null;
    notify();
    try {
      const r = await fetch(`/api/docs/${name}`);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      data = (await r.json()) as DocsContent;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      loading = false;
      notify();
    }
  }

  function setComponent(name: string) {
    component = name;
    load(name);
  }

  function setLocale(l: Locale) {
    locale = l;
    notify();
  }

  function updateField(key: string, value: string) {
    if (!data) return;
    if (!data[locale]) data[locale] = {};
    setNestedValue(data[locale] as Record<string, unknown>, key.split('.'), value);
    dirty = true;
    notify();
  }

  async function save() {
    if (!data) return;
    saving = true;
    error = null;
    notify();
    try {
      const res = await fetch(`/api/docs/${component}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `${res.status}`);
      }
      dirty = false;
    } catch (e) {
      error = (e as Error).message;
    } finally {
      saving = false;
      notify();
    }
  }

  load(initialComponent);

  return { subscribe, getState, setComponent, setLocale, updateField, save };
}

function setNestedValue(obj: Record<string, unknown>, keys: string[], value: unknown): void {
  const last = keys.at(-1)!;
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[last] = value;
}
