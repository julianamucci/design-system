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

export interface DocsWhenToUseScenario {
  s: string;
  u: string;
  a: string;
}

export interface DocsWhenToUseUXRow {
  element: string;
  do: string;
  dont: string;
  rules?: string;
}

/**
 * `guidelines.title` e o bloco `scenarios` são OBRIGATÓRIOS: título de bloco
 * mais tabela de cenários é a forma que o conteúdo compartilhado pratica.
 *
 * Em 2026-08-27 os dois ficaram opcionais por um dia, para acomodar o conteúdo
 * do editor, que trazia as guidelines como parágrafo solto e os cenários como
 * frases sem coluna. Quatro dev-agents afrouxaram este mesmo contrato em
 * paralelo, sem se ver — e o diagnóstico é justamente esse: o desvio estava no
 * conteúdo, não na leitura de cada um. Afrouxado, o container passava a aceitar
 * "Quando usar" sem cenário nenhum em qualquer componente NOVO, e nenhum portão
 * reclamaria. Corrigido o conteúdo (`f5f2ef555`), o contrato volta ao que as 66
 * páginas já praticam.
 *
 * `uxWriting` continua opcional, e sempre foi: é seção que só alguns
 * componentes têm.
 */
export interface DocsWhenToUseProps {
  title: string;
  guidelines: {
    title: string;
    items: string[];
  };
  scenarios: {
    title?: string;
    cols: { scenario: string; use: string; alternative: string };
    items: DocsWhenToUseScenario[];
  };
  uxWriting?: {
    title: string;
    cols: { element: string; do: string; dont: string; rules?: string };
    items: DocsWhenToUseUXRow[];
  };
  do: { title: string; items: string[] };
  dont: { title: string; items: string[] };
}

export function DocsWhenToUse({ title, guidelines, scenarios, uxWriting, do: doBlock, dont: dontBlock }: DocsWhenToUseProps) {
  return (
    <section id="quando-usar">
      <h2 className="nds-section-title">{title}</h2>
      <Card className="nds-p-4 nds-stack" data-spacing="lg">

        {/* Guidelines */}
        <Card className="nds-bg-muted-soft nds-border-soft nds-p-4 nds-stack" data-spacing="sm">
          <h3 className="nds-font-medium nds-text-body">{guidelines.title}</h3>
          <ul className="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
            {guidelines.items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
            ))}
          </ul>
        </Card>

        {/* Cenários */}
        <Card className="nds-overflow-x nds-p-4">
          <Table className="nds-w-full nds-border-collapse nds-text-body">
            <TableHeader>
              <TableRow className="nds-border-b nds-bg-muted-soft nds-font-medium">
                <TableHead className="nds-p-2">{scenarios.cols.scenario}</TableHead>
                <TableHead className="nds-p-2">{scenarios.cols.use}</TableHead>
                <TableHead className="nds-p-2">{scenarios.cols.alternative}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.items.map((item, i) => (
                <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell className="nds-p-2">{item.s}</TableCell>
                  <TableCell className="nds-p-2 nds-font-medium nds-text-primary">{item.u}</TableCell>
                  <TableCell className="nds-p-2 nds-text-muted-foreground">{item.a}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* UX Writing */}
        {uxWriting && (
          <div className="nds-stack" data-spacing="sm">
            <h3 className="nds-font-medium nds-text-body">{uxWriting.title}</h3>
            <Card className="nds-overflow-x nds-p-4">
              <Table className="nds-w-full nds-border-collapse nds-text-body">
                <TableHeader>
                  <TableRow className="nds-border-b nds-bg-muted-soft">
                    <TableHead className="nds-p-2 nds-font-semibold">{uxWriting.cols.element}</TableHead>
                    {uxWriting.cols.rules && (
                      <TableHead className="nds-p-2 nds-font-semibold">{uxWriting.cols.rules}</TableHead>
                    )}
                    <TableHead className="nds-p-2 nds-font-semibold nds-text-success">
                      <span className="nds-cluster" data-spacing="xs">
                        <span className="nds-pill" data-tone="success">✓</span>
                        {uxWriting.cols.do}
                      </span>
                    </TableHead>
                    <TableHead className="nds-p-2 nds-font-semibold nds-text-destructive">
                      <span className="nds-cluster" data-spacing="xs">
                        <span className="nds-pill" data-tone="destructive">✗</span>
                        {uxWriting.cols.dont}
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uxWriting.items.map((row, i) => (
                    <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                      <TableCell className="nds-p-2 nds-font-medium">{row.element}</TableCell>
                      {uxWriting.cols.rules && (
                        <TableCell className="nds-p-2 nds-text-muted-foreground">{row.rules}</TableCell>
                      )}
                      <TableCell className="nds-p-2 nds-font-medium nds-text-success">{row.do}</TableCell>
                      <TableCell className="nds-p-2 nds-font-medium nds-text-destructive">{row.dont}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* Do / Don't cards */}
        <div className="nds-grid" data-cols="2" data-spacing="md">
          <Card className="nds-p-4">
            <h3 className="nds-mb-4 nds-text-body nds-font-semibold nds-text-success nds-cluster" data-spacing="sm">
              <span className="nds-pill" data-tone="success">✓</span>
              {doBlock.title}
            </h3>
            <ul className="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed" data-spacing="sm">
              {doBlock.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
              ))}
            </ul>
          </Card>
          <Card className="nds-p-4">
            <h3 className="nds-mb-4 nds-text-body nds-font-semibold nds-text-destructive nds-cluster" data-spacing="sm">
              <span className="nds-pill" data-tone="destructive">✗</span>
              {dontBlock.title}
            </h3>
            <ul className="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed" data-spacing="sm">
              {dontBlock.items.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item) }} />
              ))}
            </ul>
          </Card>
        </div>

      </Card>
    </section>
  );
}
