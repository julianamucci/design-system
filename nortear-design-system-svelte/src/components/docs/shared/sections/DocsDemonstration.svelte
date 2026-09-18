<script lang="ts">
  import type { Snippet } from 'svelte';
  import ComponentDemo from '@/components/ComponentDemo.svelte';
  import { sectionLabels, sectionTitle } from './sectionTitle';

  /**
   * DocsDemonstration — wrapper da seção "Demonstração".
   *
   * `componentSlug` é informativo: este container não injeta `data-track*`
   * porque os elementos interativos vêm via `children` e são controlados pela
   * docs page. Consumidores devem aplicar manualmente os atributos nos triggers:
   *
   * @example
   *   <DocsDemonstration componentSlug="alert">
   *     <Button data-track="demo" data-track-id="alert:demo:save">
   *       Salvar
   *     </Button>
   *   </DocsDemonstration>
   *
   * O observer global do DocsPageLayout captura o click via `.closest('[data-track]')`.
   */
  const { children, componentSlug }: {
    children: Snippet;
    componentSlug?: string;
  } = $props();

  const title = $derived(sectionTitle('demonstracao', $sectionLabels));
</script>

<section id="demonstracao" data-track="demo" data-track-container="true" data-track-id="page:demonstracao:demo">
  <h2 class="nds-section-title">{title}</h2>
  <ComponentDemo>
    {@render children()}
  </ComponentDemo>
</section>
