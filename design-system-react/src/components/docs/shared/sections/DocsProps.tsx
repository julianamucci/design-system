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

export interface DocsPropItem {
  name: string;
  type: string;
  defaultValue: string;
  required: string;
  description: string;
}

export interface DocsPropsTableDef {
  title?: string;
  cols: { prop: string; type: string; default: string; required: string; description: string };
  items: DocsPropItem[];
}

export interface DocsPropsProps {
  title: string;
  tables: DocsPropsTableDef[];
  interfaceCode?: string;
  extensibilityTitle?: string;
  extensibilityNotes?: string;
}

function PropsTable({ def }: { def: DocsPropsTableDef }) {
  return (
    <div className="space-y-3">
      {def.title && <h3 className="text-base font-semibold">{def.title}</h3>}
      <Card className="shadow-sm overflow-x-auto p-4">
          <Table className="w-full text-sm">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 text-left">
                <TableHead className="p-3 border-r border-border font-semibold">{def.cols.prop}</TableHead>
                <TableHead className="p-3 border-r border-border font-semibold">{def.cols.type}</TableHead>
                <TableHead className="p-3 border-r border-border font-semibold">{def.cols.default}</TableHead>
                <TableHead className="p-3 border-r border-border font-semibold">{def.cols.required}</TableHead>
                <TableHead className="p-3 font-semibold">{def.cols.description}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {def.items.map((item, i) => (
                <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell className="p-3 border-r border-border font-mono font-bold text-primary">{item.name}</TableCell>
                  <TableCell className="p-3 border-r border-border font-mono text-muted-foreground">{item.type}</TableCell>
                  <TableCell className="p-3 border-r border-border text-muted-foreground">{item.defaultValue}</TableCell>
                  <TableCell className="p-3 border-r border-border text-muted-foreground">{item.required}</TableCell>
                  <TableCell className="p-3 text-muted-foreground">{item.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </div>
  );
}

export function DocsProps({ title, tables, interfaceCode, extensibilityTitle, extensibilityNotes }: DocsPropsProps) {
  return (
    <section id="propriedades">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-8">
        {tables.map((def, i) => (
          <PropsTable key={i} def={def} />
        ))}
        {interfaceCode && (
          <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
            <code className="whitespace-pre">{interfaceCode}</code>
          </div>
        )}
        {extensibilityTitle && (
          <div className="space-y-2">
            <h3 className="text-base font-semibold">{extensibilityTitle}</h3>
            {extensibilityNotes && (
              <div
                className="text-sm text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(extensibilityNotes) }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
