<script lang="ts">
  import { Badge } from '@/components/ui/badge';
  import LanguageSwitcher from '@/components/product/LanguageSwitcher.svelte';

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
    <Badge variant="secondary" class="nds-bg-primary-soft nds-text-primary nds-border-primary-soft nds-font-medium">
      {category}
    </Badge>
    <Badge variant="outline" class="nds-text-muted-foreground nds-font-normal">
      {type}
    </Badge>
    <div class="nds-spacer-start">
      <LanguageSwitcher />
    </div>
  </div>
  <div class="nds-stack" data-spacing="sm">
    <h1 class="nds-text-h1 nds-text-foreground">{title}</h1>
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
