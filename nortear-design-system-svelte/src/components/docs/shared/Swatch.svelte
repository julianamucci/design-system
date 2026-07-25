<script lang="ts">
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

<!--
  Visual 100% via classes .nds-swatch* / .nds-miniswatch* (docs-swatches.css);
  o único estilo dinâmico é a custom property de cor por token (via style:).
-->
{#if orientation === 'vertical'}
  <div class="nds-miniswatch">
    <span
      class="nds-miniswatch-chip"
      style:--swatch-color={`var(--${token})`}
      aria-hidden="true"
    ></span>
    <span class="nds-miniswatch-name">{token}</span>
  </div>
{:else}
  <button
    type="button"
    onclick={handleCopy}
    aria-label={`${copyLabel} --${token}`}
    class="nds-swatch"
  >
    <span
      class="nds-swatch-color"
      style:--swatch-color={`var(--${token})`}
      aria-hidden="true"
    ></span>
    <div class="nds-swatch-meta">
      <span class="nds-swatch-token">--{token}</span>
      <span class="nds-swatch-value">{value || '—'}</span>
    </div>
    <span
      class="nds-icon-tile-tooltip"
      style:opacity={copied ? '1' : undefined}
      aria-hidden="true"
    >
      {copied ? copiedLabel : copyLabel}
    </span>
  </button>
{/if}
