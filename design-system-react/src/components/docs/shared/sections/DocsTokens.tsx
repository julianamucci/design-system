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
        <Card className="overflow-x-auto md:overflow-visible p-4">
            <Table className="w-full text-sm [&_th]:whitespace-normal [&_td]:whitespace-normal">
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 text-left">
                  <TableHead className="p-3 font-semibold">{cols.token}</TableHead>
                  <TableHead className="p-3 font-semibold">{cols.value}</TableHead>
                  <TableHead className="p-3 font-semibold">{cols.description}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                    <TableCell className="p-3 font-mono text-primary">{item.token}</TableCell>
                    <TableCell className="p-3 font-mono text-muted-foreground">{item.value}</TableCell>
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
              <Card className="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none">
                <code className="whitespace-pre">{customizationCode}</code>
              </Card>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
