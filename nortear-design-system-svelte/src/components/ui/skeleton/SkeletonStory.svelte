<script lang="ts">
  import { Skeleton } from './index';

  // A caixa do esqueleto vem de atributo, não de classe de dimensão nem de
  // altura cravada: `data-shape` escolhe a forma e `data-width` a fração da
  // largura do container (docs/shared/styles/nds/skeleton.css).
  interface Props {
    shape?: 'text' | 'heading' | 'avatar' | 'fill';
    width?: 'full' | '3-4' | '2-3' | '1-2' | '1-3';
    loading?: boolean;
  }

  let { shape = 'text', width = '3-4', loading = true }: Props = $props();

  const larguraAplicada = $derived(shape === 'text' || shape === 'heading' ? width : undefined);
  // `fill` preenche a caixa que o container estabelece; aqui quem estabelece é
  // a proporção de mídia, senão o bloco nasce com altura zero e o Playground
  // mostra um esqueleto invisível.
  const classNameAplicada = $derived(shape === 'fill' ? 'nds-docs-skeleton-media' : undefined);
</script>

<div role="status" aria-busy={loading} aria-label="Carregando conteúdo">
  <Skeleton data-shape={shape} data-width={larguraAplicada} class={classNameAplicada} />
</div>
