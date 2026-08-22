<script lang="ts">
  // Só o andaime da story QA/Larguras: uma moldura com respiro e uma caixa por
  // classe da família. A moldura é o que dá ao teto percentual algo contra o
  // que resolver — ver o comentário da story.
  const LARGURAS = [
    'nds-w-3xs', 'nds-w-2xs', 'nds-w-xs', 'nds-w-sm', 'nds-w-md',
    'nds-w-lg', 'nds-w-xl', 'nds-w-prose', 'nds-w-content', 'nds-w-docs',
  ];
</script>

<div data-moldura class="nds-p-4 nds-border-default nds-rounded-lg">
  <div class="nds-stack" data-spacing="sm">
    {#each LARGURAS as classe (classe)}
      <div class="{classe} nds-p-2 nds-bg-muted nds-text-caption">{classe}</div>
    {/each}
  </div>
</div>
