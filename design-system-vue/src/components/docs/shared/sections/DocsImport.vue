<script setup lang="ts">
/**
 * DocsImport — bloco de snippet de importação.
 *
 * `componentSlug` é informativo: o snippet renderizado atualmente é apenas um
 * bloco `<code>` estático, sem botão de "copiar". Se uma futura iteração
 * adicionar o botão, ele deverá receber `data-track="code"` +
 * `data-track-id="{slug}:code:import-primary"` (ou `import-secondary`) +
 * `data-track-label="Copiar import"`.
 */
import { Card } from '@/components/ui/card';

defineProps<{
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
  componentSlug?: string;
}>();
</script>

<template>
  <section id="importacao">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="nds-text-body nds-text-muted-foreground nds-mb-4"
    >
      {{ description }}
    </p>
    <Card class="nds-code-block nds-shadow-none">
      <code class="nds-whitespace-pre">{{ code }}</code>
    </Card>
    <template v-if="secondaryCode">
      <p
        v-if="secondaryDescription"
        class="nds-text-body nds-text-muted-foreground nds-mt-4 nds-mb-4"
      >
        {{ secondaryDescription }}
      </p>
      <Card class="nds-code-block nds-mt-2 nds-shadow-none">
        <code class="nds-whitespace-pre">{{ secondaryCode }}</code>
      </Card>
    </template>
  </section>
</template>
