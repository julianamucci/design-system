/**
 * useDocs — store para carregar e salvar translations.json via API Vite.
 */

import { writable, derived, get } from 'svelte/store';
import type { Locale } from '@/lib/i18n';

export type DocsContent = Record<string, Record<string, unknown>>;

export function createDocsStore(initialComponent: string) {
  const component = writable(initialComponent);
  const data      = writable<DocsContent | null>(null);
  const loading   = writable(true);
  const saving    = writable(false);
  const dirty     = writable(false);
  const error     = writable<string | null>(null);
  const locale    = writable<Locale>('pt-BR');

  const localeData = derived([data, locale], ([$data, $locale]) =>
    ($data?.[$locale] ?? {}) as Record<string, unknown>
  );

  async function load(name: string) {
    loading.set(true);
    error.set(null);
    try {
      const r = await fetch(`/api/docs/${name}`);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      data.set(await r.json() as DocsContent);
    } catch (e) {
      error.set((e as Error).message);
    } finally {
      loading.set(false);
    }
  }

  function setComponent(name: string) {
    component.set(name);
    load(name);
  }

  function updateField(key: string, value: string) {
    data.update((d) => {
      if (!d) return d;
      const loc = get(locale);
      if (!d[loc]) d[loc] = {};
      setNestedValue(d[loc] as Record<string, unknown>, key.split('.'), value);
      dirty.set(true);
      return { ...d };
    });
  }

  async function save() {
    const current = get(data);
    if (!current) return;
    saving.set(true);
    error.set(null);
    try {
      const res = await fetch(`/api/docs/${get(component)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `${res.status}`);
      }
      dirty.set(false);
    } catch (e) {
      error.set((e as Error).message);
    } finally {
      saving.set(false);
    }
  }

  load(initialComponent);

  return { component, data, loading, saving, dirty, error, locale, localeData, setComponent, updateField, save };
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
