<script lang="ts">
  /**
   * DocsImport — bloco de snippet de importação.
   *
   * Quando `componentSlug` é informado, a raiz de cada CodeBlock recebe
   * `data-track="code"` + `data-track-id="{slug}:code:import-primary"` (ou
   * `import-secondary`) + `data-track-label="Copiar import"`. A guarda do
   * observer em `docs-tracking.ts` garante que só o clique no botão de copiar
   * conta como `docs_code_copy`.
   */
  import { CodeBlock } from '@/components/ui/code-block';

  const { title, description, code, secondaryCode, secondaryDescription, componentSlug, language = 'svelte', copyLabel, copiedLabel }: {
    title: string;
    description?: string;
    code: string;
    secondaryCode?: string;
    secondaryDescription?: string;
    componentSlug?: string;
    language?: string;
    copyLabel?: string;
    copiedLabel?: string;
  } = $props();
</script>

<section id="importacao">
  <h2 class="nds-section-title">{title}</h2>
  {#if description}
    <p class="nds-text-body nds-mb-4">{description}</p>
  {/if}
  <CodeBlock
    {code}
    {language}
    showLineNumbers={false}
    {copyLabel}
    {copiedLabel}
    data-track={componentSlug ? 'code' : undefined}
    data-track-id={componentSlug ? `${componentSlug}:code:import-primary` : undefined}
    data-track-label={componentSlug ? 'Copiar import' : undefined}
  />
  {#if secondaryCode}
    {#if secondaryDescription}
      <p class="nds-text-body nds-mt-4 nds-mb-4">{secondaryDescription}</p>
    {/if}
    <CodeBlock
      class="nds-mt-2"
      code={secondaryCode}
      {language}
      showLineNumbers={false}
      {copyLabel}
      {copiedLabel}
      data-track={componentSlug ? 'code' : undefined}
      data-track-id={componentSlug ? `${componentSlug}:code:import-secondary` : undefined}
      data-track-label={componentSlug ? 'Copiar import' : undefined}
    />
  {/if}
</section>
