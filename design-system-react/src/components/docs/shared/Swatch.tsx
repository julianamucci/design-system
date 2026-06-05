import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';

export interface SwatchProps {
  /** Nome do token CSS sem o prefixo `--`. */
  token: string;
  /**
   * `vertical` — chip com o nome do token abaixo (mini-swatch de demonstração).
   * `horizontal` — chip + `--token` + valor HSL, clicável para copiar.
   */
  orientation?: 'vertical' | 'horizontal';
  /** Valor HSL resolvido (apenas `horizontal`). */
  value?: string;
  /** Rótulo do tooltip de cópia (apenas `horizontal`). */
  copyLabel?: string;
  /** Rótulo do tooltip após copiar (apenas `horizontal`). */
  copiedLabel?: string;
}

/**
 * Swatch de cor reutilizável da página "Cores e Temas". Duas variantes:
 * vertical (nome abaixo da cor) e horizontal (variável + código HSL, copiável).
 */
export function Swatch({
  token,
  orientation = 'vertical',
  value,
  copyLabel = '',
  copiedLabel = '',
}: SwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(`--${token}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }, [token]);

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          className="h-8 w-8 rounded-md border border-border/50"
          style={{ backgroundColor: `hsl(var(--${token}))` }}
          aria-hidden="true"
        />
        <span className="text-[10px] text-muted-foreground font-mono">{token}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${copyLabel} --${token}`}
      className="group relative w-full flex items-center gap-3 p-2 rounded-lg border border-border/50 hover:border-border hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors text-left"
    >
      <span
        className="h-10 w-10 shrink-0 rounded-md border border-border/50"
        style={{ backgroundColor: `hsl(var(--${token}))` }}
        aria-hidden="true"
      />
      <span className="flex flex-col min-w-0">
        <span className="text-xs font-mono text-foreground truncate">--{token}</span>
        <span className="text-[10px] font-mono text-muted-foreground truncate">{value || '—'}</span>
      </span>
      <span
        className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
        aria-hidden="true"
      >
        {copied && <Check className="h-3 w-3" aria-hidden="true" />}
        {copied ? copiedLabel : copyLabel}
      </span>
    </button>
  );
}
