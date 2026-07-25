<script lang="ts">
  import { Card } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface DocsTestItem { action: string; result: string; priority: string }
  interface DocsA11yTestItem { criterion: string; level: string; how: string }
  interface DocsVisualTestItem { story: string; priority: string }

  const { title, functional, accessibility, visual }: {
    title: string;
    functional: { title: string; cols: { action: string; result: string; priority: string }; items: DocsTestItem[] };
    accessibility: { title: string; cols: { criterion: string; level: string; how: string }; items: DocsA11yTestItem[] };
    visual: { title: string; cols: { story: string; priority: string }; items: DocsVisualTestItem[] };
  } = $props();

  const priorityClass = (p: string) =>
    ({ Alta: 'nds-badge-high', Média: 'nds-badge-medium', Baixa: 'nds-badge-low', High: 'nds-badge-high', Medium: 'nds-badge-medium', Low: 'nds-badge-low' } as Record<string, string>)[p] ?? 'nds-badge-outline';
</script>

<section id="testes">
  <h2 class="nds-section-title">{title}</h2>
  <div class="nds-stack" data-spacing="xl">

    <!-- Functional -->
    <div class="nds-stack" data-spacing="sm">
      <h3 class="nds-text-base nds-font-semibold">{functional.title}</h3>
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
              {#each functional.items as item}
                <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell class="nds-p-2">{item.action}</TableCell>
                  <TableCell class="nds-p-2 nds-text-muted-foreground">{item.result}</TableCell>
                  <TableCell class="nds-p-2 nds-font-medium">
                    <Badge variant="outline" class={priorityClass(item.priority)}>{item.priority}</Badge>
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
      <div class="nds-grid" data-cols="2" data-spacing="sm">
        {#each accessibility.items as item}
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
      <Card class="nds-p-4 nds-overflow-x">
          <Table class="nds-w-full nds-text-body">
            <TableHeader>
              <TableRow class="nds-border-b nds-bg-muted-soft">
                <TableHead class="nds-p-2 nds-font-semibold">{visual.cols.story}</TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">{visual.cols.priority}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each visual.items as item}
                <TableRow class="nds-border-b nds-hover-bg-muted-faint">
                  <TableCell class="nds-p-2">{item.story}</TableCell>
                  <TableCell class="nds-p-2 nds-font-medium">
                    <Badge variant="outline" class={priorityClass(item.priority)}>{item.priority}</Badge>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
      </Card>
    </div>

  </div>
</section>
