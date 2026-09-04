<script lang="ts">
/**
 * Bloco `<script>` comum, ao lado do `setup`, só para reexportar o id: em
 * `<script setup>` tudo é escopo de componente e nada sai como export nomeado.
 * Era por isso que esta stack repetia a string crua em cinco lugares — não por
 * limitação do Vue, mas por faltar este bloco.
 */
export { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';
</script>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';
import { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';

defineProps<{
  title: string;
  description: string;
  category: string;
  type: string;
  installNote?: string;
}>();
</script>

<template>
  <header
    class="ds-docs nds-stack nds-border-b-soft"
    data-spacing="md"
    style="padding-bottom: var(--spacing-6)"
  >
    <div
      class="nds-cluster"
      data-spacing="sm"
    >
      <Badge
        variant="info"
        class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium"
      >
        {{ category }}
      </Badge>
      <Badge
        variant="info"
        class="nds-text-muted-foreground nds-font-normal"
      >
        {{ type }}
      </Badge>
      <div class="nds-spacer-start">
        <LanguageSwitcher />
      </div>
    </div>
    <div
      class="nds-stack"
      data-spacing="sm"
    >
      <!-- id estável: o <main> do DocsPageLayout aponta para cá via
           aria-labelledby, então o leitor anuncia "principal, <título>". -->
      <h1
        :id="DOCS_PAGE_TITLE_ID"
        class="nds-text-h1 nds-text-foreground"
      >
        {{ title }}
      </h1>
      <p class="nds-text-lead nds-text-muted-foreground nds-max-w-prose">
        {{ description }}
      </p>
    </div>
    <div
      v-if="installNote"
      class="nds-cluster nds-text-body nds-text-muted-foreground"
      data-spacing="sm"
    >
      <span
        class="nds-cluster"
        data-spacing="xs"
      >
        <code class="nds-code-inline">{{ installNote }}</code>
      </span>
    </div>
  </header>
</template>
