<script lang="ts">
  import { Check } from 'lucide-svelte';

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
      class="h-8 w-8 rounded-md border border-border/50"
      style="background-color: hsl(var(--{token}))"
      aria-hidden="true"
    ></span>
    <span class="text-[10px] text-muted-foreground font-mono">{token}</span>
  </div>
{:else}
  <button
    type="button"
    onclick={handleCopy}
    aria-label={`${copyLabel} --${token}`}
    class="group relative w-full flex items-center gap-3 p-2 rounded-lg border border-border/50 hover:border-border hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors text-left"
  >
    <span
      class="h-10 w-10 shrink-0 rounded-md border border-border/50"
      style="background-color: hsl(var(--{token}))"
      aria-hidden="true"
    ></span>
    <span class="flex flex-col min-w-0">
      <span class="text-xs font-mono text-foreground truncate">--{token}</span>
      <span class="text-[10px] font-mono text-muted-foreground truncate">{value || '—'}</span>
    </span>
    <span
      class="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-[10px] text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
      aria-hidden="true"
    >
      {#if copied}<Check class="h-3 w-3" aria-hidden="true" />{/if}
      {copied ? copiedLabel : copyLabel}
    </span>
  </button>
{/if}
