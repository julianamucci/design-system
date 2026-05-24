<script lang="ts">
  import type { Snippet } from 'svelte';
  import DocsVariants from './DocsVariants.svelte';

  interface DocsCompositionItem {
    name: string;
    description: string;
    /** Situação de uso recomendada — renderizada após "Quando usar:" abaixo da descrição. */
    useWhen?: string;
    code?: string;
    preview: Snippet;
  }

  /**
   * Seção "Composições" — combinações canônicas do componente
   * (ícone + label, par de ações, icon-only, etc.).
   *
   * Por baixo usa DocsVariants — layout idêntico ao de Variantes/Tamanhos.
   */
  const {
    title,
    items,
    useWhenLabel = 'Quando usar:',
    componentSlug,
    id = 'composicoes',
  }: {
    title: string;
    items: DocsCompositionItem[];
    useWhenLabel?: string;
    componentSlug?: string;
    id?: string;
  } = $props();

  // Transforma cada item adicionando o useWhen ao description (HTML).
  const variantItems = $derived(
    items.map(item => {
      if (!item.useWhen) return item;
      return {
        ...item,
        description:
          `${item.description}<br><br><strong>${useWhenLabel}</strong> ${item.useWhen}`,
      };
    }),
  );
</script>

<DocsVariants {id} {title} items={variantItems} {componentSlug} />
