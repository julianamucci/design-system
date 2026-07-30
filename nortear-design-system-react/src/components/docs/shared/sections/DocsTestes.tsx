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
    /** Linha de contexto abaixo do título da sub-seção. */
    description?: string;
    cols: { action: string; result: string; priority: string };
    items: DocsTestItem[];
  };
  accessibility: {
    title: string;
    /** Linha de contexto abaixo do título da sub-seção. */
    description?: string;
    cols: { criterion: string; level: string; how: string };
    items: DocsA11yTestItem[];
  };
  visual: {
    title: string;
    /** Linha de contexto abaixo do título da sub-seção. */
    description?: string;
    cols: { story: string; priority: string };
    items: DocsVisualTestItem[];
  };
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'Alta' || priority === 'High') {
    return <Badge className="nds-badge-high">{priority}</Badge>;
  }
  if (priority === 'Média' || priority === 'Medium') {
    return <Badge className="nds-badge-medium">{priority}</Badge>;
  }
  if (priority === 'Baixa' || priority === 'Low') {
    return <Badge className="nds-badge-low">{priority}</Badge>;
  }
  return <Badge className="nds-badge-outline">{priority}</Badge>;
}

export function DocsTestes({ title, functional, accessibility, visual }: DocsTestesProps) {
  return (
    <section id="testes">
      <h2 className="nds-section-title">{title}</h2>
      <div className="nds-stack" data-spacing="xl">

        {/* Functional */}
        <div className="nds-stack" data-spacing="sm">
          <h3 className="nds-text-base nds-font-semibold">{functional.title}</h3>
          {functional.description && (
            <p className="nds-text-body nds-text-muted-foreground">{functional.description}</p>
          )}
          <Card className="nds-p-4 nds-overflow-x">
              <Table className="nds-w-full nds-text-body">
                <TableHeader>
                  <TableRow className="nds-border-b nds-bg-muted-soft">
                    <TableHead className="nds-p-2 nds-font-semibold">{functional.cols.action}</TableHead>
                    <TableHead className="nds-p-2 nds-font-semibold">{functional.cols.result}</TableHead>
                    <TableHead className="nds-p-2 nds-font-semibold">{functional.cols.priority}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {functional.items.map((item, i) => (
                    <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                      <TableCell className="nds-p-2">{item.action}</TableCell>
                      <TableCell className="nds-p-2 nds-text-muted-foreground">{item.result}</TableCell>
                      <TableCell className="nds-p-2 nds-font-medium"><PriorityBadge priority={item.priority} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </Card>
        </div>

        {/* Accessibility */}
        <div className="nds-stack" data-spacing="sm">
          <h3 className="nds-text-base nds-font-semibold">{accessibility.title}</h3>
          {accessibility.description && (
            <p className="nds-text-body nds-text-muted-foreground">{accessibility.description}</p>
          )}
          <div className="nds-grid" data-cols="2" data-spacing="sm">
            {accessibility.items.map((item, i) => (
              <Card key={i} className="nds-bg-muted-soft nds-border-none nds-shadow-none nds-p-2 nds-stack" data-spacing="xs">
                  <div className="nds-row" data-spacing="sm" data-align="center">
                    <span className="nds-kbd">
                      {item.level}
                    </span>
                    <span className="nds-text-body nds-font-medium">{item.criterion}</span>
                  </div>
                  <p className="nds-text-body">{item.how}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="nds-stack" data-spacing="sm">
          <h3 className="nds-text-base nds-font-semibold">{visual.title}</h3>
          {visual.description && (
            <p className="nds-text-body nds-text-muted-foreground">{visual.description}</p>
          )}
          <Card className="nds-p-4 nds-overflow-x">
              <Table className="nds-w-full nds-text-body">
                <TableHeader>
                  <TableRow className="nds-border-b nds-bg-muted-soft">
                    <TableHead className="nds-p-2 nds-font-semibold">{visual.cols.story}</TableHead>
                    <TableHead className="nds-p-2 nds-font-semibold">{visual.cols.priority}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visual.items.map((item, i) => (
                    <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                      <TableCell className="nds-p-2">{item.story}</TableCell>
                      <TableCell className="nds-p-2 nds-font-medium"><PriorityBadge priority={item.priority} /></TableCell>
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
