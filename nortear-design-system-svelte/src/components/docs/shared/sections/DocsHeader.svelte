<script module lang="ts">
  /**
   * Bloco `module`, ao lado do de instância, só para reexportar o id: o
   * `<script>` normal é escopo de componente e nada sai dele como export
   * nomeado. Era por isso que esta stack repetia a string crua em cinco
   * lugares — não por limitação do Svelte, mas por faltar este bloco.
   */
  export { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';
</script>

<script lang="ts">
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';
  import { DOCS_PAGE_TITLE_ID } from '@shared/primitives/docs-page-landmarks';

  const { title, description, category, type, installNote }: {
    title: string;
    description: string;
    category: string;
    type: string;
    installNote?: string;
  } = $props();
</script>

<header class="ds-docs nds-stack nds-border-b-soft" data-spacing="md" style="padding-bottom: var(--spacing-6)">
  <div class="nds-cluster" data-spacing="sm">
    <Badge variant="info" class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium">
      {category}
    </Badge>
    <Badge variant="info" class="nds-text-muted-foreground nds-font-normal">
      {type}
    </Badge>
    <div class="nds-spacer-start">
      <LanguageSwitcher />
    </div>
  </div>
  <div class="nds-stack" data-spacing="sm">
    <!-- id estável: alvo do aria-labelledby do <main> em DocsPageLayout.
         A docs page é única por iframe, então não há colisão. -->
    <h1 id={DOCS_PAGE_TITLE_ID} class="nds-text-h1 nds-text-foreground">{title}</h1>
    <p class="nds-text-lead nds-text-muted-foreground nds-max-w-prose">{description}</p>
  </div>
  {#if installNote}
    <div class="nds-cluster nds-text-body nds-text-muted-foreground" data-spacing="sm">
      <span class="nds-cluster" data-spacing="xs">
        <code class="nds-code-inline">{installNote}</code>
      </span>
    </div>
  {/if}
</header>
