<script lang="ts">
  import type { Snippet } from 'svelte';
  import DocsNav, { type DocsNavGroup } from '../DocsNav.svelte';
  import { mountDocsTracking } from '@/lib/docs-tracking';

  interface Props {
    navGroups: DocsNavGroup[];
    activeSection?: string;
    header?: Snippet;
    children?: Snippet;
    /** Slug do componente — habilita tracking automático via data-track*. */
    componentSlug?: string;
  }

  const { navGroups, activeSection, header, children, componentSlug }: Props = $props();

  let rootEl: HTMLElement | null = $state(null);

  $effect(() => {
    if (!componentSlug || !rootEl) return;
    return mountDocsTracking(rootEl, { componentSlug });
  });
</script>

<!-- sb-unstyled: escape hatch oficial do Storybook que desliga as regras
     prose do @storybook/blocks na subárvore. Ver storybook-docs.css. -->
<div bind:this={rootEl} class="sb-unstyled ds-docs p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
  {@render header?.()}

  <div class="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
    <nav
      aria-label="Navegação das seções do componente"
      class="w-full lg:sticky lg:top-8 lg:w-52 lg:shrink-0 self-start space-y-5"
    >
      <DocsNav groups={navGroups} {activeSection} {componentSlug} />
    </nav>

    <div class="ds-docs flex-1 min-w-0 w-full space-y-12">
      {@render children?.()}
    </div>
  </div>
</div>
