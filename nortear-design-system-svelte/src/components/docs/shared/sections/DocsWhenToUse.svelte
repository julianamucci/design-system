<script lang="ts">
  import DOMPurify from 'dompurify';
  import { Card } from '@/components/ui/card';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface Scenario { s: string; u: string; a: string }
  interface UXRow { element: string; do: string; dont: string; rules?: string }

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
   * reclamaria. Corrigido o conteúdo (`f5f2ef555`), o contrato volta ao que as
   * demais páginas já praticam.
   *
   * `uxWriting` continua opcional, e sempre foi: é seção que só alguns
   * componentes têm.
   */
  const { title, guidelines, scenarios, uxWriting, do: doBlock, dont: dontBlock }: {
    title: string;
    guidelines: { title: string; items: string[] };
    scenarios: { title?: string; cols: { scenario: string; use: string; alternative: string }; items: Scenario[] };
    uxWriting?: { title: string; cols: { element: string; do: string; dont: string; rules?: string }; items: UXRow[] };
    do: { title: string; items: string[] };
    dont: { title: string; items: string[] };
  } = $props();
</script>

<section id="quando-usar">
  <h2 class="nds-section-title">{title}</h2>
  <Card class="nds-p-4 nds-stack" data-spacing="lg">

      <!-- Guidelines -->
      <Card class="nds-bg-muted-soft nds-border-soft nds-p-4 nds-stack" data-spacing="sm">
          <h3 class="nds-font-medium nds-text-body">{guidelines.title}</h3>
          <ul class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
            {#each guidelines.items as item, i (i)}
              <li>{@html DOMPurify.sanitize(item)}</li>
            {/each}
          </ul>
      </Card>

      <!-- Cenários -->
      <Card class="nds-overflow-x nds-p-4">
        <Table class="nds-w-full nds-border-collapse nds-text-body">
          <TableHeader>
            <TableRow class="nds-border-b nds-bg-muted-soft nds-font-medium">
              <TableHead class="nds-p-2">{scenarios.cols.scenario}</TableHead>
              <TableHead class="nds-p-2">{scenarios.cols.use}</TableHead>
              <TableHead class="nds-p-2">{scenarios.cols.alternative}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {#each scenarios.items as item, i (i)}
              <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                <TableCell class="nds-p-2">{item.s}</TableCell>
                <TableCell class="nds-p-2 nds-font-medium nds-text-primary">{item.u}</TableCell>
                <TableCell class="nds-p-2 nds-text-muted-foreground">{item.a}</TableCell>
              </TableRow>
            {/each}
          </TableBody>
        </Table>
      </Card>

      <!-- UX Writing -->
      {#if uxWriting}
      <div class="nds-stack" data-spacing="sm">
        <h3 class="nds-font-medium nds-text-body">{uxWriting.title}</h3>
        <Card class="nds-overflow-x nds-p-4">
          <Table class="nds-w-full nds-border-collapse nds-text-body">
            <TableHeader>
              <TableRow class="nds-border-b nds-bg-muted-soft">
                <TableHead class="nds-p-2 nds-font-semibold">{uxWriting.cols.element}</TableHead>
                {#if uxWriting.cols.rules}
                  <TableHead class="nds-p-2 nds-font-semibold">{uxWriting.cols.rules}</TableHead>
                {/if}
                <TableHead class="nds-p-2 nds-font-semibold nds-text-success">
                  <span class="nds-cluster" data-spacing="xs">
                    <span class="nds-pill" data-tone="success">✓</span>
                    {uxWriting.cols.do}
                  </span>
                </TableHead>
                <TableHead class="nds-p-2 nds-font-semibold nds-text-destructive">
                  <span class="nds-cluster" data-spacing="xs">
                    <span class="nds-pill" data-tone="destructive">✗</span>
                    {uxWriting.cols.dont}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each uxWriting.items as row (row.element)}
                <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell class="nds-p-2 nds-font-medium">{row.element}</TableCell>
                  {#if uxWriting.cols.rules}
                    <TableCell class="nds-p-2 nds-text-muted-foreground">{row.rules ?? ''}</TableCell>
                  {/if}
                  <TableCell class="nds-p-2 nds-font-medium nds-text-success">{row.do}</TableCell>
                  <TableCell class="nds-p-2 nds-font-medium nds-text-destructive">{row.dont}</TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </Card>
      </div>
      {/if}

      <!-- Do / Don't cards -->
      <div class="nds-grid" data-cols="2" data-spacing="md">
        <Card class="nds-p-4">
            <h3 class="nds-mb-4 nds-text-body nds-font-semibold nds-text-success nds-cluster" data-spacing="sm">
              <span class="nds-pill" data-tone="success">✓</span>
              {doBlock.title}
            </h3>
            <ul class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed" data-spacing="sm">
              {#each doBlock.items as item, i (i)}
                <li>{@html DOMPurify.sanitize(item)}</li>
              {/each}
            </ul>
        </Card>
        <Card class="nds-p-4">
            <h3 class="nds-mb-4 nds-text-body nds-font-semibold nds-text-destructive nds-cluster" data-spacing="sm">
              <span class="nds-pill" data-tone="destructive">✗</span>
              {dontBlock.title}
            </h3>
            <ul class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed" data-spacing="sm">
              {#each dontBlock.items as item, i (i)}
                <li>{@html DOMPurify.sanitize(item)}</li>
              {/each}
            </ul>
        </Card>
      </div>

  </Card>
</section>
