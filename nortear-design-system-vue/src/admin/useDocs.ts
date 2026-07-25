/**
 * useDocs — composable para carregar e salvar translations.json via API Vite.
 */

import { ref, readonly, type Ref } from 'vue';
import type { Locale } from '@/lib/i18n';

export type DocsContent = Record<string, Record<string, unknown>>;

export function useDocs(initialComponent: string) {
  const component = ref(initialComponent);
  const data      = ref<DocsContent | null>(null);
  const loading   = ref(true);
  const saving    = ref(false);
  const dirty     = ref(false);
  const error     = ref<string | null>(null);
  const locale    = ref<Locale>('pt-BR');

  async function load(name: string) {
    loading.value = true;
    error.value   = null;
    try {
      const r = await fetch(`/api/docs/${name}`);
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      data.value = await r.json() as DocsContent;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      loading.value = false;
    }
  }

  function setComponent(name: string) {
    component.value = name;
    load(name);
  }

  function updateField(key: string, value: string) {
    if (!data.value) return;
    const loc = locale.value;
    if (!data.value[loc]) data.value[loc] = {};
    setNestedValue(data.value[loc] as Record<string, unknown>, key.split('.'), value);
    dirty.value = true;
  }

  async function save() {
    if (!data.value) return;
    saving.value = true;
    error.value  = null;
    try {
      const res = await fetch(`/api/docs/${component.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.value),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `${res.status}`);
      }
      dirty.value = false;
    } catch (e) {
      error.value = (e as Error).message;
    } finally {
      saving.value = false;
    }
  }

  load(initialComponent);

  return {
    component: readonly(component) as Ref<string>,
    data,
    loading: readonly(loading),
    saving: readonly(saving),
    dirty: readonly(dirty),
    error: readonly(error),
    locale,
    setComponent,
    updateField,
    save,
  };
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
