import { ComponentDemo } from '@/components/ComponentDemo';
import { Card } from '@/components/ui/card';
import DOMPurify from 'dompurify';

export interface DocsAnatomyProps {
  title: string;
  items: string[];
  structureCode: string;
  structureLabel?: string;
}

export function DocsAnatomy({ title, items, structureCode, structureLabel }: DocsAnatomyProps) {
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
          <Card className="nds-bg-muted-soft nds-border-soft nds-shadow-none nds-p-4 nds-overflow-x">
            {structureLabel && (
              <p className="nds-text-caption nds-text-muted-foreground nds-mb-2">{structureLabel}</p>
            )}
            <pre className="nds-font-mono nds-text-body nds-whitespace-pre">{structureCode}</pre>
          </Card>
        </div>
      </ComponentDemo>
    </section>
  );
}
