<script lang="ts">
  import { Card } from '@/components/ui/card';
  import { CodeBlock } from '@/components/ui/code-block';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface DocsTokenItem { token: string; value: string; description: string }

  /**
   * As três colunas são OBRIGATÓRIAS: token, propriedade CSS que ele alimenta,
   * uso.
   *
   * Em 2026-08-27 `value` ficou opcional por um dia, para acomodar o conteúdo do
   * editor, que descrevia o token em duas colunas. Era o desvio do conteúdo
   * virando folga permanente do container: afrouxado, qualquer componente NOVO
   * podia documentar token sem dizer que propriedade ele alimenta, e nenhum
   * portão reclamaria. Corrigido o conteúdo (`f5f2ef555`), o contrato volta ao
   * que as demais páginas já praticam.
   */
  const { title, cols, items, customizationTitle, customizationCode, language = 'css', copyLabel, copiedLabel }: {
    title: string;
    cols: { token: string; value: string; description: string };
    items: DocsTokenItem[];
    customizationTitle?: string;
    customizationCode?: string;
    language?: string;
    copyLabel?: string;
    copiedLabel?: string;
  } = $props();
</script>

<section id="tokens">
  <h2 class="nds-section-title">{title}</h2>
  <div class="nds-stack" data-spacing="lg">
    <Card class="nds-p-4 nds-overflow-x">
        <Table class="nds-w-full nds-text-body">
          <TableHeader>
            <TableRow class="nds-border-b nds-bg-muted-soft">
              <TableHead class="nds-p-2 nds-font-semibold">{cols.token}</TableHead>
              <TableHead class="nds-p-2 nds-font-semibold">{cols.value}</TableHead>
              <TableHead class="nds-p-2 nds-font-semibold">{cols.description}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each items as item, i (i)}
              <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                <!-- lang="en": token e seletor são identificadores CSS. WCAG 3.1.2. -->
                <TableCell lang="en" class="nds-p-2 nds-font-mono nds-text-primary">{item.token}</TableCell>
                <TableCell lang="en" class="nds-p-2 nds-font-mono nds-text-muted-foreground">{item.value}</TableCell>
                <TableCell class="nds-p-2 nds-text-muted-foreground">{item.description}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
    </Card>
    {#if customizationTitle}
      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-base nds-font-semibold">{customizationTitle}</h3>
        {#if customizationCode}
          <CodeBlock code={customizationCode} {language} showLineNumbers={false} {copyLabel} {copiedLabel} />
        {/if}
      </div>
    {/if}
  </div>
</section>
