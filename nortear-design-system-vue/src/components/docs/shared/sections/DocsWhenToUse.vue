<script setup lang="ts">
import DOMPurify from 'dompurify';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DocsWhenToUseScenario { s?: string; u?: string; a?: string; scenario?: string; use?: string; alternative?: string }
interface DocsWhenToUseUXRow { element: string; do: string; dont: string; rules?: string }

/**
 * O bloco `scenarios` é OBRIGATÓRIO: lista de diretrizes mais tabela de
 * cenários é a forma que o conteúdo compartilhado pratica em todas as páginas.
 *
 * Em 2026-08-27 ele ficou opcional por um dia, para acomodar o conteúdo do
 * editor, que trazia os cenários como frases soltas sem coluna. Quatro
 * dev-agents afrouxaram este mesmo contrato em paralelo, sem se ver — e é esse
 * o diagnóstico: o desvio estava no CONTEÚDO, não na leitura de cada um.
 * Afrouxado, o container passava a aceitar "Quando usar" sem cenário nenhum em
 * qualquer componente novo, e nenhum portão reclamaria. Corrigido o conteúdo
 * (`f5f2ef555`), o contrato volta ao que as 66 páginas já praticam.
 *
 * `uxWriting` continua opcional, e sempre foi: é seção que só alguns
 * componentes têm.
 */
const props = defineProps<{
  title: string;
  guidelines: { title: string; items: string[] };
  scenarios: {
    title?: string;
    cols: { scenario: string; use: string; alternative: string };
    items: DocsWhenToUseScenario[];
  };
  uxWriting?: {
    title: string;
    cols: { element: string; do: string; dont: string; rules?: string };
    items: DocsWhenToUseUXRow[];
  };
  do: { title: string; items: string[] };
  dont: { title: string; items: string[] };
}>();
</script>

<template>
  <section id="quando-usar">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <Card
      class="nds-p-4 nds-stack"
      data-spacing="lg"
    >
      <!-- Guidelines -->
      <Card
        class="nds-bg-muted-soft nds-border-soft nds-p-4 nds-stack nds-card-nested"
        data-spacing="sm"
      >
        <h3 class="nds-font-medium nds-text-body">
          {{ guidelines.title }}
        </h3>
        <ul
          class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground"
          data-spacing="sm"
        >
          <li
            v-for="(item, i) in guidelines.items"
            :key="i"
            v-html="DOMPurify.sanitize(item)"
          />
        </ul>
      </Card>

      <!-- Cenários -->
      <Card class="nds-overflow-x nds-p-4 nds-card-nested">
        <Table class="nds-w-full nds-border-collapse nds-text-body">
          <TableHeader>
            <TableRow class="nds-border-b nds-bg-muted-soft nds-font-medium">
              <TableHead class="nds-p-2">
                {{ scenarios.cols.scenario }}
              </TableHead>
              <TableHead class="nds-p-2">
                {{ scenarios.cols.use }}
              </TableHead>
              <TableHead class="nds-p-2">
                {{ scenarios.cols.alternative }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="(item, i) in scenarios.items"
              :key="i"
              class="nds-border-b nds-hover-bg-muted-faint"
            >
              <TableCell class="nds-p-2">
                {{ item.s ?? item.scenario }}
              </TableCell>
              <TableCell class="nds-p-2 nds-font-medium nds-text-primary">
                {{ item.u ?? item.use }}
              </TableCell>
              <TableCell class="nds-p-2 nds-text-muted-foreground">
                {{ item.a ?? item.alternative }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <!-- UX Writing -->
      <div
        v-if="uxWriting"
        class="nds-stack"
        data-spacing="sm"
      >
        <h3 class="nds-font-medium nds-text-body">
          {{ uxWriting.title }}
        </h3>
        <Card class="nds-overflow-x nds-p-4 nds-card-nested">
          <Table class="nds-w-full nds-border-collapse nds-text-body">
            <TableHeader>
              <TableRow class="nds-border-b nds-bg-muted-soft">
                <TableHead class="nds-p-2 nds-font-semibold">
                  {{ uxWriting.cols.element }}
                </TableHead>
                <TableHead
                  v-if="uxWriting.cols.rules"
                  class="nds-p-2 nds-font-semibold"
                >
                  {{ uxWriting.cols.rules }}
                </TableHead>
                <TableHead class="nds-p-2 nds-font-semibold nds-text-success">
                  <span
                    class="nds-cluster"
                    data-spacing="xs"
                  >
                    <span
                      class="nds-pill"
                      data-tone="success"
                    >✓</span>
                    {{ uxWriting.cols.do }}
                  </span>
                </TableHead>
                <TableHead class="nds-p-2 nds-font-semibold nds-text-destructive">
                  <span
                    class="nds-cluster"
                    data-spacing="xs"
                  >
                    <span
                      class="nds-pill"
                      data-tone="destructive"
                    >✗</span>
                    {{ uxWriting.cols.dont }}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(row, i) in uxWriting.items"
                :key="i"
                class="nds-border-b nds-hover-bg-muted-faint"
              >
                <TableCell class="nds-p-2 nds-font-medium">
                  {{ row.element }}
                </TableCell>
                <TableCell
                  v-if="uxWriting!.cols.rules"
                  class="nds-p-2 nds-text-muted-foreground"
                >
                  {{ row.rules }}
                </TableCell>
                <TableCell class="nds-p-2 nds-font-medium nds-text-success">
                  {{ row.do }}
                </TableCell>
                <TableCell class="nds-p-2 nds-font-medium nds-text-destructive">
                  {{ row.dont }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>

      <!-- Do / Don't cards -->
      <div
        class="nds-grid"
        data-cols="2"
        data-spacing="md"
      >
        <Card class="nds-p-4 nds-card-nested">
          <h3
            class="nds-mb-4 nds-text-body nds-font-semibold nds-text-success nds-cluster"
            data-spacing="sm"
          >
            <span
              class="nds-pill"
              data-tone="success"
            >✓</span>
            {{ props.do.title }}
          </h3>
          <ul
            class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed"
            data-spacing="sm"
          >
            <li
              v-for="(item, i) in props.do.items"
              :key="i"
              v-html="DOMPurify.sanitize(item)"
            />
          </ul>
        </Card>
        <Card class="nds-p-4 nds-card-nested">
          <h3
            class="nds-mb-4 nds-text-body nds-font-semibold nds-text-destructive nds-cluster"
            data-spacing="sm"
          >
            <span
              class="nds-pill"
              data-tone="destructive"
            >✗</span>
            {{ props.dont.title }}
          </h3>
          <ul
            class="nds-list-disc nds-stack nds-text-body nds-text-muted-foreground nds-leading-relaxed"
            data-spacing="sm"
          >
            <li
              v-for="(item, i) in props.dont.items"
              :key="i"
              v-html="DOMPurify.sanitize(item)"
            />
          </ul>
        </Card>
      </div>
    </Card>
  </section>
</template>
