<script lang="ts">
  import { ScrollArea } from './index';

  type Variant = 'vertical' | 'horizontal' | 'both' | 'links';

  interface Props {
    variant?: Variant;
    type?: 'auto' | 'always' | 'scroll' | 'hover';
    scrollHideDelay?: number;
    height?: string;
    width?: string;
    /** Sem teto no pai: o conteúdo expande e não há rolagem (erro de uso). */
    semAltura?: boolean;
    itemCount?: number;
    rowCount?: number;
    colCount?: number;
    tagLabel?: string;
    cardLabel?: string;
    navLabel?: string;
    class?: string;
  }

  let {
    variant = 'vertical',
    type = 'hover',
    scrollHideDelay = 600,
    height = '300px',
    width = '100%',
    semAltura = false,
    itemCount = 30,
    rowCount = 12,
    colCount = 12,
    tagLabel = 'Tag',
    cardLabel = 'Card',
    navLabel = 'Ações',
    class: className = '',
  }: Props = $props();

  const tags = $derived(Array.from({ length: itemCount }, (_, i) => i + 1));
  const cards = $derived(Array.from({ length: Math.min(itemCount, 10) }, (_, i) => i + 1));
  const rows = $derived(Array.from({ length: rowCount }, (_, i) => i + 1));
  const cols = $derived(Array.from({ length: colCount }, (_, i) => i + 1));

  // A classe do invólucro é montada aqui, e não interpolada dentro do atributo.
  // Interpolar a prop no meio da lista de classes deixava o nome dela literal no
  // markup do arquivo, e o auditor de classe morta — com razão — não tem como
  // distinguir uma interpolação de uma classe do design system que não existe.
  const wrapperClass = $derived(
    ['nds-rounded-md', 'nds-border-default', 'nds-bg-background', 'nds-overflow-hidden', className]
      .filter(Boolean)
      .join(' '),
  );

  // Sem teto o invólucro não recebe medida nenhuma — é exatamente o cenário em
  // que o ScrollArea não rola, e ele precisa existir para poder ser testado.
  const wrapperStyle = $derived(semAltura ? `width: ${width};` : `height: ${height}; width: ${width};`);
  const areaStyle = $derived(semAltura ? undefined : 'height: 100%');
</script>

{#if variant === 'vertical'}
  <div class={wrapperClass} style={wrapperStyle}>
    <ScrollArea orientation="vertical" {type} {scrollHideDelay} class="nds-w-full" style={areaStyle}>
      <div class="nds-p-4" data-spacing="sm">
        {#each tags as n (n)}
          <div class="nds-text-body nds-border-b nds-last-border-0 nds-pb-2">{tagLabel} {n}</div>
        {/each}
      </div>
    </ScrollArea>
  </div>
{:else if variant === 'horizontal'}
  <div class={wrapperClass} style={wrapperStyle}>
    <ScrollArea orientation="horizontal" {type} {scrollHideDelay} class="nds-w-full nds-whitespace-nowrap" style={areaStyle}>
      <!-- nds-row e nao nds-cluster: o cluster tem flex-wrap: wrap, entao os
           itens quebravam linha em vez de transbordar na horizontal — sem
           transbordo o bits-ui nao materializa a scrollbar horizontal. -->
      <div class="nds-row nds-p-4" data-spacing="md" style="width: max-content">
        {#each cards as n (n)}
          <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted nds-text-body">
            {cardLabel} {n}
          </div>
        {/each}
      </div>
    </ScrollArea>
  </div>
{:else if variant === 'both'}
  <div class={wrapperClass} style={wrapperStyle}>
    <ScrollArea orientation="both" {type} {scrollHideDelay} class="nds-w-full" style={areaStyle}>
      <table class="nds-border-collapse nds-text-caption" style="width: max-content">
        <tbody>
          {#each rows as r (r)}
            <tr>
              {#each cols as c (c)}
                <td class="nds-border-default nds-py-2 nds-px-2 nds-whitespace-nowrap">R{r}·C{c}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </ScrollArea>
  </div>
{:else if variant === 'links'}
  <div class={wrapperClass} style={wrapperStyle}>
    <ScrollArea orientation="vertical" {type} {scrollHideDelay} class="nds-w-full" style={areaStyle}>
      <nav aria-label={navLabel} class="nds-p-4">
        <ul class="nds-stack nds-list-none nds-p-0 nds-m-0" data-spacing="xs">
          {#each tags as n (n)}
            <li>
              <a href="#acao-{n}" class="nds-block nds-rounded-sm nds-px-2 nds-py-1 nds-text-body nds-hover-bg-muted-soft">
                {tagLabel} {n}
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    </ScrollArea>
  </div>
{/if}
