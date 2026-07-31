import { Card } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
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
  /** Linguagem do snippet de customização, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}

export function DocsTokens({ title, cols, items, customizationTitle, customizationCode, language = 'css', copyLabel, copiedLabel }: DocsTokensProps) {
  return (
    <section id="tokens">
      <h2 className="nds-section-title">{title}</h2>
      <div className="nds-stack" data-spacing="lg">
        <Card className="nds-p-4 nds-overflow-x">
            <Table className="nds-w-full nds-text-body">
              <TableHeader>
                <TableRow className="nds-border-b nds-bg-muted-soft">
                  <TableHead className="nds-p-2 nds-font-semibold">{cols.token}</TableHead>
                  <TableHead className="nds-p-2 nds-font-semibold">{cols.value}</TableHead>
                  <TableHead className="nds-p-2 nds-font-semibold">{cols.description}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i} className="nds-border-b nds-hover-bg-muted-faint">
                    <TableCell className="nds-p-2 nds-font-mono nds-text-primary">{item.token}</TableCell>
                    <TableCell className="nds-p-2 nds-font-mono nds-text-muted-foreground">{item.value}</TableCell>
                    <TableCell className="nds-p-2 nds-text-muted-foreground">{item.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </Card>
        {customizationTitle && (
          <div className="nds-stack" data-spacing="sm">
            <h3 className="nds-text-base nds-font-semibold">{customizationTitle}</h3>
            {customizationCode && (
              <CodeBlock
                code={customizationCode}
                language={language}
                showLineNumbers={false}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
