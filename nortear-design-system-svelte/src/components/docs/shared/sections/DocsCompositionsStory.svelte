<script lang="ts">
  import DocsCompositions from './DocsCompositions.svelte';
  import { Button } from '@/components/ui/button';

  /**
   * Story companheira. Existe porque `preview` é um `Snippet`, e snippet não se
   * passa como arg de um arquivo `.stories.ts` — é sintaxe de template, não
   * valor. Mesmo padrão do `DocsVariantsStory.svelte`.
   */
  let { title, note = '', useWhenLabel = 'Quando usar:', id = 'composicoes', componentSlug = '', semUseWhen = false }: {
    title: string;
    note?: string;
    useWhenLabel?: string;
    id?: string;
    componentSlug?: string;
    semUseWhen?: boolean;
  } = $props();
</script>

{#snippet par()}
  <span class="nds-cluster" data-spacing="md">
    <Button variant="outline">Cancelar</Button>
    <Button>Confirmar</Button>
  </span>
{/snippet}
{#snippet destrutiva()}<Button variant="destructive">Excluir projeto</Button>{/snippet}
{#snippet comIcone()}<Button>Salvar</Button>{/snippet}

<DocsCompositions
  {title}
  {note}
  {useWhenLabel}
  {id}
  {componentSlug}
  items={semUseWhen
    ? [
        {
          name: 'Botão com ícone',
          description: 'Ícone à esquerda do rótulo, decorativo e fora da árvore de acessibilidade.',
          preview: comIcone,
        },
      ]
    : [
        {
          name: 'Par de ações',
          description: 'Cancelar em outline à esquerda, a ação primária à direita.',
          useWhen: 'Sempre que houver uma escolha com volta. A ordem segue a leitura, e a primária fica por último.',
          code: '<Button variant="outline">Cancelar</Button>\n<Button>Confirmar</Button>',
          preview: par,
        },
        {
          name: 'Ação destrutiva confirmada',
          description: 'A variante destructive só aparece depois de um passo de confirmação.',
          useWhen: 'Quando a ação não tem volta. Solta na tela, ela vira um clique acidental caro.',
          code: '<Button variant="destructive">Excluir projeto</Button>',
          preview: destrutiva,
        },
      ]}
/>
