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
  /**
   * Anúncios de leitor de tela. As chaves de `accessibility.screenReader` variam
   * por componente (`closed/open/disabled`, `onOpen/onClose`, …), então o
   * container recebe só os valores — quem chama passa `Object.values(...)`.
   */
  screenReaderTitle?: string;
  screenReaderItems?: string[];
  /** Nota de contraste, quando o componente documenta uma. */
  contrast?: string;
}

export function DocsAccessibility({
  title,
  summary,
  items,
  keyboardTitle,
  keyboardItems,
  screenReaderTitle,
  screenReaderItems,
  contrast,
}: DocsAccessibilityProps) {
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
          {contrast && (
            <p
              className="nds-text-body nds-leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contrast) }}
            />
          )}
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

        {screenReaderItems && screenReaderItems.length > 0 && (
          <div>
            {screenReaderTitle && (
              <h3 className="nds-text-base nds-font-semibold nds-mb-4">{screenReaderTitle}</h3>
            )}
            <ul className="nds-stack nds-text-body nds-list-disc" data-spacing="sm">
              {screenReaderItems.map((item, i) => (
                <li
                  key={i}
                  className="nds-leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }}
                />
              ))}
            </ul>
          </div>
        )}
      </Card>
    </section>
  );
}
