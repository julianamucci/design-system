<script setup lang="ts">
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';
import { CodeBlock } from '@/components/ui/code-block';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsPropItem {
  name: string;
  type: string;
  defaultValue: string;
  required: string;
  description: string;
}

interface DocsPropsTableDef {
  title?: string;
  cols: { prop: string; type: string; default: string; required: string; description: string };
  items: DocsPropItem[];
}

withDefaults(defineProps<{
  title: string;
  tables: DocsPropsTableDef[];
  interfaceCode?: string;
  extensibilityTitle?: string;
  extensibilityNotes?: string;
  extensibilityCode?: string;
  /** Linguagem dos snippets, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}>(), {
  language: 'vue',
});
</script>

<template>
  <section id="propriedades">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <div
      class="nds-stack"
      data-spacing="xl"
    >
      <div
        v-for="(def, ti) in tables"
        :key="ti"
        class="nds-stack"
        data-spacing="xl"
      >
        <h3
          v-if="def.title"
          class="nds-text-base nds-font-semibold"
        >
          {{ def.title }}
        </h3>
        <Card class="nds-p-4 nds-overflow-x">
          <Table class="nds-w-full nds-text-body">
            <TableHeader>
              <TableRow class="nds-border-b nds-bg-muted-soft">
                <TableHead class="nds-p-2 nds-font-semibold">
                  {{ def.cols.prop }}
                </TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">
                  {{ def.cols.type }}
                </TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">
                  {{ def.cols.default }}
                </TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">
                  {{ def.cols.required }}
                </TableHead>
                <TableHead class="nds-p-2 nds-font-semibold">
                  {{ def.cols.description }}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(item, i) in def.items"
                :key="i"
                class="nds-border-b nds-hover-bg-muted-faint"
              >
                <TableCell class="nds-p-2 nds-font-mono nds-font-bold nds-text-primary">
                  {{ item.name }}
                </TableCell>
                <TableCell class="nds-p-2 nds-font-mono nds-text-muted-foreground">
                  {{ item.type }}
                </TableCell>
                <TableCell class="nds-p-2 nds-text-muted-foreground">
                  {{ item.defaultValue }}
                </TableCell>
                <TableCell class="nds-p-2 nds-text-muted-foreground">
                  {{ item.required }}
                </TableCell>
                <TableCell class="nds-p-2 nds-text-muted-foreground">
                  {{ item.description }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>
      <CodeBlock
        v-if="interfaceCode"
        :code="interfaceCode"
        :language="language"
        :show-line-numbers="false"
        :copy-label="copyLabel"
        :copied-label="copiedLabel"
      />
      <div
        v-if="extensibilityTitle"
        class="nds-stack"
        data-spacing="sm"
      >
        <h3 class="nds-text-base nds-font-semibold">
          {{ extensibilityTitle }}
        </h3>
        <div
          v-if="extensibilityNotes"
          class="nds-text-body nds-text-muted-foreground nds-leading-relaxed"
          v-html="DOMPurify.sanitize(extensibilityNotes)"
        />
        <CodeBlock
          v-if="extensibilityCode"
          :code="extensibilityCode"
          :language="language"
          :show-line-numbers="false"
          :copy-label="copyLabel"
          :copied-label="copiedLabel"
        />
      </div>
    </div>
  </section>
</template>
