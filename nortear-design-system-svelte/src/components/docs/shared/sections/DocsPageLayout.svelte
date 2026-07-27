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
    if (!rootEl) return;
    // slug omitido → derivado do ?id= do iframe (mountDocsTracking)
    return mountDocsTracking(rootEl, { componentSlug });
  });
</script>

<!-- sb-unstyled: escape hatch oficial do Storybook que desliga as regras
     prose do @storybook/blocks na subárvore. Ver storybook-docs.css. -->
<div bind:this={rootEl} class="sb-unstyled ds-docs nds-page" data-width="wide">
  {@render header?.()}

  <div class="nds-sidebar-layout" data-sidebar-sticky="true">
    <nav
      aria-label="Navegação das seções do componente"
      class="nds-stack"
      data-spacing="md"
    >
      <DocsNav groups={navGroups} {activeSection} {componentSlug} />
    </nav>

    <div class="ds-docs nds-stack" data-spacing="2xl">
      {@render children?.()}
    </div>
  </div>
</div>
