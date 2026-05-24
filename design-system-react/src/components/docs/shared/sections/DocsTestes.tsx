import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export interface DocsTestItem {
  action: string;
  result: string;
  priority: string;
}

export interface DocsA11yTestItem {
  criterion: string;
  level: string;
  how: string;
}

export interface DocsVisualTestItem {
  story: string;
  priority: string;
}

export interface DocsTestesProps {
  title: string;
  functional: {
    title: string;
    cols: { action: string; result: string; priority: string };
    items: DocsTestItem[];
  };
  accessibility: {
    title: string;
    cols: { criterion: string; level: string; how: string };
    items: DocsA11yTestItem[];
  };
  visual: {
    title: string;
    cols: { story: string; priority: string };
    items: DocsVisualTestItem[];
  };
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'Alta' || priority === 'High') {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        {priority}
      </Badge>
    );
  }
  if (priority === 'Média' || priority === 'Medium') {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        {priority}
      </Badge>
    );
  }
  if (priority === 'Baixa' || priority === 'Low') {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {priority}
      </Badge>
    );
  }
  return <span>{priority}</span>;
}

export function DocsTestes({ title, functional, accessibility, visual }: DocsTestesProps) {
  return (
    <section id="testes">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-8">

        {/* Functional */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{functional.title}</h3>
          <Card className="overflow-x-auto md:overflow-visible p-4">
              <Table className="w-full text-sm [&_th]:whitespace-normal [&_td]:whitespace-normal">
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/50 text-left">
                    <TableHead className="p-3 font-semibold">{functional.cols.action}</TableHead>
                    <TableHead className="p-3 font-semibold">{functional.cols.result}</TableHead>
                    <TableHead className="p-3 font-semibold">{functional.cols.priority}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {functional.items.map((item, i) => (
                    <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                      <TableCell className="p-3">{item.action}</TableCell>
                      <TableCell className="p-3 text-muted-foreground">{item.result}</TableCell>
                      <TableCell className="p-3"><PriorityBadge priority={item.priority} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </Card>
        </div>

        {/* Accessibility */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{accessibility.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accessibility.items.map((item, i) => (
              <Card key={i} className="bg-muted/30 border-0 shadow-none p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary border border-primary/20 rounded px-1.5 py-0.5 bg-primary/5">
                      {item.level}
                    </span>
                    <span className="text-sm font-medium">{item.criterion}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-0.5">{item.how}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">{visual.title}</h3>
          <Card className="overflow-x-auto md:overflow-visible p-4">
              <Table className="w-full text-sm [&_th]:whitespace-normal [&_td]:whitespace-normal">
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/50 text-left">
                    <TableHead className="p-3 font-semibold">{visual.cols.story}</TableHead>
                    <TableHead className="p-3 font-semibold">{visual.cols.priority}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visual.items.map((item, i) => (
                    <TableRow key={i} className="border-b border-border last:border-0 hover:bg-muted/5">
                      <TableCell className="p-3 text-sm">{item.story}</TableCell>
                      <TableCell className="p-3"><PriorityBadge priority={item.priority} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </Card>
        </div>

      </div>
    </section>
  );
}
