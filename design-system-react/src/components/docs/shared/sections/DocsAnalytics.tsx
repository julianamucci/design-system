import React from 'react';

export interface DocsAnalyticsEventItem {
  event: string;
  trigger: string;
  payload: string;
}

export interface DocsAnalyticsProps {
  title: string;
  cols: { event: string; trigger: string; payload: string };
  items: DocsAnalyticsEventItem[];
}

export function DocsAnalytics({ title, cols, items }: DocsAnalyticsProps) {
  return (
    <section id="analytics">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left">
              <th className="p-3 border-r border-border font-semibold">{cols.event}</th>
              <th className="p-3 border-r border-border font-semibold">{cols.trigger}</th>
              <th className="p-3 font-semibold">{cols.payload}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                <td className="p-3 border-r border-border font-mono text-primary">{item.event}</td>
                <td className="p-3 border-r border-border text-muted-foreground">{item.trigger}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">{item.payload}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
