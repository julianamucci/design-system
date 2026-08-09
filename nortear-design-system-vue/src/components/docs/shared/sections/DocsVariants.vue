<script setup lang="ts">
import { ref } from 'vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/ui/code-block';
import DOMPurify from 'dompurify';

interface DocsVariantItem {
  name: string;
  description: string;
  code?: string;
  /**
   * Chave estável do evento de tracking. Sem ela, cai em `name` — que em seções
   * como Composições é texto traduzido, e faria o mesmo evento sair com um id
   * por idioma.
   */
  trackId?: string;
}

/**
 * DocsVariants — lista de variants.
 *
 * Quando `componentSlug` é informado, o botão "Ver código / Ocultar código" de
 * cada variant recebe `data-track="code"` +
 * `data-track-id="{slug}:code:{variant.trackId ?? variant.name}"` +
 * `data-track-label="Copiar código"`. Se ausente, `data-track-id` é omitido e
 * o observer ignora o click.
 */
const props = withDefaults(defineProps<{
  title: string;
  items: DocsVariantItem[];
  id?: string;
  /** Nota introdutória da seção (HTML inline permitido). */
  note?: string;
  componentSlug?: string;
  /** Linguagem dos snippets de código, repassada ao CodeBlock. */
  language?: string;
  copyLabel?: string;
  copiedLabel?: string;
}>(), {
  id: 'variantes',
  language: 'vue',
});

const openStates = ref<Record<number, boolean>>({});
function toggleCode(i: number) {
  openStates.value[i] = !openStates.value[i];
}

function trackId(item: DocsVariantItem): string | undefined {
  return props.componentSlug
    ? `${props.componentSlug}:code:${item.trackId ?? item.name}`
    : undefined;
}
</script>

<template>
  <section :id="props.id">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
    <p
      v-if="props.note"
      class="nds-text-body nds-text-muted-foreground nds-mt-1 nds-mb-4 nds-leading-relaxed"
      v-html="DOMPurify.sanitize(props.note)"
    />
    <div
      class="nds-stack"
      data-spacing="md"
    >
      <Card
        v-for="(item, i) in items"
        :key="i"
        class="nds-p-4"
      >
        <div>
          <p class="nds-text-body nds-font-semibold nds-m-0">
            {{ item.name }}
          </p>
          <p
            class="nds-text-body nds-mt-1 nds-leading-relaxed"
            v-html="DOMPurify.sanitize(item.description)"
          />
        </div>
        <div
          class="nds-cluster"
          data-justify="center"
          data-docs-preview="variante"
        >
          <slot :name="`variant-preview-${i}`" />
        </div>
        <div v-if="item.code">
          <Button
            variant="link"
            size="sm"
            class="nds-px-0"
            data-track="code"
            :data-track-id="trackId(item)"
            data-track-label="Copiar código"
            @click="toggleCode(i)"
          >
            {{ openStates[i] ? 'Ocultar código' : 'Ver código' }}
          </Button>
          <CodeBlock
            v-if="openStates[i]"
            class="nds-mt-2"
            :code="item.code"
            :language="props.language"
            :show-line-numbers="false"
            :copy-label="props.copyLabel"
            :copied-label="props.copiedLabel"
          />
        </div>
      </Card>
    </div>
  </section>
</template>
