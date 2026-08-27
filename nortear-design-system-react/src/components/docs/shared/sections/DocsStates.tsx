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
  trigger?: string;
  behavior?: string;
}

/**
 * `trigger` e `behavior` são opcionais porque nem todo conteúdo compartilhado
 * declara as três colunas: o do editor descreve o estado em UMA coluna
 * (`states.cols` traz só `state` e `description`). Com as três obrigatórias, a
 * página renderizava um cabeçalho vazio — cabeçalho sem texto é violação de
 * `empty-table-header` no axe, e inventar rótulo aqui deixaria a tabela em
 * português nos três idiomas. A coluna sai da tabela quando não há rótulo para
 * ela; com os três rótulos presentes, nada muda para as páginas existentes.
 */
export interface DocsStatesProps {
  title: string;
  cols: { state: string; trigger?: string; behavior?: string };
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
                {cols.trigger && (
                  <TableHead className="nds-p-2 nds-font-semibold">{cols.trigger}</TableHead>
                )}
                {cols.behavior && (
                  <TableHead className="nds-p-2 nds-font-semibold">{cols.behavior}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell className="nds-p-2 nds-font-medium">{item.label}</TableCell>
                  {cols.trigger && (
                    <TableCell className="nds-p-2 nds-text-muted-foreground">{item.trigger ?? ''}</TableCell>
                  )}
                  {cols.behavior && (
                    <TableCell className="nds-p-2 nds-text-muted-foreground">{item.behavior ?? ''}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </Card>
    </section>
  );
}
