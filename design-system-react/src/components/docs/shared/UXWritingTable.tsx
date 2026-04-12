import React from 'react';

interface UXWritingRow {
  element: string;
  rules: string;
  correct: string;
  avoid: string;
}

export function UXWritingTable({ rows }: { rows: UXWritingRow[] }) {
  return (
    <div className="w-full overflow-hidden border border-border rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left p-4 font-semibold">Elemento</th>
              <th className="text-left p-4 font-semibold border-l border-border">Regras de formato</th>
              <th className="text-left p-4 font-semibold border-l border-border text-emerald-600 dark:text-emerald-400">✅ Correto</th>
              <th className="text-left p-4 font-semibold border-l border-border text-rose-600 dark:text-rose-400">❌ Evitar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-muted/30 transition-colors">
                <td className="p-4 font-medium whitespace-nowrap">{row.element}</td>
                <td className="p-4 border-l border-border text-muted-foreground">{row.rules}</td>
                <td className="p-4 border-l border-border text-emerald-600 dark:text-emerald-400 font-medium">{row.correct}</td>
                <td className="p-4 border-l border-border text-rose-600 dark:text-rose-400">{row.avoid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
