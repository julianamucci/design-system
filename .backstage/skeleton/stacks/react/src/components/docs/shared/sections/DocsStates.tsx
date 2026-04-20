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

export interface DocsStateItem {
  label: string;
  trigger: string;
  behavior: string;
}

export interface DocsStatesProps {
  title: string;
  cols: { state: string; trigger: string; behavior: string };
  items: DocsStateItem[];
}

export function DocsStates({ title, cols, items }: DocsStatesProps) {
  return (
    <section id="estados">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <Card className="shadow-sm overflow-x-auto p-4">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 text-left">
                <TableHead className="p-3 border-r border-border font-semibold">{cols.state}</TableHead>
                <TableHead className="p-3 border-r border-border font-semibold">{cols.trigger}</TableHead>
                <TableHead className="p-3 font-semibold">{cols.behavior}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell className="p-3 border-r border-border font-medium">{item.label}</TableCell>
                  <TableCell className="p-3 border-r border-border text-muted-foreground">{item.trigger}</TableCell>
                  <TableCell className="p-3 text-muted-foreground">{item.behavior}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </section>
  );
}
