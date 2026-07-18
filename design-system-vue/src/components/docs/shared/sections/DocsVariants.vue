<script setup lang="ts">
import { ref } from 'vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';

interface DocsVariantItem {
  name: string;
  description: string;
  code?: string;
}

/**
 * DocsVariants — lista de variants.
 *
 * Quando `componentSlug` é informado, o botão "Ver código / Ocultar código" de
 * cada variant recebe `data-track="code"` +
 * `data-track-id="{slug}:code:{variant.name}"` +
 * `data-track-label="Copiar código"`. Se ausente, `data-track-id` é omitido e
 * o observer ignora o click.
 */
const props = withDefaults(defineProps<{
  title: string;
  items: DocsVariantItem[];
  id?: string;
  componentSlug?: string;
}>(), {
  id: 'variantes',
});

const openStates = ref<Record<number, boolean>>({});
function toggleCode(i: number) {
  openStates.value[i] = !openStates.value[i];
}

function trackId(name: string): string | undefined {
  return props.componentSlug ? `${props.componentSlug}:code:${name}` : undefined;
}
</script>

<template>
  <section :id="props.id">
    <h2 class="nds-section-title">
      {{ title }}
    </h2>
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
            class="nds-text-body nds-text-muted-foreground nds-mt-1 nds-leading-relaxed"
            v-html="DOMPurify.sanitize(item.description)"
          />
        </div>
        <div
          class="nds-cluster"
          data-justify="center"
        >
          <slot :name="`variant-preview-${i}`" />
        </div>
        <div v-if="item.code">
          <Button
            variant="link"
            size="sm"
            class="nds-px-0"
            data-track="code"
            :data-track-id="trackId(item.name)"
            data-track-label="Copiar código"
            @click="toggleCode(i)"
          >
            {{ openStates[i] ? 'Ocultar código' : 'Ver código' }}
          </Button>
          <pre
            v-if="openStates[i]"
            class="nds-code-block nds-mt-2"
          ><code>{{ item.code }}</code></pre>
        </div>
      </Card>
    </div>
  </section>
</template>
