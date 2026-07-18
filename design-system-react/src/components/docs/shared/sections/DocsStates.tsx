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
      <h2 className="nds-section-title">{title}</h2>
      <Card className="nds-p-4 nds-overflow-x">
          <Table className="nds-w-full nds-text-body">
            <TableHeader>
              <TableRow className="nds-border-b nds-bg-muted-soft">
                <TableHead className="nds-p-2 nds-font-semibold">{cols.state}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{cols.trigger}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{cols.behavior}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell className="nds-p-2 nds-font-medium">{item.label}</TableCell>
                  <TableCell className="nds-p-2 nds-text-muted-foreground">{item.trigger}</TableCell>
                  <TableCell className="nds-p-2 nds-text-muted-foreground">{item.behavior}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </section>
  );
}
