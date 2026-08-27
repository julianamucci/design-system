<script setup lang="ts">
import { Card } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsTokenItem { token: string; value: string; description: string }

/**
 * As três colunas são OBRIGATÓRIAS: token, propriedade CSS, uso.
 *
 * Em 2026-08-27 `value` ficou opcional por um dia, para acomodar o conteúdo do
 * editor, que listava token e uso só. Quatro dev-agents afrouxaram este mesmo
 * contrato em paralelo, sem se ver — e é esse o diagnóstico: o desvio estava no
 * CONTEÚDO, não na leitura de cada um. Afrouxado, o container passava a aceitar
 * tabela de tokens sem dizer o que cada token pinta em qualquer componente
 * novo, e nenhum portão reclamaria. Corrigido o conteúdo (`f5f2ef555`), o
 * contrato volta ao que as 66 páginas já praticam.
 */
withDefaults(defineProps<{
  title: string;
  cols: { token: string; value: string; description: string };
  items: DocsTokenItem[];
  customizationTitle?: string;
  customizationCode?: string;
  /** Linguagem do snippet de customização, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}>(), {
  language: 'css',
});
</script>

<template>
  <section id="tokens">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <div
      class="nds-stack"
      data-spacing="lg"
    >
      <Card class="nds-p-4 nds-overflow-x">
        <Table class="nds-w-full nds-text-body">
          <TableHeader>
            <TableRow class="nds-border-b nds-bg-muted-soft">
              <TableHead class="nds-p-2 nds-font-semibold">
                {{ cols.token }}
              </TableHead>
              <TableHead class="nds-p-2 nds-font-semibold">
                {{ cols.value }}
              </TableHead>
              <TableHead class="nds-p-2 nds-font-semibold">
                {{ cols.description }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(item, i) in items"
              :key="i"
              class="nds-border-b nds-hover-bg-muted-faint"
            >
              <!-- lang="en": token e seletor são identificadores CSS. WCAG 3.1.2. -->
              <TableCell lang="en" class="nds-p-2 nds-font-mono nds-text-primary">
                {{ item.token }}
              </TableCell>
              <TableCell lang="en" class="nds-p-2 nds-font-mono nds-text-muted-foreground">
                {{ item.value }}
              </TableCell>
              <TableCell class="nds-p-2 nds-text-muted-foreground">
                {{ item.description }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
      <div
        v-if="customizationTitle"
        class="nds-stack"
        data-spacing="sm"
      >
        <h3 class="nds-text-base nds-font-semibold">
          {{ customizationTitle }}
        </h3>
        <CodeBlock
          v-if="customizationCode"
          :code="customizationCode"
          :language="language"
          :show-line-numbers="false"
          :copy-label="copyLabel"
          :copied-label="copiedLabel"
        />
      </div>
    </div>
  </section>
</template>
