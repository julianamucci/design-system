/**
 * DocsEditor — editor visual de documentação com Quill.js.
 *
 * Carrega translations.json de docs/shared/content/:component/ via API Vite,
 * permite editar campos com Quill (rich-text) ou input simples (texto puro),
 * e salva de volta para o arquivo centralizado.
 *
 * Acessível em: http://localhost:5173/?view=admin  (modo dev)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useDocs } from './useDocs';
import type { Locale } from '@/lib/i18n';

const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];
const LOCALE_LABELS: Record<Locale, string> = { 'pt-BR': '🇧🇷 PT', en: '🇺🇸 EN', es: '🇪🇸 ES' };

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

interface FieldEditorProps {
  fieldKey: string;
  value: unknown;
  onChange: (key: string, value: string) => void;
  depth?: number;
}

function FieldEditor({ fieldKey, value, onChange, depth = 0 }: FieldEditorProps) {
  const isHtml   = typeof value === 'string' && /<[a-z]/i.test(value);
  const isNested = typeof value === 'object' && value !== null && !Array.isArray(value);
  const label    = fieldKey.split('.').at(-1) ?? fieldKey;

  if (isNested) {
    return (
      <div className={`space-y-3 ${depth > 0 ? 'pl-4 border-l border-border' : ''}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <FieldEditor
            key={`${fieldKey}.${k}`}
            fieldKey={`${fieldKey}.${k}`}
            value={v}
            onChange={onChange}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) return null; // arrays ignorados por ora

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

  const { data, loading, saving, dirty, error, locale, setLocale, updateField, save } =
    useDocs(component);

  // Carrega lista de componentes disponíveis
  useEffect(() => {
    fetch('/api/docs/__components')
      .then((r) => r.json() as Promise<string[]>)
      .then(setComponents)
      .catch(() => setComponents([component]));
  }, [component]);

  const localeData = data?.[locale] ?? {};

  const handleSave = useCallback(async () => {
    await save();
  }, [save]);

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
      <aside className="w-56 shrink-0 border-r border-border flex flex-col">
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

      {/* ── Editor area ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Toolbar */}
        <header className="flex h-14 items-center gap-3 border-b border-border px-6">
          <h1 className="text-sm font-semibold">{component}</h1>
          <span className="text-xs text-muted-foreground">
            {LOCALE_LABELS[locale]}
          </span>
          {error && (
            <span className="text-xs text-destructive">Erro: {error}</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {dirty && (
              <span className="text-xs text-warning">Alterações não salvas</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <span className="text-xs text-muted-foreground">Ctrl+S</span>
          </div>
        </header>

        {/* Fields */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!loading && (
            <div className="max-w-2xl space-y-6">
              {Object.entries(localeData).map(([key, value]) => (
                <FieldEditor
                  key={key}
                  fieldKey={key}
                  value={value}
                  onChange={updateField}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
