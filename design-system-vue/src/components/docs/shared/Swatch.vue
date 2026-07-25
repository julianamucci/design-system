<script setup lang="ts">
import { ref } from 'vue';

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

<!--
  Visual 100% via classes .nds-swatch* / .nds-miniswatch* (docs-swatches.css);
  o único estilo dinâmico é a custom property --swatch-color por token.
-->
<template>
  <div
    v-if="orientation === 'vertical'"
    class="nds-miniswatch"
  >
    <span
      class="nds-miniswatch-chip"
      :style="{ '--swatch-color': `var(--${token})` }"
      aria-hidden="true"
    />
    <span class="nds-miniswatch-name">{{ token }}</span>
  </div>

  <button
    v-else
    type="button"
    :aria-label="`${copyLabel} --${token}`"
    class="nds-swatch"
    @click="handleCopy(token)"
  >
    <span
      class="nds-swatch-color"
      :style="{ '--swatch-color': `var(--${token})` }"
      aria-hidden="true"
    />
    <div class="nds-swatch-meta">
      <span class="nds-swatch-token">--{{ token }}</span>
      <span class="nds-swatch-value">{{ value || '—' }}</span>
    </div>
    <span
      class="nds-icon-tile-tooltip"
      :style="copied ? { opacity: 1 } : undefined"
      aria-hidden="true"
    >
      {{ copied ? copiedLabel : copyLabel }}
    </span>
  </button>
</template>
