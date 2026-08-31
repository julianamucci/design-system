<script lang="ts">
/*
 * audit-ignore: card-nested — os três cartões desta seção são IRMÃOS, não
 * aninhados: quem os agrupa é um `div` de layout, sem raio e sem padding. Não
 * há inset a descontar, e marcá-los com `nds-card-nested` deixaria o canto
 * menor do que deve. Ver a regra `card_aninhado_sem_desconto` no audit.
 */
  import { prioridadeVariant } from '@shared/primitives/badge-priority';
  import { Card } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface DocsTestItem { action: string; result: string; priority: string }
  interface DocsA11yTestItem { criterion: string; level: string; how: string }
  interface DocsVisualTestItem { story: string; priority: string }

  const { title, functional, accessibility, visual }: {
    title: string;
    functional: { title: string; description?: string; cols: { action: string; result: string; priority: string }; items: DocsTestItem[] };
    accessibility: { title: string; description?: string; cols: { criterion: string; level: string; how: string }; items: DocsA11yTestItem[] };
    visual: { title: string; description?: string; cols: { story: string; priority: string }; items: DocsVisualTestItem[] };
  } = $props();

  // A prioridade escolhe uma VARIANTE do badge — alta é destructive, média é
  // warning, baixa é info. O mapa antigo listava só português e inglês, então em
  // espanhol "Media" e "Baja" caíam no outline e a prioridade sumia da tabela.
</script>

<section id="testes">
  <h2 class="nds-section-title">{title}</h2>
  <div class="nds-stack" data-spacing="xl">

    <!-- Functional -->
    <div class="nds-stack" data-spacing="sm">
      <h3 class="nds-text-base nds-font-semibold">{functional.title}</h3>
      {#if functional.description}
        <p class="nds-text-body nds-text-muted-foreground">{functional.description}</p>
      {/if}
      <Card class="nds-p-4 nds-overflow-x">
          <Table class="nds-w-full nds-text-body">
            <TableHeader>
              <TableRow class="nds-border-b nds-bg-muted-soft">
                <TableHead class="nds-p-2 nds-font-semibold">{functional.cols.action}</TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">{functional.cols.result}</TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">{functional.cols.priority}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each functional.items as item, i (i)}
                <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell class="nds-p-2">{item.action}</TableCell>
                  <TableCell class="nds-p-2 nds-text-muted-foreground">{item.result}</TableCell>
                  <TableCell class="nds-p-2 nds-font-medium">
                    <Badge variant={prioridadeVariant(item.priority)}>{item.priority}</Badge>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
      </Card>
    </div>

    <!-- Accessibility -->
    <div class="nds-stack" data-spacing="sm">
      <h3 class="nds-text-base nds-font-semibold">{accessibility.title}</h3>
      {#if accessibility.description}
        <p class="nds-text-body nds-text-muted-foreground">{accessibility.description}</p>
      {/if}
      <div class="nds-grid" data-cols="2" data-spacing="sm">
        {#each accessibility.items as item, i (i)}
          <Card class="nds-bg-muted-soft nds-border-none nds-shadow-none nds-p-2 nds-stack" data-spacing="xs">
              <div class="nds-row" data-spacing="sm" data-align="center">
                <kbd data-slot="kbd" class="nds-kbd">{item.level}</kbd>
                <span class="nds-text-body nds-font-medium">{item.criterion}</span>
              </div>
              <p class="nds-text-body">{item.how}</p>
          </Card>
        {/each}
      </div>
    </div>

    <!-- Visual -->
    <div class="nds-stack" data-spacing="sm">
      <h3 class="nds-text-base nds-font-semibold">{visual.title}</h3>
      {#if visual.description}
        <p class="nds-text-body nds-text-muted-foreground">{visual.description}</p>
      {/if}
      <Card class="nds-p-4 nds-overflow-x">
          <Table class="nds-w-full nds-text-body">
            <TableHeader>
              <TableRow class="nds-border-b nds-bg-muted-soft">
                <TableHead class="nds-p-2 nds-font-semibold">{visual.cols.story}</TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">{visual.cols.priority}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each visual.items as item, i (i)}
                <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell class="nds-p-2">{item.story}</TableCell>
                  <TableCell class="nds-p-2 nds-font-medium">
                    <Badge variant={prioridadeVariant(item.priority)}>{item.priority}</Badge>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
      </Card>
    </div>

  </div>
</section>
