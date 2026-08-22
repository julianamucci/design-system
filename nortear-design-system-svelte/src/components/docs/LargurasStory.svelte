<script lang="ts">
  // Só o andaime da story QA/Larguras: uma caixa por classe da família.
  const LARGURAS = [
    'nds-w-3xs', 'nds-w-2xs', 'nds-w-xs', 'nds-w-sm', 'nds-w-md',
    'nds-w-lg', 'nds-w-xl', 'nds-w-prose', 'nds-w-content', 'nds-w-docs',
  ];
</script>

<div class="nds-stack" data-spacing="sm">
  {#each LARGURAS as classe (classe)}
    <div class="{classe} nds-p-2 nds-bg-muted nds-text-caption">{classe}</div>
  {/each}
</div>
