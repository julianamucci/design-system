<script lang="ts">
  import DOMPurify from 'dompurify';
  import { Card } from '@/components/ui/card';
  import { CodeBlock } from '@/components/ui/code-block';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface DocsPropItem {
    name: string; type: string; defaultValue: string; required: string; description: string;
  }
  interface DocsPropsTableDef {
    title?: string;
    cols: { prop: string; type: string; default: string; required: string; description: string };
    items: DocsPropItem[];
  }

  const { title, tables, interfaceCode, extensibilityTitle, extensibilityNotes, extensibilityCode, language = 'svelte', copyLabel, copiedLabel }: {
    title: string;
    tables: DocsPropsTableDef[];
    interfaceCode?: string;
    extensibilityTitle?: string;
    extensibilityNotes?: string;
    /** Exemplo de extensão, renderizado depois das notas. */
    extensibilityCode?: string;
    language?: string;
    copyLabel?: string;
    copiedLabel?: string;
  } = $props();
</script>

<section id="propriedades">
  <h2 class="nds-section-title">{title}</h2>
  <div class="nds-stack" data-spacing="xl">
    {#each tables as def, i (i)}
      <div class="nds-stack" data-spacing="sm">
        {#if def.title}
          <h3 class="nds-text-base nds-font-semibold">{def.title}</h3>
        {/if}
        <Card class="nds-p-4 nds-overflow-x">
            <Table class="nds-w-full nds-text-body">
              <TableHeader>
                <TableRow class="nds-border-b nds-bg-muted-soft">
                  <TableHead class="nds-p-2 nds-font-semibold">{def.cols.prop}</TableHead>
                  <TableHead class="nds-p-2 nds-font-semibold">{def.cols.type}</TableHead>
                  <TableHead class="nds-p-2 nds-font-semibold">{def.cols.default}</TableHead>
                  <TableHead class="nds-p-2 nds-font-semibold">{def.cols.required}</TableHead>
                  <TableHead class="nds-p-2 nds-font-semibold">{def.cols.description}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {#each def.items as item, i (i)}
                  <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                    <!-- lang="en": nome de prop e tipo são identificadores, não
                         português — a célula monoespaçada é o sinal. WCAG 3.1.2. -->
                    <TableCell lang="en" class="nds-p-2 nds-font-mono nds-font-bold nds-text-primary">{item.name}</TableCell>
                    <TableCell lang="en" class="nds-p-2 nds-font-mono nds-text-muted-foreground">{item.type}</TableCell>
                    <TableCell class="nds-p-2 nds-text-muted-foreground">{item.defaultValue}</TableCell>
                    <TableCell class="nds-p-2 nds-text-muted-foreground">{item.required}</TableCell>
                    <TableCell class="nds-p-2 nds-text-muted-foreground">{item.description}</TableCell>
                  </TableRow>
                {/each}
              </TableBody>
            </Table>
        </Card>
      </div>
    {/each}
    {#if interfaceCode}
      <CodeBlock code={interfaceCode} {language} showLineNumbers={false} {copyLabel} {copiedLabel} />
    {/if}
    {#if extensibilityTitle}
      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-text-base nds-font-semibold">{extensibilityTitle}</h3>
        {#if extensibilityNotes}
          <div class="nds-text-body nds-text-muted-foreground nds-leading-relaxed">{@html DOMPurify.sanitize(extensibilityNotes)}</div>
        {/if}
        {#if extensibilityCode}
          <CodeBlock code={extensibilityCode} {language} showLineNumbers={false} {copyLabel} {copiedLabel} />
        {/if}
      </div>
    {/if}
  </div>
</section>
