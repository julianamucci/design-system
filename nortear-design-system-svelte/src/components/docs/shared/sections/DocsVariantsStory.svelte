<script lang="ts">
  import DocsVariants from './DocsVariants.svelte';
  import { Button } from '@/components/ui/button';

  /**
   * Story companheira. Existe porque `preview` é um `Snippet`, e snippet não se
   * passa como arg de um arquivo `.stories.ts` — é sintaxe de template, não
   * valor. Mesmo padrão do `AspectRatioStory.svelte`.
   *
   * O snippet é declarado aqui e referenciado dentro do item, que é o que faz o
   * preview andar JUNTO do dado em vez de depender de um índice, como no Vue.
   */
  let { title, note = '', id = 'variantes', componentSlug = '', apenasUm = false }: {
    title: string;
    note?: string;
    id?: string;
    componentSlug?: string;
    apenasUm?: boolean;
  } = $props();
</script>

{#snippet salvar()}<Button>Salvar</Button>{/snippet}
{#snippet cancelar()}<Button variant="outline">Cancelar</Button>{/snippet}
{#snippet excluir()}<Button variant="destructive">Excluir</Button>{/snippet}
{#snippet editar()}<Button variant="ghost">Editar</Button>{/snippet}

<DocsVariants
  {title}
  {note}
  {id}
  {componentSlug}
  items={apenasUm
    ? [
        {
          name: 'ghost',
          description: 'Sem fundo e sem contorno até o hover. Para ação terciária dentro de barra densa.',
          preview: editar,
        },
      ]
    : [
        {
          name: 'default',
          description: 'A ação primária do bloco. Uma por tela — duas competem, e a pessoa para para escolher.',
          code: '<Button>Salvar</Button>',
          preview: salvar,
        },
        {
          name: 'outline',
          description: 'Ação secundária que ainda precisa de contorno. Convive com a primária sem disputá-la.',
          code: '<Button variant="outline">Cancelar</Button>',
          preview: cancelar,
        },
        {
          name: 'destructive',
          description: 'Só para o que não tem volta. Dentro de um AlertDialog, nunca solta na tela.',
          code: '<Button variant="destructive">Excluir</Button>',
          preview: excluir,
        },
      ]}
/>
