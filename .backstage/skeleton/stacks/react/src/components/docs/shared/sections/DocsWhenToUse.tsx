import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
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
      <Card className="p-4 space-y-6">

        {/* Guidelines */}
        <Card className="bg-muted/50 border border-border/40 shadow-none p-4 rounded-lg">
          <h3 className="font-medium text-sm mb-3">{guidelines.title}</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            {guidelines.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
            ))}
          </ul>
        </Card>

        {/* Cenários */}
        <div className="overflow-x-auto">
          <Table className="w-full border-collapse text-sm">
            <TableHeader>
              <TableRow className="border-b border-border text-left bg-muted/50 font-medium">
                <TableHead className="p-3 border-r border-border">{scenarios.cols.scenario}</TableHead>
                <TableHead className="p-3 border-r border-border">{scenarios.cols.use}</TableHead>
                <TableHead className="p-3">{scenarios.cols.alternative}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.items.map((item, i) => (
                <TableRow key={i} className="border-b border-border hover:bg-muted/5">
                  <TableCell className="p-3 border-r border-border">{item.s}</TableCell>
                  <TableCell className="p-3 border-r border-border font-medium text-primary">{item.u}</TableCell>
                  <TableCell className="p-3 text-muted-foreground">{item.a}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* UX Writing */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">{uxWriting.title}</h3>
          <div className="overflow-x-auto">
            <Table className="w-full border-collapse text-sm">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/70 text-left">
                  <TableHead className="p-3 border-r border-border font-semibold">{uxWriting.cols.element}</TableHead>
                  {uxWriting.cols.rules && (
                    <TableHead className="p-3 border-r border-border font-semibold">{uxWriting.cols.rules}</TableHead>
                  )}
                  <TableHead className="p-3 border-r border-border font-semibold text-green-700 dark:text-green-400">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
                      {uxWriting.cols.do}
                    </span>
                  </TableHead>
                  <TableHead className="p-3 font-semibold text-red-700 dark:text-red-400">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
                      {uxWriting.cols.dont}
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uxWriting.items.map((row, i) => (
                  <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                    <TableCell className="p-3 border-r border-border font-medium">{row.element}</TableCell>
                    {uxWriting.cols.rules && (
                      <TableCell className="p-3 border-r border-border text-muted-foreground">{row.rules}</TableCell>
                    )}
                    <TableCell className="p-3 border-r border-border font-medium text-green-600 dark:text-green-500">{row.do}</TableCell>
                    <TableCell className="p-3 font-medium text-red-600 dark:text-red-500">{row.dont}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Do / Don't cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-green-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">✓</span>
              {doBlock.title}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
              {doBlock.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
              ))}
            </ul>
          </Card>
          <Card className="bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-red-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex-shrink-0">✗</span>
              {dontBlock.title}
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
              {dontBlock.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item) }} />
              ))}
            </ul>
          </Card>
        </div>

      </Card>
    </section>
  );
}
