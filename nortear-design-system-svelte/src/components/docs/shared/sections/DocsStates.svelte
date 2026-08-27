<script lang="ts">
  import { Card } from '@/components/ui/card';
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

  interface DocsStateItem { label: string; trigger: string; behavior: string }

  /**
   * As três colunas são OBRIGATÓRIAS: estado, como ativar, comportamento.
   *
   * Em 2026-08-27 `trigger` ficou opcional por um dia, para acomodar o conteúdo
   * do editor, que descrevia o estado numa coluna só. Quatro dev-agents
   * afrouxaram este mesmo contrato em paralelo, sem se ver — e o diagnóstico é
   * justamente esse: o desvio estava no conteúdo, não na leitura de cada um.
   * Afrouxado, o container passava a aceitar tabela de estados sem gatilho em
   * qualquer componente NOVO, e nenhum portão reclamaria. Corrigido o conteúdo
   * (`f5f2ef555`), o contrato volta ao que as demais páginas já praticam.
   */
  const { title, cols, items }: {
    title: string;
    cols: { state: string; trigger: string; behavior: string };
    items: DocsStateItem[];
  } = $props();
</script>

<section id="estados">
  <h2 class="nds-section-title">{title}</h2>
  <Card class="nds-p-4 nds-overflow-x">
      <Table class="nds-w-full nds-text-body">
        <TableHeader>
          <TableRow class="nds-border-b nds-bg-muted-soft">
            <TableHead class="nds-p-2 nds-font-semibold">{cols.state}</TableHead>
            <TableHead class="nds-p-2 nds-font-semibold">{cols.trigger}</TableHead>
            <TableHead class="nds-p-2 nds-font-semibold">{cols.behavior}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {#each items as item, i (i)}
            <TableRow class="nds-border-b nds-hover-bg-muted-faint">
              <TableCell class="nds-p-2 nds-font-medium">{item.label}</TableCell>
              <TableCell class="nds-p-2 nds-text-muted-foreground">{item.trigger}</TableCell>
              <TableCell class="nds-p-2 nds-text-muted-foreground">{item.behavior}</TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
  </Card>
</section>
