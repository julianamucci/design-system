import React from 'react';

export interface DocsTokenItem {
  token: string;
  value: string;
  description: string;
}

export interface DocsTokensProps {
  title: string;
  cols: { token: string; value: string; description: string };
  items: DocsTokenItem[];
  customizationTitle?: string;
  customizationCode?: string;
}

export function DocsTokens({ title, cols, items, customizationTitle, customizationCode }: DocsTokensProps) {
  return (
    <section id="tokens">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-6">
        <div className="rounded-lg border border-border p-4 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="p-3 border-r border-border font-semibold">{cols.token}</th>
                <th className="p-3 border-r border-border font-semibold">{cols.value}</th>
                <th className="p-3 font-semibold">{cols.description}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                  <td className="p-3 border-r border-border font-mono text-primary">{item.token}</td>
                  <td className="p-3 border-r border-border font-mono text-muted-foreground">{item.value}</td>
                  <td className="p-3 text-muted-foreground">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customizationTitle && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold">{customizationTitle}</h3>
            {customizationCode && (
              <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
                <code className="whitespace-pre">{customizationCode}</code>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
