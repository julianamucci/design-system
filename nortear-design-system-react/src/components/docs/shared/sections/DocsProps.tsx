import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import DOMPurify from 'dompurify';

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
    <div className="nds-stack" data-spacing="sm">
      {def.title && <h3 className="nds-text-base nds-font-semibold">{def.title}</h3>}
      <Card className="nds-p-4 nds-overflow-x">
          <Table className="nds-w-full nds-text-body">
            <TableHeader>
              <TableRow className="nds-border-b nds-bg-muted-soft">
                <TableHead className="nds-p-2 nds-font-semibold">{def.cols.prop}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{def.cols.type}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{def.cols.default}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{def.cols.required}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{def.cols.description}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {def.items.map((item, i) => (
                <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell className="nds-p-2 nds-font-mono nds-font-bold nds-text-primary">{item.name}</TableCell>
                  <TableCell className="nds-p-2 nds-font-mono nds-text-muted-foreground">{item.type}</TableCell>
                  <TableCell className="nds-p-2 nds-text-muted-foreground">{item.defaultValue}</TableCell>
                  <TableCell className="nds-p-2 nds-text-muted-foreground">{item.required}</TableCell>
                  <TableCell className="nds-p-2 nds-text-muted-foreground">{item.description}</TableCell>
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
      <h2 className="nds-section-title">{title}</h2>
      <div className="nds-stack" data-spacing="xl">
        {tables.map((def, i) => (
          <PropsTable key={i} def={def} />
        ))}
        {interfaceCode && (
          <Card className="nds-code-block nds-shadow-none">
            <code className="nds-whitespace-pre">{interfaceCode}</code>
          </Card>
        )}
        {extensibilityTitle && (
          <div className="nds-stack" data-spacing="sm">
            <h3 className="nds-text-base nds-font-semibold">{extensibilityTitle}</h3>
            {extensibilityNotes && (
              <div
                className="nds-text-body nds-text-muted-foreground nds-leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(extensibilityNotes) }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
