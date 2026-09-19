<script lang="ts">
  import DocsDoDont from './DocsDoDont.svelte';
  import { Button } from '@/components/ui/button';

  /**
   * Story companheira. `doPreview` e `dontPreview` são `Snippet`, e snippet não
   * se passa como arg de um `.stories.ts` — é sintaxe de template, não valor.
   * Mesmo padrão do `DocsVariantsStory.svelte`.
   */
  let { umParSo = false }: { umParSo?: boolean } = $props();
</script>

{#snippet goodLabel()}<Button>Salvar alterações</Button>{/snippet}
{#snippet badLabel()}<Button>Clique aqui</Button>{/snippet}
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
  pairs={umParSo
    ? [
        {
          doLabel: 'Faça',
          dontLabel: 'Evite',
          doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
          dontCaption: '"Clique aqui" não diz o que acontece.',
          doPreview: goodLabel,
          dontPreview: badLabel,
        },
      ]
    : [
        {
          doLabel: 'Faça',
          dontLabel: 'Evite',
          doCaption: 'O rótulo nomeia a ação, e é legível fora de contexto.',
          dontCaption: '"Clique aqui" não diz o que acontece, e o leitor de tela anuncia só isso.',
          doPreview: goodLabel,
          dontPreview: badLabel,
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
