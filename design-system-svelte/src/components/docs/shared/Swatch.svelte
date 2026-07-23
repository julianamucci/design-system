<script lang="ts">
  import Check from '@lucide/svelte/icons/check';

  interface Props {
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
  }

  let {
    token,
    orientation = 'vertical',
    value = '',
    copyLabel = '',
    copiedLabel = '',
  }: Props = $props();

  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function handleCopy() {
    navigator.clipboard
      .writeText(`--${token}`)
      .then(() => {
        if (timer) clearTimeout(timer);
        copied = true;
        timer = setTimeout(() => { copied = false; }, 1500);
      })
      .catch(() => {});
  }
</script>

{#if orientation === 'vertical'}
  <div class="flex flex-col items-center gap-1">
    <span
      class="h-8 w-8 rounded-md border nds-border-soft"
      style="background-color: hsl(var(--{token}))"
      aria-hidden="true"
    ></span>
    <span class="nds-text-2xs text-muted-foreground font-mono">{token}</span>
  </div>
{:else}
  <button
    type="button"
    onclick={handleCopy}
    aria-label={`${copyLabel} --${token}`}
    class="group relative w-full flex items-center gap-3 p-2 rounded-lg border nds-border-soft nds-hover-border nds-hover-bg-muted-40 nds-focus-ring nds-transition-colors text-left"
  >
    <span
      class="h-10 w-10 shrink-0 rounded-md border nds-border-soft"
      style="background-color: hsl(var(--{token}))"
      aria-hidden="true"
    ></span>
    <span class="flex flex-col min-w-0">
      <span class="text-xs font-mono text-foreground truncate">--{token}</span>
      <span class="nds-text-2xs font-mono text-muted-foreground truncate">{value || '—'}</span>
    </span>
    <span
      class="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 nds-text-2xs text-white z-10 nds-opacity-0 group-hover:opacity-100 nds-transition-opacity inline-flex items-center gap-1"
      aria-hidden="true"
    >
      {#if copied}<Check class="h-3 w-3" aria-hidden="true" />{/if}
      {copied ? copiedLabel : copyLabel}
    </span>
  </button>
{/if}
