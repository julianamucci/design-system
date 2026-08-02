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

  /**
   * Rola até a seção *e* move o foco para ela. Sem o focus() o cursor de
   * leitura do leitor de tela fica no botão do menu: a leitura não continua a
   * partir do título da seção e o Tab seguinte volta para o próximo item do
   * menu. `preventScroll` deixa a rolagem suave acontecer enquanto o foco já
   * se move; o tabindex="-1" é aplicado no clique para não sujar o HTML das
   * seções e não entra na ordem de tabulação.
   */
  function goToSection(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
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
              onclick={() => goToSection(section.id)}
            >
              {section.label}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</div>
