<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/product/LanguageSwitcher.vue';

defineProps<{
  title: string;
  description: string;
  category: string;
  type: string;
  installNote?: string;
}>();
</script>

<template>
  <header class="ds-docs mb-12 border-b pb-8 border-border/50">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Badge variant="secondary" class="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0">
          {{ category }}
        </Badge>
        <Badge variant="outline" class="text-muted-foreground font-normal px-2 py-0">
          {{ type }}
        </Badge>
      </div>
      <LanguageSwitcher />
    </div>
    <div class="space-y-4">
      <h1 class="text-4xl font-bold tracking-tight text-foreground">{{ title }}</h1>
      <p class="text-muted-foreground text-lg max-w-3xl leading-relaxed">{{ description }}</p>
    </div>
    <div v-if="installNote" class="mt-6 flex items-center gap-3 text-sm text-muted-foreground/80">
      <span class="flex items-center gap-1.5">
        <code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">{{ installNote }}</code>
      </span>
    </div>
  </header>
</template>
