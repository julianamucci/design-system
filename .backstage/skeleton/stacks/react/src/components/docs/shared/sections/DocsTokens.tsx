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
        <Card className="shadow-sm overflow-x-auto p-4">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 text-left">
                  <TableHead className="p-3 border-r border-border font-semibold">{cols.token}</TableHead>
                  <TableHead className="p-3 border-r border-border font-semibold">{cols.value}</TableHead>
                  <TableHead className="p-3 font-semibold">{cols.description}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                    <TableCell className="p-3 border-r border-border font-mono text-primary">{item.token}</TableCell>
                    <TableCell className="p-3 border-r border-border font-mono text-muted-foreground">{item.value}</TableCell>
                    <TableCell className="p-3 text-muted-foreground">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </Card>
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
