import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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
      <h2 className="nds-section-title">{title}</h2>
      <Card className="nds-p-4 nds-overflow-x">
          <Table className="nds-w-full nds-text-body">
            <TableHeader>
              <TableRow className="nds-border-b nds-bg-muted-soft">
                <TableHead className="nds-p-2 nds-font-semibold">{cols.event}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{cols.trigger}</TableHead>
                <TableHead className="nds-p-2 nds-font-semibold">{cols.payload}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell className="nds-p-2 nds-font-mono nds-text-primary">{item.event}</TableCell>
                  <TableCell className="nds-p-2 nds-text-muted-foreground">{item.trigger}</TableCell>
                  <TableCell className="nds-p-2 nds-font-mono nds-text-caption nds-text-muted-foreground">{item.payload}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </section>
  );
}
