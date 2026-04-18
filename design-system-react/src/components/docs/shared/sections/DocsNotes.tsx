import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsNoteItem {
  title: string;
  content: string;
}

export interface DocsNotesProps {
  title: string;
  items: DocsNoteItem[];
}

export function DocsNotes({ title, items }: DocsNotesProps) {
  return (
    <section id="notas">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="bg-muted/30 rounded-lg border-l-4 border-primary/40 p-4">
            <p className="text-sm font-semibold mb-1">{item.title}</p>
            <div
              className="text-sm text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
