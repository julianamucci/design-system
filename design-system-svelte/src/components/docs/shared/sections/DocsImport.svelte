<script lang="ts">
  /**
   * DocsImport — bloco de snippet de importação.
   *
   * `componentSlug` é informativo: o snippet renderizado atualmente é apenas
   * um bloco `<code>` estático, sem botão de "copiar". Se uma futura iteração
   * adicionar o botão, ele deverá receber `data-track="code"` +
   * `data-track-id="{slug}:code:import-primary"` (ou `import-secondary`) +
   * `data-track-label="Copiar import"`.
   */
  const { title, description, code, secondaryCode, secondaryDescription, componentSlug }: {
    title: string;
    description?: string;
    code: string;
    secondaryCode?: string;
    secondaryDescription?: string;
    componentSlug?: string;
  } = $props();
</script>

<section id="importacao">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  {#if description}
    <p class="text-sm text-muted-foreground mb-3">{description}</p>
  {/if}
  <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
    <code class="whitespace-pre">{code}</code>
  </div>
  {#if secondaryCode}
    {#if secondaryDescription}
      <p class="text-sm text-muted-foreground mt-4 mb-3">{secondaryDescription}</p>
    {/if}
    <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-3">
      <code class="whitespace-pre">{secondaryCode}</code>
    </div>
  {/if}
</section>
