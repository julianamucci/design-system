/**
 * DocsEditor — editor visual de documentação com Quill.js.
 *
 * Carrega translations.json de docs/shared/content/:component/ via API Vite,
 * permite editar campos com Quill (rich-text) ou input simples (texto puro),
 * e salva de volta para o arquivo centralizado.
 *
 * Acessível em: http://localhost:5173/?view=admin  (modo dev)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useDocs } from './useDocs';
import type { Locale } from '@/lib/i18n';

const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const LOCALE_LABELS: Record<Locale, string> = { 'pt-BR': '🇧🇷 PT', en: '🇺🇸 EN', es: '🇪🇸 ES' };

// ─── Stack config ─────────────────────────────────────────────────────────────

type Stack = 'react' | 'vue' | 'svelte' | 'basecoat';

const STACKS: { id: Stack; label: string; port: number }[] = [
  { id: 'react',    label: 'React',    port: 6006 },
  { id: 'vue',      label: 'Vue',      port: 6007 },
  { id: 'svelte',   label: 'Svelte',   port: 6008 },
  { id: 'basecoat', label: 'Basecoat', port: 6009 },
];

// Componentes que vivem fora da categoria UI no Storybook (ex: Foundations)
const STORY_ID_OVERRIDES: Record<string, string> = {
  'icons':           'foundations-icons',
  'cores-e-temas':   'foundations-cores-e-temas',
};

function storyId(slug: string): string {
  return (STORY_ID_OVERRIDES[slug] ?? `ui-${slug}`) + '--docs';
}

// ─── Quill editor wrapper ─────────────────────────────────────────────────────

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef     = useRef<Quill | null>(null);
  const onChangeRef  = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          ['bold', 'italic', 'code'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'clean'],
        ],
      },
    });

    quill.root.innerHTML = value;
    quill.on('text-change', () => onChangeRef.current(quill.root.innerHTML));
    quillRef.current = quill;

    // Tailwind reset interfere no Quill — restaura cursor
    (containerRef.current.querySelector('.ql-editor') as HTMLElement | null)
      ?.style.setProperty('min-height', '80px');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualiza conteúdo quando o locale muda externamente
  useEffect(() => {
    const q = quillRef.current;
    if (q && q.root.innerHTML !== value) q.root.innerHTML = value;
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="rounded-md border border-border bg-background [&_.ql-toolbar]:border-border [&_.ql-container]:border-border [&_.ql-editor]:text-foreground [&_.ql-editor]:min-h-[80px]"
    />
  );
}

// ─── Field renderer ───────────────────────────────────────────────────────────

function itemKeys(obj: Record<string, unknown>): number[] {
  return Object.keys(obj)
    .filter((k) => /^item\d+$/.test(k))
    .map((k) => parseInt(k.replace('item', ''), 10))
    .sort((a, b) => a - b);
}

function hasNumberedItems(obj: Record<string, unknown>): boolean {
  return itemKeys(obj).length > 0;
}

function hasHtmlSibling(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some((v) => typeof v === 'string' && /<[a-z]/i.test(v));
}

interface FieldEditorProps {
  fieldKey: string;
  value: unknown;
  onChange: (key: string, value: string) => void;
  onRemove?: (key: string) => void;
  depth?: number;
}

function FieldEditor({ fieldKey, value, onChange, onRemove, depth = 0 }: FieldEditorProps) {
  const isHtml   = typeof value === 'string' && /<[a-z]/i.test(value);
  const isNested = typeof value === 'object' && value !== null && !Array.isArray(value);
  const label    = fieldKey.split('.').at(-1) ?? fieldKey;

  if (isNested) {
    const nested = value as Record<string, unknown>;
    const numbered = hasNumberedItems(nested);
    const useHtmlForNew = hasHtmlSibling(nested);

    const handleAddItem = () => {
      const nums = itemKeys(nested);
      const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      onChange(`${fieldKey}.item${next}`, useHtmlForNew ? '<p></p>' : '');
    };

    const handleRemoveLast = () => {
      const nums = itemKeys(nested);
      if (nums.length === 0) return;
      onRemove?.(`${fieldKey}.item${Math.max(...nums)}`);
    };

    return (
      <div className={`space-y-3 ${depth > 0 ? 'pl-4 border-l border-border' : ''}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {Object.entries(nested).map(([k, v]) => (
          <FieldEditor
            key={`${fieldKey}.${k}`}
            fieldKey={`${fieldKey}.${k}`}
            value={v}
            onChange={onChange}
            onRemove={onRemove}
            depth={depth + 1}
          />
        ))}
        {numbered && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAddItem}
              className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + Adicionar item
            </button>
            {itemKeys(nested).length > 1 && (
              <button
                onClick={handleRemoveLast}
                className="rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
              >
                − Remover último
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (Array.isArray(value)) return null;

  const strValue = String(value ?? '');

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {isHtml ? (
        <QuillEditor
          value={strValue}
          onChange={(v) => onChange(fieldKey, v)}
          placeholder={`Conteúdo de ${label}...`}
        />
      ) : (
        <input
          type="text"
          value={strValue}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={`Texto de ${label}...`}
        />
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface DocsEditorProps {
  initialComponent?: string;
}

export function DocsEditor({ initialComponent = 'button' }: DocsEditorProps) {
  const [component, setComponent] = useState(initialComponent);
  const [components, setComponents] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [activeStack, setActiveStack] = useState<Stack>('react');
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [editorWidth, setEditorWidth] = useState(420);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    dragStartWidth.current = editorWidth;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(280, Math.min(900, dragStartWidth.current + ev.clientX - dragStartX.current));
      setEditorWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    e.preventDefault();
  }, [editorWidth]);

  const { data, loading, saving, dirty, error, locale, setLocale, updateField, removeField, setLocaleData, save } =
    useDocs(component);

  // Constrói a URL do Storybook para o componente e stack ativos
  const activePort = STACKS.find((s) => s.id === activeStack)?.port ?? 6006;
  const storybookUrl = `http://localhost:${activePort}/?path=/docs/${storyId(component)}`;

  // Carrega lista de componentes disponíveis
  useEffect(() => {
    fetch('/api/docs/__components')
      .then((r) => r.json() as Promise<string[]>)
      .then(setComponents)
      .catch(() => setComponents([component]));
  }, [component]);

  // Recarrega o preview quando o componente muda
  useEffect(() => {
    setPreviewKey((k) => k + 1);
  }, [component]);

  const localeData = data?.[locale] ?? {};

  const handleSave = useCallback(async () => {
    await save();
    // Recarrega o iframe após salvar para refletir o novo JSON
    setPreviewKey((k) => k + 1);
  }, [save]);

  const handleRefreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const handleAutoTranslate = useCallback(async () => {
    if (!data) return;
    setTranslating(true);
    setTranslateError(null);
    try {
      const toLocales = LOCALES.filter((l) => l !== locale);
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data[locale], fromLocale: locale, toLocales }),
      });
      const result = await res.json() as Record<string, Record<string, unknown>> | { error: string };
      if ('error' in result) throw new Error(result.error as string);
      for (const [lang, translated] of Object.entries(result)) {
        setLocaleData(lang as Locale, translated);
      }
    } catch (e) {
      setTranslateError((e as Error).message);
    } finally {
      setTranslating(false);
    }
  }, [data, locale, setLocaleData]);

  // Atalho Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-48 shrink-0 border-r border-border flex flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="font-semibold text-sm">Docs Editor</span>
          {dirty && <span className="ml-auto h-2 w-2 rounded-full bg-warning" title="Não salvo" />}
        </div>

        {/* Lista de componentes */}
        <nav className="flex-1 overflow-y-auto py-2">
          {components.length === 0 && (
            <p className="px-4 text-xs text-muted-foreground">Carregando...</p>
          )}
          {components.map((comp) => (
            <button
              key={comp}
              onClick={() => setComponent(comp)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                component === comp
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {comp}
            </button>
          ))}
        </nav>

        {/* Seletor de locale */}
        <div className="border-t border-border p-3 flex gap-1">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`flex-1 rounded py-1 text-xs transition-colors ${
                locale === l
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Área principal: editor + preview ─────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Editor ───────────────────────────────────────────────────────── */}
        <div
          className="flex flex-col overflow-hidden shrink-0"
          style={{ width: showPreview ? editorWidth : undefined, flex: showPreview ? 'none' : '1' }}
        >

          {/* Toolbar */}
          <header className="flex h-14 items-center gap-2 border-b border-border px-4">
            <h1 className="text-sm font-semibold">{component}</h1>
            <span className="text-xs text-muted-foreground">{LOCALE_LABELS[locale]}</span>
            {error && <span className="text-xs text-destructive truncate max-w-[120px]">Erro: {error}</span>}
            <div className="ml-auto flex items-center gap-2">
              {dirty && <span className="text-xs text-warning">Não salvo</span>}
              {translateError && (
                <span className="text-xs text-destructive truncate max-w-[140px]" title={translateError}>
                  ⚠ {translateError}
                </span>
              )}
              <button
                onClick={handleAutoTranslate}
                disabled={translating || loading}
                title={`Traduzir ${LOCALE_LABELS[locale]} → outros idiomas via Claude`}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {translating ? (
                  <><span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent inline-block" /> Traduzindo...</>
                ) : '🌐 Auto-traduzir'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <span className="text-xs text-muted-foreground">Ctrl+S</span>
              {/* Toggle preview */}
              <button
                onClick={() => setShowPreview((v) => !v)}
                title={showPreview ? 'Ocultar preview' : 'Mostrar preview'}
                className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                {showPreview ? '⬅ Ocultar' : 'Preview →'}
              </button>
            </div>
          </header>

          {/* Fields */}
          <main className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="flex h-32 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            {!loading && (
              <div className="space-y-0">
                {Object.entries(localeData).map(([key, value], index) => (
                  <React.Fragment key={key}>
                    {index > 0 && <hr className="border-border my-2" />}
                    <FieldEditor
                      fieldKey={key}
                      value={value}
                      onChange={updateField}
                      onRemove={removeField}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* ── Resize handle ────────────────────────────────────────────────── */}
        {showPreview && (
          <div
            onMouseDown={handleDragStart}
            className="w-1.5 shrink-0 cursor-col-resize bg-border hover:bg-primary/50 transition-colors active:bg-primary"
            title="Arraste para redimensionar"
          />
        )}

        {/* ── Preview (Storybook iframe) ────────────────────────────────────── */}
        {showPreview && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex h-14 items-center gap-2 border-b border-border px-4 shrink-0">
              <span className="text-sm font-medium shrink-0">Preview</span>

              {/* Seletor de stack */}
              <div className="flex gap-1">
                {STACKS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveStack(s.id); setPreviewKey((k) => k + 1); }}
                    title={`Storybook ${s.label} · porta ${s.port}`}
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      activeStack === s.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-muted-foreground">:{activePort}</span>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleRefreshPreview}
                  title="Recarregar preview"
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  ↺
                </button>
                <a
                  href={storybookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  ↗
                </a>
              </div>
            </div>
            <iframe
              key={previewKey}
              ref={iframeRef}
              src={storybookUrl}
              className="flex-1 border-0 bg-background"
              title={`Preview ${component}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
