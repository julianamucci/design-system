import { createCodeBlock } from '@/components/ui/code-block';

export interface DocsImportProps {
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
  tertiaryCode?: string;
  tertiaryDescription?: string;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert"). Quando presente, a raiz
   * dos blocos primário e secundário recebe `data-track="code"` +
   * `data-track-id="{slug}:code:import-primary"` (ou `import-secondary`) +
   * `data-track-label="Copiar import"`. O observer garante que só o clique no
   * botão de copiar do CodeBlock conta como `docs_code_copy`.
   */
  componentSlug?: string;
  /** Linguagem dos snippets, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export function createDocsImport(props: DocsImportProps): HTMLElement {
  const { language = 'ts', copyLabel, copiedLabel } = props;

  const section = document.createElement('section');
  section.id = 'importacao';

  const h2 = document.createElement('h2');
  h2.className = 'nds-section-title';
  h2.textContent = props.title;
  section.appendChild(h2);

  if (props.description) {
    const p = document.createElement('p');
    p.className = 'nds-text-body nds-mb-4';
    p.textContent = props.description;
    section.appendChild(p);
  }

  function track(el: HTMLElement, id: string): void {
    if (!props.componentSlug) return;
    el.dataset.track = 'code';
    el.dataset.trackId = `${props.componentSlug}:code:${id}`;
    el.dataset.trackLabel = 'Copiar import';
  }

  const codeBlock = createCodeBlock({
    code: props.code,
    language,
    showLineNumbers: false,
    copyLabel,
    copiedLabel,
  });
  track(codeBlock, 'import-primary');
  section.appendChild(codeBlock);

  if (props.secondaryCode) {
    if (props.secondaryDescription) {
      const p2 = document.createElement('p');
      p2.className = 'nds-text-body nds-mt-4 nds-mb-4';
      p2.textContent = props.secondaryDescription;
      section.appendChild(p2);
    }
    const codeBlock2 = createCodeBlock({
      code: props.secondaryCode,
      language,
      showLineNumbers: false,
      copyLabel,
      copiedLabel,
      class: 'nds-mt-2',
    });
    track(codeBlock2, 'import-secondary');
    section.appendChild(codeBlock2);
  }

  if (props.tertiaryCode) {
    if (props.tertiaryDescription) {
      const p3 = document.createElement('p');
      p3.className = 'nds-text-body nds-mt-4 nds-mb-4';
      p3.textContent = props.tertiaryDescription;
      section.appendChild(p3);
    }
    const codeBlock3 = createCodeBlock({
      code: props.tertiaryCode,
      language,
      showLineNumbers: false,
      copyLabel,
      copiedLabel,
      class: 'nds-mt-2',
    });
    section.appendChild(codeBlock3);
  }

  return section;
}
