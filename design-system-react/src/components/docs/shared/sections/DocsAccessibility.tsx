import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { sanitizeHtml } from '@/lib/sanitize-html';

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
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <p
              className="text-sm text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(summary) }}
            />
            <ul className="space-y-2 text-sm list-none p-0 m-0">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 list-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }}
                />
              ))}
            </ul>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-base font-semibold mb-3">{keyboardTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {keyboardItems.map((item, i) => (
              <Card key={i} className="bg-muted/30 border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <kbd className="inline-flex items-center justify-center rounded border border-border bg-background px-2 py-1 text-xs font-mono font-semibold shrink-0 shadow-sm">
                      {item.key}
                    </kbd>
                    <span className="text-sm text-muted-foreground leading-relaxed">{item.description}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
