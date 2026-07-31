import { ComponentDemo } from '@/components/ComponentDemo';
import { CodeBlock } from '@/components/ui/code-block';
import DOMPurify from 'dompurify';

export interface DocsAnatomyProps {
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
  /** Linguagem do snippet de estrutura, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export function DocsAnatomy({
  title,
  items,
  structureCode,
  structureLabel,
  language = 'tsx',
  copyLabel,
  copiedLabel,
}: DocsAnatomyProps) {
  return (
    <section id="anatomia">
      <h2 className="nds-section-title">{title}</h2>
      <ComponentDemo>
        <div className="nds-stack nds-w-full" data-spacing="md">
          <ol className="nds-stack nds-text-body nds-list-none" data-spacing="sm">
            {items.map((item, i) => (
              <li key={i} className="nds-row nds-list-none" data-spacing="sm" data-align="start">
                <span className="nds-pill" data-tone="primary">
                  {i + 1}
                </span>
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
              </li>
            ))}
          </ol>
          <div>
            {structureLabel && (
              <p className="nds-text-caption nds-text-muted-foreground nds-mb-2">{structureLabel}</p>
            )}
            <CodeBlock
              code={structureCode}
              language={language}
              showLineNumbers={false}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
            />
          </div>
        </div>
      </ComponentDemo>
    </section>
  );
}
