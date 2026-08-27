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

/**
 * As três colunas são OBRIGATÓRIAS, e é assim que 48 dos 49 conteúdos as
 * declaram: estado, como ativar, comportamento.
 *
 * Em 2026-08-27 `trigger` e `behavior` ficaram opcionais por um dia, para
 * acomodar o conteúdo do editor, que descrevia o estado numa coluna só. Quatro
 * dev-agents afrouxaram este mesmo contrato em paralelo, sem se ver — e o
 * diagnóstico é justamente esse: o desvio estava no conteúdo, não na leitura de
 * cada um. Afrouxado, o container passava a aceitar tabela de estados sem
 * gatilho nem comportamento em qualquer componente NOVO, e nenhum portão
 * reclamaria. Corrigido o conteúdo (`f5f2ef555`), o contrato volta a ser o que
 * as 66 páginas já praticam.
 */
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
