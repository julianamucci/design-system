<script module lang="ts">
  /**
   * A forma do menu vem de `@shared/primitives/docs-nav`, e é a mesma nas cinco
   * stacks. Reexportada daqui para quem já importava deste arquivo não mudar.
   *
   * O bloco tem de ser `module`, e isso custou uma rodada: o `<script>` de
   * instância SURFACE um `export interface` — era assim que o tipo saía daqui
   * antes —, mas NÃO surface um `export type { … } from`. Reexportação precisa
   * de escopo de módulo de verdade.
   */
  export type { DocsNavSection, DocsNavGroup } from '@shared/primitives/docs-nav';
</script>

<script lang="ts">
  import { deriveSlugFromUrl } from '@/lib/docs-tracking';
  import type { DocsNavGroup } from '@shared/primitives/docs-nav';

  interface Props {
    groups: DocsNavGroup[];
    activeSection?: string;
    /** Slug do componente — usado no data-track-id (ex: "alert" → `alert:nav:anatomia`). */
    componentSlug?: string;
  }

  const { groups, activeSection, componentSlug }: Props = $props();

  /**
   * `componentSlug` é opcional por contrato: quando a página não o passa, o
   * observer (`mountDocsTracking`) deriva o slug do `?id=` do iframe. O nav usa
   * a MESMA derivação para nunca emitir `data-track-id` ausente — sem ele o
   * `docs_nav_click` sairia com `section_id` vazio nas páginas que omitem o slug.
   */
  const slug = $derived(componentSlug ?? deriveSlugFromUrl());

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
              data-track-id={`${slug}:nav:${section.id}`}
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
