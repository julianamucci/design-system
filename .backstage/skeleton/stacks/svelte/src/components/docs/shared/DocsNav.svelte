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
  }

  const { groups, activeSection }: Props = $props();

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<div class="space-y-6">
  {#each groups as group (group.label)}
    <div>
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
        {group.label}
      </p>
      <ul class="list-none space-y-1 p-0 m-0">
        {#each group.sections as section (section.id)}
          <li class="list-none">
            <button
              type="button"
              aria-current={activeSection === section.id ? 'location' : undefined}
              class={[
                'w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeSection === section.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              ].join(' ')}
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
