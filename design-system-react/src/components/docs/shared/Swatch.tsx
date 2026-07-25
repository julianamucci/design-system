import { useState, useCallback, type CSSProperties } from 'react';

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
 * Visual 100% via classes .nds-swatch* / .nds-miniswatch* (docs-swatches.css);
 * o único estilo dinâmico é a custom property --swatch-color por token.
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

  const swatchColor = { '--swatch-color': `var(--${token})` } as CSSProperties;

  if (orientation === 'vertical') {
    return (
      <div className="nds-miniswatch">
        <span className="nds-miniswatch-chip" style={swatchColor} aria-hidden="true" />
        <span className="nds-miniswatch-name">{token}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${copyLabel} --${token}`}
      className="nds-swatch"
    >
      <span className="nds-swatch-color" style={swatchColor} aria-hidden="true" />
      <div className="nds-swatch-meta">
        <span className="nds-swatch-token">--{token}</span>
        <span className="nds-swatch-value">{value || '—'}</span>
      </div>
      <span
        className="nds-icon-tile-tooltip"
        style={copied ? { opacity: 1 } : undefined}
        aria-hidden="true"
      >
        {copied ? copiedLabel : copyLabel}
      </span>
    </button>
  );
}
