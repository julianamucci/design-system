import { Card } from '@/components/ui/card';
import DOMPurify from 'dompurify';

export interface DocsKeyboardItem {
  key: string;
  description: string;
}

export interface DocsAccessibilityProps {
  title: string;
  summary: string;
  items: string[];
  keyboardTitle: string;
  keyboardItems: DocsKeyboardItem[];
}

export function DocsAccessibility({ title, summary, items, keyboardTitle, keyboardItems }: DocsAccessibilityProps) {
  return (
    <section id="acessibilidade">
      <h2 className="nds-section-title">{title}</h2>
      <Card className="nds-p-4 nds-stack" data-spacing="lg">
        <div className="nds-stack" data-spacing="md">
          <p
            className="nds-text-body nds-leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(summary) }}
          />
          <ul className="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
            {items.map((item, i) => (
              <li
                key={i}
                className="nds-leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }}
              />
            ))}
          </ul>
        </div>

        <div>
          <h3 className="nds-text-base nds-font-semibold nds-mb-4">{keyboardTitle}</h3>
          <div className="nds-grid" data-cols="2" data-spacing="sm">
            {keyboardItems.map((item, i) => (
              <Card key={i} className="nds-border-none nds-shadow-none nds-bg-muted-soft nds-p-4">
                <div className="nds-row" data-spacing="sm" data-align="start">
                  <kbd className="nds-kbd">
                    {item.key}
                  </kbd>
                  <span className="nds-text-body nds-text-muted-foreground nds-leading-relaxed">{item.description}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
