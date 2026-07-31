<script setup lang="ts">
/**
 * DocsImport — bloco de snippet de importação.
 *
 * Quando `componentSlug` é informado, a raiz de cada CodeBlock recebe
 * `data-track="code"` + `data-track-id="{slug}:code:import-primary"` (ou
 * `import-secondary`) + `data-track-label="Copiar import"`. A guarda do
 * observer garante que só o clique no botão de copiar conta como
 * `docs_code_copy`. Se ausente, `data-track-id` é omitido e o observer
 * ignora o click.
 */
import { CodeBlock } from '@/components/ui/code-block';

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
  componentSlug?: string;
  /** Linguagem dos snippets, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}>(), {
  language: 'vue',
});

function trackId(kind: 'import-primary' | 'import-secondary'): string | undefined {
  return props.componentSlug ? `${props.componentSlug}:code:${kind}` : undefined;
}
</script>

<template>
  <section id="importacao">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="nds-text-body nds-mb-4"
    >
      {{ description }}
    </p>
    <CodeBlock
      :code="code"
      :language="language"
      :show-line-numbers="false"
      :copy-label="copyLabel"
      :copied-label="copiedLabel"
      data-track="code"
      :data-track-id="trackId('import-primary')"
      data-track-label="Copiar import"
    />
    <template v-if="secondaryCode">
      <p
        v-if="secondaryDescription"
        class="nds-text-body nds-mt-4 nds-mb-4"
      >
        {{ secondaryDescription }}
      </p>
      <CodeBlock
        class="nds-mt-2"
        :code="secondaryCode"
        :language="language"
        :show-line-numbers="false"
        :copy-label="copyLabel"
        :copied-label="copiedLabel"
        data-track="code"
        :data-track-id="trackId('import-secondary')"
        data-track-label="Copiar import"
      />
    </template>
  </section>
</template>
