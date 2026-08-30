<script lang="ts">
  /**
   * A chamada de ferramenta que espera por uma PESSOA.
   *
   * É componente, e não trecho no arquivo de story, porque os controles de
   * autorização entram por `{#snippet}` — e snippet só existe dentro de
   * marcação. O ESPAÇO é do componente; os botões e o que eles significam são
   * de quem consome.
   */
  import { Button } from '@/components/ui/button';
  import { locale } from '@/lib/i18n';
  import { ChatThread } from './index';
  import { chatThreadLabelsFor } from './chat-thread.fixtures';

  const labels = $derived(chatThreadLabelsFor($locale));
</script>

{#snippet approval()}
  <Button size="sm">Autorizar</Button>
  <Button variant="outline" size="sm">Recusar</Button>
{/snippet}

<ChatThread
  {labels}
  size="md"
  messages={[
    { id: 'p', role: 'user', author: 'Você', content: 'Apaga o registro 42.' },
    {
      id: 'r',
      role: 'assistant',
      author: 'Assistente',
      content: 'Isso remove o registro para sempre. Confirma?',
      toolCalls: [
        {
          id: 'apagar',
          name: 'apagar_registro',
          state: 'pending',
          detail: 'registro: 42',
          approval,
        },
      ],
    },
  ]}
/>
