import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';

export interface DocsWhenToUseScenario {
  s: string;
  u: string;
  a: string;
}

export interface DocsWhenToUseUXRow {
  element: string;
  do: string;
  dont: string;
  rules?: string;
}

export interface DocsWhenToUseProps {
  title: string;
  guidelines: {
    title: string;
    items: string[];
  };
  scenarios: {
    title?: string;
    cols: { scenario: string; use: string; alternative: string };
    items: DocsWhenToUseScenario[];
  };
  uxWriting: {
    title: string;
    cols: { element: string; do: string; dont: string; rules?: string };
    items: DocsWhenToUseUXRow[];
  };
  do: { title: string; items: string[] };
  dont: { title: string; items: string[] };
}

export function DocsWhenToUse({ title, guidelines, scenarios, uxWriting, do: doBlock, dont: dontBlock }: DocsWhenToUseProps) {
  return (
    <section id="quando-usar">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="border rounded-xl p-6 shadow-sm space-y-6">

        {/* Guidelines */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <h3 className="font-medium text-sm">{guidelines.title}</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            {guidelines.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
            ))}
          </ul>
        </div>

        {/* Cenários */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-muted/50 font-medium">
                <th className="p-3 border-r border-border">{scenarios.cols.scenario}</th>
                <th className="p-3 border-r border-border">{scenarios.cols.use}</th>
                <th className="p-3">{scenarios.cols.alternative}</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.items.map((item, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/5">
                  <td className="p-3 border-r border-border">{item.s}</td>
                  <td className="p-3 border-r border-border font-medium text-primary">{item.u}</td>
                  <td className="p-3 text-muted-foreground">{item.a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UX Writing */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">{uxWriting.title}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/70 text-left">
                  <th className="p-3 border-r border-border font-semibold">{uxWriting.cols.element}</th>
                  {uxWriting.cols.rules && (
                    <th className="p-3 border-r border-border font-semibold">{uxWriting.cols.rules}</th>
                  )}
                  <th className="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                      {uxWriting.cols.do}
                    </span>
                  </th>
                  <th className="p-3 font-semibold text-red-700 dark:text-red-400">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                      {uxWriting.cols.dont}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {uxWriting.items.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                    <td className="p-3 border-r border-border font-medium">{row.element}</td>
                    {uxWriting.cols.rules && (
                      <td className="p-3 border-r border-border text-muted-foreground">{row.rules}</td>
                    )}
                    <td className="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">{row.do}</td>
                    <td className="p-3 font-medium text-red-600 dark:text-red-500">{row.dont}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Do / Don't cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
              {doBlock.title}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
              {doBlock.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
              ))}
            </ul>
          </div>
          <div className="bg-card border rounded-xl p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
              {dontBlock.title}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
              {dontBlock.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
