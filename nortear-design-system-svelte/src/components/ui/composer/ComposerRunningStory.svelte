<script lang="ts">
  /**
   * Andaime da story que precisa do estado de geração MUDANDO.
   *
   * Aqui `running` é uma PROP — não há método na raiz para a play chamar —,
   * então quem muda o estado é um controle na tela, e a play clica nele. É o
   * caminho real, e não um atalho de teste: quem sabe se a resposta está vindo é
   * quem consome.
   *
   * O andaime fica neste componente, e não no arquivo de story, porque num
   * `*.stories.ts` todo export nomeado vira story — um invólucro exportado de lá
   * apareceria na barra lateral como um item que não desenha nada.
   */
  import { Button } from '@/components/ui/button';
  import { locale } from '@/lib/i18n';
  import { Composer } from './index';
  import { composerLabelsFor } from './composer.fixtures';

  const {
    value,
    onSubmit,
    onStop,
  }: {
    value: string;
    onSubmit: (text: string) => void;
    onStop: () => void;
  } = $props();

  let running = $state(true);

  const labels = $derived(composerLabelsFor($locale));
</script>

<div>
  <Composer {labels} {value} {running} class="nds-max-w-lg" {onSubmit} {onStop} />
  <div class="nds-cluster nds-mt-4" data-spacing="sm">
    <Button
      data-slot="composer-running-toggle"
      variant="outline"
      size="sm"
      onclick={() => {
        running = !running;
      }}>Alternar geração</Button
    >
  </div>
</div>
