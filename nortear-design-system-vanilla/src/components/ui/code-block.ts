import { Copy, Check } from 'lucide';
import { createButton } from './button';
import { copyText } from '@shared/primitives/clipboard';
import {
  highlightCode,
  parseLineRanges,
  resolveLanguage,
  type LineRangeInput,
} from '@shared/primitives/code-highlight';

// ─── CodeBlock ────────────────────────────────────────────────────────────────
//
// Bloco de código com header (título + copiar), scroll duplo, numeração e
// destaque de linha. Estrutura e cores em docs/shared/styles/nds/code-block.css.
//
// A tokenização vem de @shared/primitives/code-highlight (TS puro) e devolve
// DADOS, não HTML: cada span vira um nó via createElement/textContent, então não
// há innerHTML e nenhuma superfície de XSS a sanitizar.

export interface CodeBlockOptions {
  /** Código a exibir. É exatamente o que o botão copiar coloca no clipboard. */
  code: string;
  /** Linguagem ou extensão (`ts`, `vue`, `.css`, `bash`). Desconhecida → sem cor. */
  language?: string;
  /** Rótulo do header, normalmente o nome do arquivo. */
  title?: string;
  /** Numeração de linha. */
  showLineNumbers?: boolean;
  /** Linhas destacadas: `[3, '5-7']` ou `'3, 5-7'`. */
  highlightLines?: LineRangeInput;
  /** Observações abaixo do código. */
  footer?: string | HTMLElement;
  copyLabel?: string;
  copiedLabel?: string;
  class?: string;
}

type LucideIconNode = [string, Record<string, string>];

/** Espelha o padrão de createAlertIcon: monta o SVG a partir dos nós do lucide. */
function createIcon(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

/** Reseta o feedback de "copiado" depois deste intervalo. */
const COPIED_RESET_MS = 2000;

export function createCodeBlock(options: CodeBlockOptions): HTMLElement {
  const {
    code,
    language,
    title,
    showLineNumbers = true,
    highlightLines,
    footer,
    copyLabel = 'Copiar código',
    copiedLabel = 'Copiado!',
  } = options;

  const lines = highlightCode(code, resolveLanguage(language));
  const highlighted = parseLineRanges(highlightLines);

  const root = document.createElement('div');
  root.dataset.slot = 'code-block';
  root.className = 'nds-code-block-root';
  // Configuração registrada no DOM, não só no closure: é o que permite a CSS,
  // teste e devtools distinguirem as opções — e o que mantém o snippet da aba
  // API Reference acompanhando os controls (ver dev-vanilla.md).
  root.dataset.numbered = String(showLineNumbers);
  root.dataset.language = resolveLanguage(language);
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  // ── Header ──────────────────────────────────────────────────────────────────
  // Sempre presente: o botão copiar precisa estar visível mesmo sem título.
  const header = document.createElement('div');
  header.className = 'nds-code-block-header';

  if (title) {
    const titleEl = document.createElement('span');
    titleEl.className = 'nds-code-block-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);
  }

  const actions = document.createElement('span');
  actions.className = 'nds-code-block-actions';

  const feedback = document.createElement('span');
  feedback.className = 'nds-code-block-copy-label';
  feedback.setAttribute('aria-hidden', 'true');
  feedback.hidden = true;
  feedback.textContent = copiedLabel;

  // aria-live fora do botão: o leitor de tela anuncia a confirmação sem que o
  // rótulo do botão mude no meio da interação.
  const live = document.createElement('span');
  live.className = 'nds-sr-only';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');

  const copyIcon = createIcon(Copy as unknown as LucideIconNode[]);
  const checkIcon = createIcon(Check as unknown as LucideIconNode[]);
  checkIcon.setAttribute('hidden', '');

  const copyButton = createButton({
    variant: 'ghost',
    size: 'icon-sm',
    ariaLabel: copyLabel,
  });
  copyButton.dataset.slot = 'code-block-copy';
  copyButton.append(copyIcon, checkIcon);

  let timer: ReturnType<typeof setTimeout> | undefined;

  function setCopied(value: boolean): void {
    feedback.hidden = !value;
    copyIcon.toggleAttribute('hidden', value);
    checkIcon.toggleAttribute('hidden', !value);
    copyButton.setAttribute('aria-label', value ? copiedLabel : copyLabel);
    live.textContent = value ? copiedLabel : '';
  }

  copyButton.addEventListener('click', () => {
    // copyText já cobre o fallback fora de contexto seguro; false = não copiou,
    // e nesse caso não confirmamos nada.
    void copyText(code).then((ok) => {
      if (!ok) return;
      setCopied(true);
      clearTimeout(timer);
      timer = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    });
  });

  actions.append(feedback, copyButton);
  header.appendChild(actions);

  // ── Conteúdo ────────────────────────────────────────────────────────────────
  const scroll = document.createElement('div');
  scroll.className = 'nds-code-block-scroll';
  scroll.tabIndex = 0;

  const pre = document.createElement('pre');
  pre.className = 'nds-code-block-pre';
  const codeEl = document.createElement('code');
  codeEl.className = 'nds-code-block-code';

  lines.forEach((spans, i) => {
    const line = document.createElement('span');
    line.className = 'nds-code-block-line';
    if (highlighted.has(i + 1)) line.dataset.highlighted = 'true';

    const gutter = document.createElement('span');
    gutter.className = 'nds-code-block-gutter';
    gutter.setAttribute('aria-hidden', 'true');
    gutter.textContent = String(i + 1);

    const text = document.createElement('span');
    text.className = 'nds-code-block-text';
    if (spans.length === 0) {
      // Linha vazia precisa de altura: sem isto ela colapsa.
      text.textContent = '\n';
    } else {
      for (const span of spans) {
        if (span.token === 'plain') {
          text.appendChild(document.createTextNode(span.text));
        } else {
          const el = document.createElement('span');
          el.dataset.token = span.token;
          el.textContent = span.text;
          text.appendChild(el);
        }
      }
    }

    line.append(gutter, text);
    codeEl.appendChild(line);
  });

  pre.appendChild(codeEl);
  scroll.appendChild(pre);

  root.append(header, live, scroll);

  // ── Footer ──────────────────────────────────────────────────────────────────
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'nds-code-block-footer';
    if (typeof footer === 'string') footerEl.textContent = footer;
    else footerEl.appendChild(footer);
    root.appendChild(footerEl);
  }

  return root;
}
