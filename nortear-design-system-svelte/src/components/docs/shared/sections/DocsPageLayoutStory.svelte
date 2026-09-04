<script lang="ts">
  import DocsPageLayout from './DocsPageLayout.svelte';
  import DocsHeader from './DocsHeader.svelte';
  import DocsStates from './DocsStates.svelte';
  import type { DocsNavGroup } from '../DocsNav.svelte';

  /**
   * Story companheira. `header` e `children` são `Snippet`, e snippet não se
   * passa como arg de um `.stories.ts` — é sintaxe de template, não valor.
   * Mesmo padrão do `DocsVariantsStory.svelte`.
   */
  let { navGroups, activeSection = '', componentSlug = '' }: {
    navGroups: DocsNavGroup[];
    activeSection?: string;
    componentSlug?: string;
  } = $props();
</script>

{#snippet header()}
  <DocsHeader
    title="Button"
    description="Aciona uma ação. É o controle mais usado do design system."
    category="Formulário"
    type="Primitivo"
  />
{/snippet}

<DocsPageLayout {navGroups} {activeSection} {componentSlug} {header}>
  <DocsStates
    title="Estados"
    cols={{ state: 'Estado', trigger: 'Gatilho', behavior: 'Comportamento' }}
    items={[
      { label: 'Padrão', trigger: 'Nenhum', behavior: 'Fundo --primary.' },
      { label: 'Foco', trigger: ':focus-visible', behavior: 'Anel de 2px em --ring.' },
    ]}
  />
</DocsPageLayout>
