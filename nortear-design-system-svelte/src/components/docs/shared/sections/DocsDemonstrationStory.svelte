<script lang="ts">
  import DocsDemonstration from './DocsDemonstration.svelte';
  import { Button } from '@/components/ui/button';

  /**
   * Story companheira. Existe porque `children` é um `Snippet`, e snippet não
   * se passa como arg de um arquivo `.stories.ts` — é sintaxe de template, não
   * valor. É o mesmo padrão do `AspectRatioStory.svelte`.
   */
  let { componentSlug = '', rastreado = false }: {
    componentSlug?: string;
    rastreado?: boolean;
  } = $props();
</script>

<DocsDemonstration {componentSlug}>
  {#if rastreado}
    <Button data-track="demo" data-track-id="button:demo:salvar">
      Salvar
    </Button>
  {:else}
    <Button>Salvar</Button>
  {/if}
</DocsDemonstration>
