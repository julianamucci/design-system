<script lang="ts">
  const { title, description, code, secondaryCode, secondaryDescription }: {
    title: string;
    description?: string;
    code: string;
    secondaryCode?: string;
    secondaryDescription?: string;
  } = $props();
</script>

<section id="importacao">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  {#if description}
    <p class="text-sm text-muted-foreground mb-3">{description}</p>
  {/if}
  <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
    <code class="whitespace-pre">{code}</code>
  </div>
  {#if secondaryCode}
    {#if secondaryDescription}
      <p class="text-sm text-muted-foreground mt-4 mb-3">{secondaryDescription}</p>
    {/if}
    <div class="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-3">
      <code class="whitespace-pre">{secondaryCode}</code>
    </div>
  {/if}
</section>
