<script setup lang="ts">
import { ref } from 'vue';
import { Check } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    /** Nome do token CSS sem o prefixo `--`. */
    token: string;
    /**
     * `vertical` — chip com o nome do token abaixo (mini-swatch de demonstração).
     * `horizontal` — chip + `--token` + valor HSL, clicável para copiar.
     */
    orientation?: 'vertical' | 'horizontal';
    /** Valor HSL resolvido (apenas `horizontal`). */
    value?: string;
    /** Rótulo do tooltip de cópia (apenas `horizontal`). */
    copyLabel?: string;
    /** Rótulo do tooltip após copiar (apenas `horizontal`). */
    copiedLabel?: string;
  }>(),
  { orientation: 'vertical', value: '', copyLabel: '', copiedLabel: '' },
);

const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

function handleCopy(token: string) {
  navigator.clipboard
    .writeText(`--${token}`)
    .then(() => {
      if (timer) clearTimeout(timer);
      copied.value = true;
      timer = setTimeout(() => { copied.value = false; }, 1500);
    })
    .catch(() => {});
}
</script>

<template>
  <div
    v-if="orientation === 'vertical'"
    class="flex flex-col items-center gap-1"
  >
    <span
      class="h-8 w-8 rounded-md border nds-border-soft"
      :style="{ backgroundColor: `hsl(var(--${token}))` }"
      aria-hidden="true"
    />
    <span class="nds-text-2xs text-muted-foreground font-mono">{{ token }}</span>
  </div>

  <button
    v-else
    type="button"
    :aria-label="`${copyLabel} --${token}`"
    class="group relative w-full flex items-center gap-3 p-2 rounded-lg border nds-border-soft nds-hover-border nds-hover-bg-muted-40 nds-focus-ring nds-transition-colors text-left"
    @click="handleCopy(token)"
  >
    <span
      class="h-10 w-10 shrink-0 rounded-md border nds-border-soft"
      :style="{ backgroundColor: `hsl(var(--${token}))` }"
      aria-hidden="true"
    />
    <span class="flex flex-col min-w-0">
      <span class="text-xs font-mono text-foreground truncate">--{{ token }}</span>
      <span class="nds-text-2xs font-mono text-muted-foreground truncate">{{ value || '—' }}</span>
    </span>
    <span
      class="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 nds-text-2xs text-white z-10 nds-opacity-0 group-hover:opacity-100 nds-transition-opacity inline-flex items-center gap-1"
      aria-hidden="true"
    >
      <Check
        v-if="copied"
        class="h-3 w-3"
        aria-hidden="true"
      />
      {{ copied ? copiedLabel : copyLabel }}
    </span>
  </button>
</template>
