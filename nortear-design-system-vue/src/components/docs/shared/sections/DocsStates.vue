<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsStateItem { label: string; trigger: string; behavior?: string }

defineProps<{
  title: string;
  /**
   * A terceira coluna é OPCIONAL — mesma forma da coluna de regras na tabela de
   * UX writing.
   *
   * Nem todo conteúdo compartilhado separa "quando ocorre" de "comportamento":
   * o editor descreve cada estado numa frase só, e um cabeçalho sem célula
   * embaixo é coluna morta, não rigor.
   */
  cols: { state: string; trigger: string; behavior?: string };
  items: DocsStateItem[];
}>();
</script>

<template>
  <section id="estados">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <Card class="nds-p-4 nds-overflow-x">
      <Table class="nds-w-full nds-text-body">
        <TableHeader>
          <TableRow class="nds-border-b nds-bg-muted-soft">
            <TableHead class="nds-p-2 nds-font-semibold">
              {{ cols.state }}
            </TableHead>
            <TableHead class="nds-p-2 nds-font-semibold">
              {{ cols.trigger }}
            </TableHead>
            <TableHead
              v-if="cols.behavior"
              class="nds-p-2 nds-font-semibold"
            >
              {{ cols.behavior }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="(item, i) in items"
            :key="i"
            class="nds-border-b nds-hover-bg-muted-faint"
          >
            <TableCell class="nds-p-2 nds-font-medium">
              {{ item.label }}
            </TableCell>
            <TableCell class="nds-p-2 nds-text-muted-foreground">
              {{ item.trigger }}
            </TableCell>
            <TableCell
              v-if="cols.behavior"
              class="nds-p-2 nds-text-muted-foreground"
            >
              {{ item.behavior }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </section>
</template>
