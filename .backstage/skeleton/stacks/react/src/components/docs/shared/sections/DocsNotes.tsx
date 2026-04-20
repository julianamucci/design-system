import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
          <Alert key={i} variant="default">
            {item.title && <AlertTitle>{item.title}</AlertTitle>}
            <AlertDescription
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
            />
          </Alert>
        ))}
      </div>
    </section>
  );
}
