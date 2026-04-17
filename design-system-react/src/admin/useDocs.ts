/**
 * useDocs — hook para carregar e salvar translations.json via API do Vite plugin.
 * O arquivo é gravado diretamente em docs/shared/content/:component/translations.json.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Locale } from '@/lib/i18n';

export type DocsContent = Record<Locale, Record<string, unknown>>;

interface UseDocsReturn {
  data: DocsContent | null;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string | null;
  locale: Locale;
  setLocale: (l: Locale) => void;
  updateField: (key: string, value: string) => void;
  removeField: (key: string) => void;
  setLocaleData: (locale: Locale, localeData: Record<string, unknown>) => void;
  save: () => Promise<void>;
}

export function useDocs(componentName: string): UseDocsReturn {
  const [data, setData]       = useState<DocsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [locale, setLocale]   = useState<Locale>('pt-BR');

  // ── Carrega o JSON ao montar ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/docs/${componentName}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json() as Promise<DocsContent>;
      })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [componentName]);

  // ── Atualiza um campo (dot notation, ex: "anatomy.item1") ──────────────────
  const updateField = useCallback((key: string, value: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const localeData = deepClone(prev[locale] ?? {}) as Record<string, unknown>;
      setNestedValue(localeData, key.split('.'), value);
      setDirty(true);
      return { ...prev, [locale]: localeData };
    });
  }, [locale]);

  // ── Remove um campo (dot notation) ────────────────────────────────────────
  const removeField = useCallback((key: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const localeData = deepClone(prev[locale] ?? {}) as Record<string, unknown>;
      deleteNestedValue(localeData, key.split('.'));
      setDirty(true);
      return { ...prev, [locale]: localeData };
    });
  }, [locale]);

  // ── Substitui todos os campos de um locale (ex: resultado de tradução) ─────
  const setLocaleData = useCallback((targetLocale: Locale, localeData: Record<string, unknown>) => {
    setData((prev) => {
      if (!prev) return prev;
      setDirty(true);
      return { ...prev, [targetLocale]: localeData };
    });
  }, []);

  // ── Salva o JSON via PUT ───────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/docs/${componentName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `${res.status}`);
      }
      setDirty(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [data, componentName]);

  return { data, loading, saving, dirty, error, locale, setLocale, updateField, removeField, setLocaleData, save };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
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

function deleteNestedValue(obj: Record<string, unknown>, keys: string[]): void {
  const last = keys.at(-1)!;
  let cur = obj;
  for (const k of keys.slice(0, -1)) {
    if (typeof cur[k] !== 'object' || cur[k] === null) return;
    cur = cur[k] as Record<string, unknown>;
  }
  delete cur[last];
}
