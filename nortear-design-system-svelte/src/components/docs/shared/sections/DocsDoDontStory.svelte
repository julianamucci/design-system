<script lang="ts">
  import DocsDoDont from './DocsDoDont.svelte';
  import { Button } from '@/components/ui/button';

  /**
   * Story companheira. `doPreview` e `dontPreview` são `Snippet`, e snippet não
   * se passa como arg de um `.stories.ts` — é sintaxe de template, não valor.
   * Mesmo padrão do `DocsVariantsStory.svelte`.
   */
  let { title, umParSo = false }: { title: string; umParSo?: boolean } = $props();
</script>

{#snippet rotuloBom()}<Button>Salvar alterações</Button>{/snippet}
{#snippet rotuloRuim()}<Button>Clique aqui</Button>{/snippet}
{#snippet parBom()}
  <span class="nds-cluster" data-spacing="md">
    <Button variant="outline">Cancelar</Button>
    <Button>Confirmar</Button>
  </span>
{/snippet}
{#snippet parRuim()}
  <span class="nds-cluster" data-spacing="md">
    <Button>Salvar</Button>
    <Button>Enviar</Button>
  </span>
{/snippet}

<DocsDoDont
  {title}
  pairs={umParSo
    ? [
        {
          doLabel: 'Faça',
          dontLabel: 'Evite',
          doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
          dontCaption: '"Clique aqui" não diz o que acontece.',
          doPreview: rotuloBom,
          dontPreview: rotuloRuim,
        },
      ]
    : [
        {
          doLabel: 'Faça',
          dontLabel: 'Evite',
          doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
          dontCaption: '"Clique aqui" não diz o que acontece, e o leitor de tela anuncia só isso.',
          doPreview: rotuloBom,
          dontPreview: rotuloRuim,
        },
        {
          doLabel: 'Faça',
          dontLabel: 'Evite',
          doCaption: 'Uma primária por bloco, com a secundária em outline à esquerda.',
          dontCaption: 'Duas primárias competem, e a pessoa para para escolher.',
          doPreview: parBom,
          dontPreview: parRuim,
        },
      ]}
/>
