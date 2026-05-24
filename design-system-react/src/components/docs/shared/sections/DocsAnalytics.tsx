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
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <Card className="overflow-x-auto md:overflow-visible p-4">
          <Table className="w-full text-sm [&_th]:whitespace-normal [&_td]:whitespace-normal">
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 text-left">
                <TableHead className="p-3 font-semibold">{cols.event}</TableHead>
                <TableHead className="p-3 font-semibold">{cols.trigger}</TableHead>
                <TableHead className="p-3 font-semibold">{cols.payload}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                  <TableCell className="p-3 font-mono text-primary">{item.event}</TableCell>
                  <TableCell className="p-3 text-muted-foreground">{item.trigger}</TableCell>
                  <TableCell className="p-3 font-mono text-xs text-muted-foreground">{item.payload}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </section>
  );
}
