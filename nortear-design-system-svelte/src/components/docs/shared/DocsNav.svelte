<script lang="ts">
  export interface DocsNavSection {
    id: string;
    label: string;
  }

  export interface DocsNavGroup {
    label: string;
    sections: DocsNavSection[];
  }

  interface Props {
    groups: DocsNavGroup[];
    activeSection?: string;
    /** Slug do componente — usado no data-track-id (ex: "alert" → `alert:nav:anatomia`). */
    componentSlug?: string;
  }

  const { groups, activeSection, componentSlug }: Props = $props();

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="nds-docs-nav">
  {#each groups as group (group.label)}
    <div class="nds-docs-nav-group">
      <p class="nds-docs-nav-label">{group.label}</p>
      <ul class="nds-docs-nav-list">
        {#each group.sections as section (section.id)}
          <li>
            <button
              type="button"
              class="nds-docs-nav-button"
              aria-current={activeSection === section.id ? 'location' : undefined}
              data-track="nav"
              data-track-id={componentSlug ? `${componentSlug}:nav:${section.id}` : undefined}
              data-track-label={section.label}
              onclick={() => scrollTo(section.id)}
            >
              {section.label}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>
