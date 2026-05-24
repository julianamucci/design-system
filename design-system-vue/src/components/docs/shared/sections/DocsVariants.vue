<script setup lang="ts">
import { ref } from 'vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/sanitize-html';

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
    <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
    <div class="space-y-4">
      <Card v-for="(item, i) in items" :key="i" class="p-4 gap-2">
        <div>
          <p class="text-sm font-semibold">{{ item.name }}</p>
          <p
            class="text-xs text-muted-foreground mt-0.5 leading-relaxed"
            v-html="sanitizeHtml(item.description)"
          />
        </div>
        <div class="flex items-center justify-center">
          <slot :name="`variant-preview-${i}`" />
        </div>
        <div v-if="item.code">
          <Button
            variant="link"
            size="sm"
            class="px-0 h-auto"
            data-track="code"
            :data-track-id="trackId(item.name)"
            data-track-label="Copiar código"
            @click="toggleCode(i)"
          >
            {{ openStates[i] ? 'Ocultar código' : 'Ver código' }}
          </Button>
          <Card v-if="openStates[i]" class="bg-muted p-4 font-mono text-sm overflow-x-auto shadow-none mt-2">
            <code class="whitespace-pre">{{ item.code }}</code>
          </Card>
        </div>
      </Card>
    </div>
  </section>
</template>
