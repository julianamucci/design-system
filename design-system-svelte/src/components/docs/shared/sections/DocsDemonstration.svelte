<script lang="ts">
  import type { Snippet } from 'svelte';
  import ComponentDemo from '@/components/ComponentDemo.svelte';

  /**
   * DocsDemonstration — wrapper da seção "Demonstração".
   *
   * `componentSlug` é informativo: este container não injeta `data-track*`
   * porque os elementos interativos vêm via `children` e são controlados pela
   * docs page. Consumidores devem aplicar manualmente os atributos nos triggers:
   *
   * @example
   *   <DocsDemonstration title="..." componentSlug="alert">
   *     <Button data-track="demo" data-track-id="alert:demo:save" data-track-label="Salvar">
   *       Salvar
   *     </Button>
   *   </DocsDemonstration>
   *
   * O observer global do DocsPageLayout captura o click via `.closest('[data-track]')`.
   */
  const { title, children, componentSlug }: {
    title: string;
    children: Snippet;
    componentSlug?: string;
  } = $props();
</script>

<section id="demonstracao">
  <h2 class="text-xl font-semibold mb-4">{title}</h2>
  <ComponentDemo>
    {@render children()}
  </ComponentDemo>
</section>
